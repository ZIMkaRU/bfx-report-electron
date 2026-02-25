'use strict'

const path = require('node:path')
const {
  createWriteStream,
  promises: {
    readFile,
    mkdir,
    realpath,
    symlink
  },
  constants: {
    S_IFMT,
    S_IFDIR,
    S_IFLNK
  }
} = require('node:original-fs')
const { promisify } = require('node:util')
const { pipeline } = require('node:stream/promises')
const yauzl = require('yauzl')
const getStreamPromise = import('get-stream')

const openZip = promisify(yauzl.fromBuffer)

class Extractor {
  #isCanceled = false
  #zipfile

  constructor (zipPath, opts) {
    this.zipPath = zipPath
    this.opts = opts ?? {}
  }

  async extract () {
    const buffer = await readFile(this.zipPath)
    this.#zipfile = await openZip(buffer, { lazyEntries: true })
    this.#isCanceled = false

    return new Promise((resolve, reject) => {
      this.#zipfile.on('error', err => {
        this.#isCanceled = true

        reject(err)
      })

      this.#zipfile.readEntry()

      this.#zipfile.on('end', () => {
        if (!this.#isCanceled) {
          resolve()
        }
      })

      this.#zipfile.on('entry', async entry => {
        if (this.#isCanceled) {
          return
        }

        if (entry.fileName.startsWith('__MACOSX/')) {
          this.#zipfile.readEntry()

          return
        }

        const destDir = path.dirname(path.join(
          this.opts.dir,
          entry.fileName
        ))

        try {
          await mkdir(destDir, { recursive: true })

          const canonicalDestDir = await realpath(destDir)
          const relativeDestDir = path.relative(
            this.opts.dir,
            canonicalDestDir
          )

          if (relativeDestDir.split(path.sep).includes('..')) {
            throw new Error(`Out of bound path "${canonicalDestDir}" found while processing file ${entry.fileName}`)
          }

          await this.#extractEntry(entry)
          this.#zipfile.readEntry()
        } catch (err) {
          this.#isCanceled = true
          this.#zipfile.close()

          reject(err)
        }
      })
    })
  }

  async #extractEntry (entry) {
    if (this.#isCanceled) {
      return
    }

    if (typeof this.opts.onEntry === 'function') {
      this.opts.onEntry(entry, this.#zipfile)
    }

    const dest = path.join(this.opts.dir, entry.fileName)

    /*
     * convert external file attr int into a fs stat mode int
     * https://github.com/thejoshwolfe/yauzl/issues/57
     * https://github.com/thejoshwolfe/yazl/blob/master/README.md#external-file-attributes
     * https://github.com/thejoshwolfe/yauzl/issues/101#issuecomment-448073570
     */
    const mode = (entry.externalFileAttributes >> 16) & 0xFFFF
    // check if it's a symlink or dir (using stat mode constants)
    // https://github.com/thejoshwolfe/yauzl/issues/94#issuecomment-1983447854
    const isSymlink = (mode & S_IFMT) === S_IFLNK
    let isDir = (mode & S_IFMT) === S_IFDIR

    // Failsafe, borrowed from jsZip
    if (
      !isDir &&
      entry.fileName.endsWith('/')
    ) {
      isDir = true
    }

    // check for windows weird way of specifying a directory
    // https://github.com/maxogden/extract-zip/issues/13#issuecomment-154494566
    const madeBy = entry.versionMadeBy >> 8
    if (!isDir) {
      isDir = (
        madeBy === 0 &&
        entry.externalFileAttributes === 16
      )
    }

    const procMode = this.#getExtractedMode({ mode, isDir }) & 0o777

    // always ensure folders are created
    const destDir = isDir ? dest : path.dirname(dest)
    const mkdirOptions = {
      recursive: true,
      ...(isDir ? { mode: procMode } : {})
    }

    await mkdir(destDir, mkdirOptions)

    if (isDir) {
      return
    }

    const readStream = await promisify(this.#zipfile.openReadStream
      .bind(this.#zipfile))(entry)

    if (isSymlink) {
      const { default: getStream } = await getStreamPromise
      const link = await getStream(readStream)
      await symlink(link, dest)

      return
    }

    await pipeline(readStream, createWriteStream(dest, { mode: procMode }))
  }

  #getExtractedMode (args) {
    const { mode: entryMode, isDir } = args ?? {}

    if (entryMode !== 0) {
      return entryMode
    }
    if (isDir) {
      const mode = this.opts.defaultDirMode
        ? Number.parseInt(this.opts.defaultDirMode, 10)
        : entryMode

      if (!mode) {
        return 0o755
      }

      return mode
    }

    const mode = this.opts.defaultFileMode
      ? Number.parseInt(this.opts.defaultFileMode, 10)
      : entryMode

    if (!mode) {
      return 0o644
    }

    return mode
  }
}

module.exports = async (zipPath, opts) => {
  if (!path.isAbsolute(opts?.dir)) {
    throw new Error('Target directory is expected to be absolute')
  }

  await mkdir(opts?.dir, { recursive: true })
  const _opts = {
    ...opts,
    dir: await realpath(opts?.dir)
  }

  return new Extractor(zipPath, _opts).extract()
}
