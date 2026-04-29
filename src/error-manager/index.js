'use strict'

const { app } = require('electron')
const os = require('os')
const i18next = require('i18next')

const {
  errorTesters: { isDocumentsPathGettingError },
  shouldLogBeSkipped,
  shouldErrorModalWinBeSuppressed
} = require('./log-exclusions')
const cleanStack = require('./clean-stack')
const log = require('./log')
const getErrorDescription = require('./get-error-description')
const showModalDialog = require('./show-modal-dialog')
const renderMarkdownTemplate = require('./render-markdown-template')
const openNewGithubIssue = require('./open-new-github-issue')
const collectLogs = require('./collect-logs')
const getDebugInfo = require('../helpers/get-debug-info')
const {
  IS_DEV
} = require('../helpers/env-identifiers')

const MENU_ITEM_IDS = require('../create-menu/menu.item.ids')
const { changeMenuItemStatesById } = require('../create-menu/utils')

let _isLocked = false
let _isIssueAutoManagerLocked = false
let caughtError

const _manageErrorLogLevel = async (error) => {
  try {
    if (
      !error ||
      typeof error !== 'string'
    ) {
      return
    }

    caughtError = error

    if (_isIssueAutoManagerLocked) {
      return
    }

    _isIssueAutoManagerLocked = true

    setTimeout(() => {
      _isIssueAutoManagerLocked = false

      if (
        !caughtError ||
        typeof caughtError !== 'string'
      ) {
        return
      }

      _manageErrorLogLevel(caughtError)
    }, 30 * 60 * 1000).unref()

    const isReported = await manageNewGithubIssue({ error })

    if (isReported) {
      caughtError = null
    }
  } catch (err) {
    _isIssueAutoManagerLocked = false

    console.error(err)
  }
}

const _lockIssueManager = () => {
  _isLocked = true

  changeMenuItemStatesById(
    MENU_ITEM_IDS.REPORT_BUG_MENU_ITEM,
    { enabled: false }
  )
}

const _unlockIssueManager = () => {
  _isLocked = false

  changeMenuItemStatesById(
    MENU_ITEM_IDS.REPORT_BUG_MENU_ITEM,
    { enabled: true }
  )
}

const manageNewGithubIssue = async (params) => {
  try {
    if (_isLocked) {
      return false
    }

    _lockIssueManager()

    const debugInfo = getDebugInfo()
    const logs = await collectLogs()

    const {
      title,
      description,
      errBoxTitle,
      errBoxDescription
    } = getErrorDescription(params)

    const mdIssue = renderMarkdownTemplate(
      {
        title,
        description,
        ...params,
        ...debugInfo
      },
      logs
    )

    const {
      isExit,
      isReported
    } = await showModalDialog({
      errBoxTitle,
      errBoxDescription,
      mdIssue
    })

    if (isReported) {
      await openNewGithubIssue({
        title,
        body: mdIssue
      })
    }
    if (isExit) {
      app.quit()
    }

    _unlockIssueManager()

    return isReported
  } catch (err) {
    _unlockIssueManager()
    _isIssueAutoManagerLocked = false

    console.error(err)
  }
}

const initLogger = () => {
  log.transports.ipc.level = false
  log.transports.console.level = IS_DEV
    ? 'debug'
    : 'warn'
  log.transports.file.level = IS_DEV
    ? 'info'
    : 'warn'

  // Clean up error stack traces for file transport
  log.hooks.push((message, transport) => {
    if (
      transport !== log.transports.file ||
      !Array.isArray(message.data) ||
      message.data.length === 0
    ) {
      return message
    }
    if (message.data.some((val) => shouldLogBeSkipped(val))) {
      return false
    }

    message.data = message.data.map((val) => {
      if (typeof val === 'string') {
        return cleanStack(val)
      }
      if (val instanceof Error) {
        const str = typeof val.stack === 'string'
          ? val.stack
          : val.toString()

        return cleanStack(str)
      }

      return val
    })

    if (message.level === 'error') {
      const error = message.data.join(os.EOL)

      if (isDocumentsPathGettingError(error)) {
        const title = i18next.t('errorManager.failedToGetDocsPath.title')
        const msg = i18next.t('errorManager.failedToGetDocsPath.message')

        showModalDialog({
          errBoxTitle: title,
          errBoxDescription: msg,
          mdIssue: msg,
          alertOpts: {
            icon: 'error',
            title,
            showConfirmButton: false,
            hasNoParentWin: true
          }
        })
          .then(() => { app.exit() })
          .catch((err) => { console.error(err) })

        return
      }
      if (shouldErrorModalWinBeSuppressed(error)) {
        return message
      }

      _manageErrorLogLevel(error)
    }

    return message
  })

  // Override console.log and console.error etc
  Object.assign(console, log.functions)

  // Catch and log unhandled errors/rejected promises
  log.catchErrors({
    showDialog: false,
    onError (error) {
      manageNewGithubIssue({ error })
    }
  })

  return log
}

module.exports = {
  get log () { return log },

  initLogger,
  manageNewGithubIssue
}
