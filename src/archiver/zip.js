'use strict'

const fs = require('node:fs')
const path = require('node:path')
const archiver = require('archiver')

const { bytesToSize } = require('./helpers')

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

module.exports = async (
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
