'use strict'

/**
 * TODO:
 *   - refactoring: need to divide into separate files
 *   - need to fix zip end detection
 */
const path = require('node:path')
const originalFs = require('node:original-fs')
const { promisify } = require('node:util')
const { pipeline } = require('node:stream/promises')
const yauzl = require('yauzl')
const getStreamPromise = import('get-stream')

const openZip = promisify(yauzl.fromBuffer)

class Extractor {
  constructor (zipPath, opts) {
    this.zipPath = zipPath
    this.opts = opts
  }

  async extract () {
    const buffer = await originalFs.promises.readFile(this.zipPath)
    this.zipfile = await openZip(buffer, { lazyEntries: true })
    this.canceled = false

    return new Promise((resolve, reject) => {
      this.zipfile.on('error', err => {
        this.canceled = true
        reject(err)
      })
      this.zipfile.readEntry()

      this.zipfile.on('close', () => {
        if (!this.canceled) {
          resolve()
        }
      })

      this.zipfile.on('entry', async entry => {
        if (this.canceled) {
          return
        }

        if (entry.fileName.startsWith('__MACOSX/')) {
          this.zipfile.readEntry()
          return
        }

        const destDir = path.dirname(path.join(this.opts.dir, entry.fileName))

        try {
          await originalFs.promises.mkdir(destDir, { recursive: true })

          const canonicalDestDir = await originalFs.promises.realpath(destDir)
          const relativeDestDir = path.relative(this.opts.dir, canonicalDestDir)

          if (relativeDestDir.split(path.sep).includes('..')) {
            throw new Error(`Out of bound path "${canonicalDestDir}" found while processing file ${entry.fileName}`)
          }

          await this.extractEntry(entry)
          this.zipfile.readEntry()
        } catch (err) {
          this.canceled = true
          this.zipfile.close()
          reject(err)
        }
      })
    })
  }

  async extractEntry (entry) {
    if (this.canceled) {
      return
    }

    if (this.opts.onEntry) {
      this.opts.onEntry(entry, this.zipfile)
    }

    const dest = path.join(this.opts.dir, entry.fileName)

    // convert external file attr int into a fs stat mode int
    const mode = (entry.externalFileAttributes >> 16) & 0xFFFF
    // check if it's a symlink or dir (using stat mode constants)
    const IFMT = 61440
    const IFDIR = 16384
    const IFLNK = 40960
    const symlink = (mode & IFMT) === IFLNK
    let isDir = (mode & IFMT) === IFDIR

    // Failsafe, borrowed from jsZip
    if (!isDir && entry.fileName.endsWith('/')) {
      isDir = true
    }

    // check for windows weird way of specifying a directory
    // https://github.com/maxogden/extract-zip/issues/13#issuecomment-154494566
    const madeBy = entry.versionMadeBy >> 8
    if (!isDir) isDir = (madeBy === 0 && entry.externalFileAttributes === 16)

    const procMode = this.getExtractedMode(mode, isDir) & 0o777

    // always ensure folders are created
    const destDir = isDir ? dest : path.dirname(dest)

    const mkdirOptions = { recursive: true }
    if (isDir) {
      mkdirOptions.mode = procMode
    }
    await originalFs.promises.mkdir(destDir, mkdirOptions)
    if (isDir) return

    const readStream = await promisify(this.zipfile.openReadStream.bind(this.zipfile))(entry)

    if (symlink) {
      const { default: getStream } = await getStreamPromise
      const link = await getStream(readStream)
      await originalFs.promises.symlink(link, dest)
    } else {
      await pipeline(readStream, originalFs.createWriteStream(dest, { mode: procMode }))
    }
  }

  getExtractedMode (entryMode, isDir) {
    let mode = entryMode
    // Set defaults, if necessary
    if (mode === 0) {
      if (isDir) {
        if (this.opts.defaultDirMode) {
          mode = parseInt(this.opts.defaultDirMode, 10)
        }

        if (!mode) {
          mode = 0o755
        }
      } else {
        if (this.opts.defaultFileMode) {
          mode = parseInt(this.opts.defaultFileMode, 10)
        }

        if (!mode) {
          mode = 0o644
        }
      }
    }

    return mode
  }
}

const extractWithOriginFs = async function (zipPath, opts) {
  if (!path.isAbsolute(opts.dir)) {
    throw new Error('Target directory is expected to be absolute')
  }

  await originalFs.promises.mkdir(opts.dir, { recursive: true })
  opts.dir = await originalFs.promises.realpath(opts.dir)
  return new Extractor(zipPath, opts).extract()
}

module.exports = {
  extractWithOriginFs
}
