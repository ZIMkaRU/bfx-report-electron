'use strict'

const PLATFORMS = {
  MAC: 'darwin',
  LINUX: 'linux',
  WIN: 'win32'
}

const IS_MAC = process.platform === PLATFORMS.MAC
const IS_LINUX = process.platform === PLATFORMS.LINUX
const IS_WIN = process.platform === PLATFORMS.WIN

module.exports = {
  PLATFORMS,
  IS_MAC,
  IS_LINUX,
  IS_WIN
}
