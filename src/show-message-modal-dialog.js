'use strict'

const { dialog, BrowserWindow } = require('electron')
const i18next = require('i18next')

const wins = require('./window-creators/windows')
const WINDOW_NAMES = require('./window-creators/window.names')
const isMainWinAvailable = require('./helpers/is-main-win-available')
const {
  showWindow
} = require('./helpers/manage-window')

module.exports = async (win, opts = {}) => {
  const defaultWin = isMainWinAvailable(wins[WINDOW_NAMES.MAIN_WINDOW])
    ? WINDOW_NAMES.MAIN_WINDOW
    : BrowserWindow.getFocusedWindow()
  const parentWin = win && typeof win === 'object'
    ? win
    : defaultWin

  if (opts?.shouldParentWindowBeShown) {
    await showWindow(win)
  }

  const {
    response: btnId,
    checkboxChecked
  } = await dialog.showMessageBox(parentWin, {
    type: 'info',
    buttons: [
      i18next.t('common.cancelButtonText'),
      i18next.t('common.confirmButtonText')
    ],
    defaultId: 1,
    cancelId: 0,
    title: '',
    message: '',
    detail: '',
    ...opts
  })

  return {
    btnId,
    checkboxChecked
  }
}
