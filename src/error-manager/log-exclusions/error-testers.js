'use strict'

const _getErrorString = (err) => {
  if (typeof err === 'string') {
    return err
  }
  if (err instanceof Error) {
    return err.stack ?? err.toString()
  }

  return ''
}

const _testRegExp = (err, regExp) => (
  regExp.test(_getErrorString(err))
)

const isDocumentsPathGettingError = (err) => (
  _testRegExp(err, /Failed to get 'documents' path/i)
)

const isContextIsolationError = (err) => (
  _testRegExp(err, /contextIsolation is deprecated/i)
)

const isInetDisconnectionError = (err) => (
  _testRegExp(err, /ERR_INTERNET_DISCONNECTED/i)
)

const isCodeSignatureError = (err) => (
  _testRegExp(err, /Could not get code signature/i)
)

const isBfxApiServerAvailabilityError = (err) => (
  _testRegExp(err, /ERR_BFX_API_SERVER_IS_NOT_AVAILABLE/i)
)

const isDatabaseLockError = (err) => (
  _testRegExp(err, /database is locked/i)
)

const isNetworkTimeoutError = (err) => (
  _testRegExp(err, /network timeout/i)
)

const isDiffUpdateDownloadError = (err) => (
  _testRegExp(err, /Cannot download differentially/i)
)

const isGHUpdateDownloadError = (err) => (
  _testRegExp(err, /objects\.githubusercontent\.com/i)
)

const isHtmlLoadingForPdfError = (err) => (
  _testRegExp(err, /Error: ERR_FAILED \(-2\) loading 'file:.*\.html'/i)
)

const isPdfGenerationError = (err) => (
  _testRegExp(err, /Failed to generate PDF/i)
)

// https://github.com/electron/electron/issues/47390
const isDeprecationWarningFsStatsError = (err) => (
  _testRegExp(err, /DeprecationWarning: fs\.Stats/i)
)

// https://github.com/electron/electron/issues/47390
const isDeprecationWarningUrlParseError = (err) => (
  _testRegExp(err, /DeprecationWarning: `url\.parse\(\)`/i)
)

module.exports = {
  isDocumentsPathGettingError,
  isContextIsolationError,
  isInetDisconnectionError,
  isCodeSignatureError,
  isBfxApiServerAvailabilityError,
  isDatabaseLockError,
  isNetworkTimeoutError,
  isDiffUpdateDownloadError,
  isGHUpdateDownloadError,
  isHtmlLoadingForPdfError,
  isPdfGenerationError,
  isDeprecationWarningFsStatsError,
  isDeprecationWarningUrlParseError
}
