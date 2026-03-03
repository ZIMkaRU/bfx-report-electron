'use strict'

const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

const bytesToSize = (bytes) => {
  if (bytes <= 0) {
    return '0 Byte'
  }

  const i = Number.parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  const val = Math.round(bytes / Math.pow(1024, i), 2)
  const size = sizes[i]

  return `${val} ${size}`
}

module.exports = {
  bytesToSize
}
