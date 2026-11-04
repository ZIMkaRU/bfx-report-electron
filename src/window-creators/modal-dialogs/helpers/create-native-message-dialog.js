'use strict'

const { dialog, BrowserWindow } = require('electron')
const i18next = require('i18next')

const wins = require('../../windows')
const WINDOW_NAMES = require('../../window.names')
const isMainWinAvailable = require('../../../helpers/is-main-win-available')

module.exports = async (win, opts = {}) => {
  const defaultWin = isMainWinAvailable(wins[WINDOW_NAMES.MAIN_WINDOW])
    ? wins[WINDOW_NAMES.MAIN_WINDOW]
    : BrowserWindow.getFocusedWindow()
  const parentWin = win ?? defaultWin

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
