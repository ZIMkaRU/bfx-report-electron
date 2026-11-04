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

const messageManager = new MessageManager()
let controller = null
let dialogPromise = null

// TODO: Use custom modal window first
const _showErrorBox = async (win, title = '', message = '') => {
  const commonTitle = i18next.t('showErrorModalDialog.title')
  const { plainText, html } = messageManager
    .setMessage({ title, message })
    .getMessages()

  return await _showNativeMessageDialog(
    win,
    { commonTitle, plainText }
  )
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
  const result = await currDialogPromise

  if (dialogPromise === currDialogPromise) {
    dialogPromise = null
    controller = null
  }

  return result
}

module.exports = async (win, title = 'Error', err) => {
  if (err.code === 'ENOENT') {
    const message = i18next.t('showErrorModalDialog.enoentErrorMessage')
    const content = (err.syscall && err.path)
      ? `${message}, ${err.syscall}: '${err.path}'`
      : message

    return _showErrorBox(win, title, content)
  }
  if (err.code === 'EACCES') {
    const message = i18next.t('showErrorModalDialog.eaccesErrorMessage')
    const content = (err.syscall && err.path)
      ? `${message}, ${err.syscall}: '${err.path}'`
      : message

    return _showErrorBox(win, title, content)
  }
  if (err instanceof InvalidFilePathError) {
    const message = i18next.t('showErrorModalDialog.invalidFilePathErrorMessage')

    return _showErrorBox(win, title, message)
  }
  if (err instanceof InvalidFileNameInArchiveError) {
    const message = i18next.t('showErrorModalDialog.invalidFileNameInArchErrorMessage')

    return _showErrorBox(win, title, message)
  }
  if (
    err instanceof DbImportingError ||
    err instanceof InvalidFolderPathError
  ) {
    const message = i18next.t('showErrorModalDialog.dbImportingErrorMessage')

    return _showErrorBox(win, title, message)
  }
  if (err instanceof DbRemovingError) {
    const message = i18next.t('showErrorModalDialog.dbRemovingErrorMessage')

    return _showErrorBox(win, title, message)
  }
  if (err instanceof ReportsFolderChangingError) {
    const message = i18next.t('showErrorModalDialog.reportsFolderChangingErrorMessage')

    return _showErrorBox(win, title, message)
  }
  if (err instanceof SyncFrequencyChangingError) {
    const message = i18next.t('showErrorModalDialog.syncFrequencyChangingErrorMessage')

    return _showErrorBox(win, title, message)
  }

  const message = i18next.t('showErrorModalDialog.unexpectedExceptionMessage')

  return _showErrorBox(win, title, message)
}
