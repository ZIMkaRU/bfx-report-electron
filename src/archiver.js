'use strict'

const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const yauzl = require('yauzl')

const {
  InvalidFileNameInArchiveError
} = require('./errors')

const getTotalFilesStats = async (filePaths) => {
  const promises = filePaths.map((filePath) => {
    return fs.promises.stat(filePath)
  })
  const stats = await Promise.all(promises)
  const size = stats.reduce((size, stat) => {
    return Number.isFinite(stat?.size)
      ? size + stat.size
      : size
  }, 0)

  return {
    size,
    stats
  }
}

const bytesToSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  if (bytes <= 0) {
    return '0 Byte'
  }

  const i = Number.parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  const val = Math.round(bytes / Math.pow(1024, i), 2)
  const size = sizes[i]

  return `${val} ${size}`
}

const zip = async (
  zipPath,
  filePaths,
  params
) => {
  const _filePaths = Array.isArray(filePaths)
    ? filePaths
    : [filePaths]
  const {
    size,
    stats
  } = await getTotalFilesStats(_filePaths)

  return new Promise((_resolve, _reject) => {
    let interval = null
    const resolve = (...args) => {
      clearInterval(interval)
      return _resolve(...args)
    }
    const reject = (err) => {
      clearInterval(interval)
      return _reject(err)
    }

    try {
      const {
        zlib,
        progressHandler
      } = params ?? {}
      const _params = {
        ...params,
        zlib: {
          level: 9,
          ...zlib
        }
      }

      const output = fs.createWriteStream(zipPath)
      const archive = archiver('zip', _params)

      output.on('close', resolve)
      output.on('error', reject)
      archive.on('error', reject)
      archive.on('warning', reject)

      if (typeof progressHandler === 'function') {
        let processedBytes = 0

        const asyncProgressHandler = async () => {
          try {
            if (
              !Number.isFinite(size) ||
              size === 0 ||
              !Number.isFinite(processedBytes)
            ) {
              return
            }

            const progress = processedBytes / size
            const archiveBytes = archive.pointer()
            const prettyArchiveSize = bytesToSize(archiveBytes)

            await progressHandler({
              progress,
              archiveBytes,
              prettyArchiveSize
            })
          } catch (err) {
            console.debug(err)
          }
        }

        archive.on('progress', async (e) => {
          processedBytes = e.fs.processedBytes ?? 0
          await asyncProgressHandler()
        })
        interval = setInterval(asyncProgressHandler, 3000)
      }

      archive.pipe(output)

      for (const [i, filePath] of _filePaths.entries()) {
        const readStream = fs.createReadStream(filePath)
        const name = path.basename(filePath)

        readStream.on('error', reject)

        archive.append(readStream, { name, stats: stats[i] })
      }

      archive.finalize()
    } catch (err) {
      reject(err)
    }
  })
}

const unzip = (
  zipPath,
  folderPath,
  params
) => {
  const {
    extractFiles,
    progressHandler
  } = params ?? {}
  return new Promise((_resolve, _reject) => {
    const entryStates = []
    let totalUncompressedSize = 0
    let unzippedBytes = 0
    let lastProgressEventMts = Date.now()

    const asyncProgressHandler = async () => {
      try {
        if (typeof progressHandler !== 'function') {
          return
        }

        if (
          !Number.isFinite(totalUncompressedSize) ||
          totalUncompressedSize === 0 ||
          !Number.isFinite(unzippedBytes)
        ) {
          return
        }

        const progress = unzippedBytes / totalUncompressedSize
        const prettyUnzippedBytes = bytesToSize(unzippedBytes)

        await progressHandler({
          progress,
          unzippedBytes,
          prettyUnzippedBytes
        })
      } catch (err) {
        console.debug(err)
      }
    }
    const resolve = (entryState) => {
      if (entryState) {
        entryState.isClosedSuccessfully = true
      }
      if (
        entryStates.some((state) => state?.isClosedWithError) ||
        entryStates.some((state) => !state?.isClosedSuccessfully)
      ) {
        return
      }

      asyncProgressHandler()

      return _resolve(entryStates.map((state) => state?.entry?.fileName))
    }
    const reject = (err, zipfile, entryState) => {
      if (entryState) {
        entryState.isClosedWithError = true
      }
      if (zipfile) {
        zipfile.close()
      }

      return _reject(err)
    }

    try {
      yauzl.open(zipPath, { lazyEntries: false }, (err, zipfile) => {
        if (err) {
          reject(err)

          return
        }

        zipfile.on('error', reject)
        zipfile.on('end', () => resolve())
        zipfile.on('entry', (entry) => {
          const { fileName } = entry
          const filePath = path.join(folderPath, fileName)
          const errorMessage = yauzl.validateFileName(fileName)

          if (/\/$/.test(fileName)) {
            return
          }
          if (
            Array.isArray(extractFiles) &&
            extractFiles.every(file => file !== fileName)
          ) {
            return
          }

          const entryState = {
            isClosedWithError: false,
            isClosedSuccessfully: false,
            entry
          }
          totalUncompressedSize += entry?.uncompressedSize ?? 0
          entryStates.push(entryState)

          if (errorMessage) {
            reject(
              new InvalidFileNameInArchiveError(errorMessage),
              zipfile,
              entryState
            )

            return
          }

          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              reject(err, zipfile, entryState)

              return
            }

            const output = fs.createWriteStream(filePath)

            output.on('close', () => resolve(entryState))
            output.on('error', (err) => {
              reject(err, zipfile, entryState)
            })

            readStream.on('error', (err) => {
              reject(err, zipfile, entryState)
            })
            readStream.on('data', (chunk) => {
              unzippedBytes += chunk.length
              const currMts = Date.now()

              if (currMts - lastProgressEventMts < 500) {
                return
              }

              lastProgressEventMts = currMts
              asyncProgressHandler()
            })

            readStream.pipe(output)
          })
        })
      })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * TODO:
 *   - refactoring: need to divide into separate files
 *   - need to fix zip end detection
 */
const originalFs = require('node:original-fs')
const getStreamPromise = import('get-stream')
const { promisify } = require('node:util')
const { pipeline } = require('node:stream/promises')

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
  zip,
  unzip,
  extractWithOriginFs
}
