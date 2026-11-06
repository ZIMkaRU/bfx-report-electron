'use strict'

const i18next = require('i18next')

const {
  InvalidFilePathError,
  InvalidFileNameInArchiveError,
  DbImportingError,
  DbRemovingError,
  InvalidFolderPathError,
  ReportsFolderChangingError,
  SyncFrequencyChangingError
} = require('../../errors')
const {
  createNativeMessageDialog,
  MessageManager
} = require('./helpers')
const { createErrorModalWindow } = require('../')
const wins = require('../windows')
const WINDOW_NAMES = require('../window.names')
const ErrorModalIpcChannelHandlers = require(
  '../main-renderer-ipc-bridge/error-modal-ipc-channel-handlers'
)
const { isMainWinAvailable } = require('../../helpers')

const messageManager = new MessageManager()
let errModalWinPromise = null
let controller = null
let dialogPromise = null

const _showErrorBox = async (win, title = '', message = '') => {
  const commonTitle = i18next.t('showErrorModalDialog.title')
  const { plainText, html } = messageManager
    .setMessage({ title, message })
    .getMessages()

  try {
    const args = {
      title: commonTitle,
      text: html,
      showConfirmButton: true,
      confirmButtonText: i18next.t('common.confirmButtonText'),
      textClassName: 'error-modal-dialog'
    }

    if (isMainWinAvailable(wins[WINDOW_NAMES.ERROR_MODAL_WINDOW])) {
      await ErrorModalIpcChannelHandlers.sendFireModalEvent(null, args)
      await errModalWinPromise

      return
    }

    errModalWinPromise = createErrorModalWindow(
      args,
      {
        width: 500,
        height: 400
      }
    )

    try {
      await errModalWinPromise
    } finally {
      errModalWinPromise = null
    }
  } catch (err) {
    console.debug(err)

    // Back compatibility if no possible to create a browser window
    await _showNativeMessageDialog(
      win,
      { commonTitle, plainText }
    )
  }
}

const _showNativeMessageDialog = async (win, args) => {
  const { commonTitle, plainText } = args ?? {}

  if (controller) {
    controller.abort()

    // We wait for the OS to completely erase the old window from the screen
    try {
      await dialogPromise
    } catch (e) {}
  }

  controller = new AbortController()

  const currDialogPromise = createNativeMessageDialog(win, {
    type: 'error',
    buttons: [
      i18next.t('common.confirmButtonText')
    ],
    defaultId: 0,
    cancelId: 0,
    title: commonTitle,
    message: plainText,
    signal: controller.signal
  })
  dialogPromise = currDialogPromise

  try {
    await currDialogPromise
  } finally {
    if (dialogPromise === currDialogPromise) {
      dialogPromise = null
      controller = null
    }
  }
}

module.exports = async (win, title = 'Error', err) => {
  if (err.code === 'ENOENT') {
    const message = i18next.t('showErrorModalDialog.enoentErrorMessage')
    const content = (err.syscall && err.path)
      ? `${message}, ${err.syscall}: '${err.path}'`
      : message

    await _showErrorBox(win, title, content)

    return
  }
  if (err.code === 'EACCES') {
    const message = i18next.t('showErrorModalDialog.eaccesErrorMessage')
    const content = (err.syscall && err.path)
      ? `${message}, ${err.syscall}: '${err.path}'`
      : message

    await _showErrorBox(win, title, content)

    return
  }
  if (err instanceof InvalidFilePathError) {
    const message = i18next.t('showErrorModalDialog.invalidFilePathErrorMessage')

    await _showErrorBox(win, title, message)

    return
  }
  if (err instanceof InvalidFileNameInArchiveError) {
    const message = i18next.t('showErrorModalDialog.invalidFileNameInArchErrorMessage')

    await _showErrorBox(win, title, message)

    return
  }
  if (
    err instanceof DbImportingError ||
    err instanceof InvalidFolderPathError
  ) {
    const message = i18next.t('showErrorModalDialog.dbImportingErrorMessage')

    await _showErrorBox(win, title, message)

    return
  }
  if (err instanceof DbRemovingError) {
    const message = i18next.t('showErrorModalDialog.dbRemovingErrorMessage')

    await _showErrorBox(win, title, message)

    return
  }
  if (err instanceof ReportsFolderChangingError) {
    const message = i18next.t('showErrorModalDialog.reportsFolderChangingErrorMessage')

    await _showErrorBox(win, title, message)

    return
  }
  if (err instanceof SyncFrequencyChangingError) {
    const message = i18next.t('showErrorModalDialog.syncFrequencyChangingErrorMessage')

    await _showErrorBox(win, title, message)

    return
  }

  const message = i18next.t('showErrorModalDialog.unexpectedExceptionMessage')

  await _showErrorBox(win, title, message)
}
