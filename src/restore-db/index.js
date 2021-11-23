'use strict'

const { app, screen, remote } = require('electron')
const fs = require('fs')
const path = require('path')
const Alert = require('electron-alert')
const { rootPath } = require('electron-root-path')

const ipcs = require('../ipcs')
const wins = require('../windows')
const {
  deserializeError
} = require('../helpers/utils')

const fontsStyle = fs.readFileSync(path.join(
  rootPath, 'bfx-report-ui/build/fonts/roboto.css'
))
const alertStyle = fs.readFileSync(path.join(
  __dirname, '../modal-dialog-src/modal-dialog.css'
))
const alertScript = fs.readFileSync(path.join(
  __dirname, '../modal-dialog-src/modal-dialog.js'
))

const fonts = `<style>${fontsStyle}</style>`
const style = `<style>${alertStyle}</style>`
const script = `<script type="text/javascript">${alertScript}</script>`
const sound = { freq: 'F2', type: 'triange', duration: 1.5 }

const _isMainWinAvailable = () => {
  return (
    wins.mainWindow &&
    typeof wins.mainWindow === 'object' &&
    !wins.mainWindow.isDestroyed()
  )
}

const _closeAlert = (alert) => {
  if (
    !alert ||
    !alert.browserWindow
  ) return

  alert.browserWindow.hide()
  alert.browserWindow.close()
}

const _fireAlert = (params) => {
  const {
    title = 'Select DB backup file',
    backupFilesMetadata
  } = params
  const win = wins.mainWindow

  if (!_isMainWinAvailable()) {
    return { value: false }
  }

  const inputOptions = backupFilesMetadata.reduce((accum, item) => {
    accum[item?.name] = item?.name

    return accum
  }, {})
  const inputValue = backupFilesMetadata[0]?.name

  const _screen = screen || remote.screen
  const {
    getCursorScreenPoint,
    getDisplayNearestPoint
  } = _screen
  const {
    workArea
  } = getDisplayNearestPoint(getCursorScreenPoint())
  const { height: screenHeight } = workArea
  const maxHeight = Math.floor(screenHeight * 0.90)

  const alert = new Alert([fonts, style, script])
  const _close = () => _closeAlert(alert)

  win.once('closed', _close)

  const bwOptions = {
    frame: false,
    transparent: false,
    thickFrame: false,
    closable: false,
    hasShadow: false,
    backgroundColor: '#172d3e',
    darkTheme: false,
    parent: win,
    modal: true,
    width: 1000,
    webPreferences: {
      contextIsolation: false
    }
  }
  const swalOptions = {
    position: 'center',
    allowOutsideClick: false,
    backdrop: 'rgba(0,0,0,0.0)',
    customClass: {
      title: 'titleColor',
      content: 'select-db-backup textColor',
      input: 'textColor radioInput'
    },

    type: 'question',
    title,
    showConfirmButton: true,
    focusCancel: true,
    showCancelButton: true,
    cancelButtonText: 'Cancel',
    timerProgressBar: false,

    input: 'radio',
    inputValue,
    inputOptions,

    onBeforeOpen: () => {
      if (
        !alert ||
        !alert.browserWindow
      ) return

      alert.browserWindow.hide()
    },
    onOpen: () => {
      if (
        !alert ||
        !alert.browserWindow
      ) return

      alert.browserWindow.show()
      const { height } = alert.browserWindow
        .getContentBounds()
      alert.browserWindow.setBounds({
        height: height > maxHeight
          ? maxHeight
          : height
      })
    },
    onClose: () => {
      if (
        !alert ||
        !alert.browserWindow
      ) return

      alert.browserWindow.hide()
    },
    onAfterClose: () => {
      win.removeListener('closed', _close)
    }
  }

  const res = alert.fire(
    swalOptions,
    bwOptions,
    null,
    true,
    false,
    sound
  )

  return res
}

const _getBackupFilesMetadata = (ipc) => {
  return new Promise((resolve, reject) => {
    try {
      let interval = null

      const rmHandler = () => {
        ipc.off('message', handler)
        clearInterval(interval)
      }
      const handler = (mess) => {
        if (mess?.state !== 'response:get-backup-files-metadata') {
          return
        }

        const { data } = mess

        interval = setInterval(() => {
          rmHandler()
          reject(new Error()) // TODO:
        }, 30 * 1000).unref()

        if (data?.err) {
          rmHandler()
          reject(deserializeError(data.err))

          return
        }

        rmHandler()
        resolve(data?.backupFilesMetadata)
      }

      ipc.on('message', handler)
      ipc.send({
        state: 'request:get-backup-files-metadata'
      })
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = () => {
  return async () => {
    try {
      if (
        !app.isReady() ||
        !_isMainWinAvailable()
      ) {
        throw new Error() // TODO:
      }

      const backupFilesMetadata = await _getBackupFilesMetadata(
        ipcs.serverIpc
      )

      if (
        !Array.isArray(backupFilesMetadata) ||
        backupFilesMetadata.length === 0
      ) {
        throw new Error() // TODO:
      }

      const res = await _fireAlert({ backupFilesMetadata })

      if (
        !res?.value ||
        typeof res?.value !== 'string'
      ) {
        return
      }

      ipcs.serverIpc.send({
        state: 'restore-db',
        data: { name: res.value }
      })
    } catch (err) {
      console.error(err)
    }
  }
}
