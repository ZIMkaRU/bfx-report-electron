'use strict'

const path = require('node:path')
let app

try {
  app = require('electron').app
} catch (err) {}

const _nonElectronRoot = path.join(__dirname, '../..')
const nonElectronRoot = _nonElectronRoot.endsWith('.asar.unpacked')
  ? _nonElectronRoot.replace('.asar.unpacked', '.asar')
  : _nonElectronRoot

/*
 * Examples (for no asar it will be without `.asar` at the end):
 *   - Dev: /home/user/bfx-report-electron
 *   - macOS DMG and ZIP (asar): /Applications/Bitfinex Report.app/Contents/Resources/app.asar
 *   - Windows NSIS (asar): C:\Users\user\AppData\Local\Programs\bfx-report-electron\resources\app.asar
 *   - Ubuntu DEB (asar): /opt/Bitfinex Report/resources/app.asar
 *   - Ubuntu AppImage (asar): /tmp/.mount_Bitfinex Report/resources/app.asar
 */
const rootPath = app?.getAppPath() ??
  // for non electron env
  nonElectronRoot
const isAsar = rootPath.endsWith('.asar')
const unpackedPath = isAsar
  ? rootPath.replace('.asar', '.asar.unpacked')
  : rootPath
const serverCwd = isAsar
  // needs to provide real path, asar is virtual
  ? process.resourcesPath
  : rootPath

module.exports = {
  rootPath,
  isAsar,
  unpackedPath,
  serverCwd
}
