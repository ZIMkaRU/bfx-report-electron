'use strict'

const _getErrorString = (err) => {
  const errStr = err instanceof Error
    ? err.stack ?? err.toString()
    : err

  if (typeof errStr !== 'string') {
    return ''
  }

  return errStr
}

const _testRegExp = (regExp, err) => (
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

module.exports = {
  isDocumentsPathGettingError,
  isContextIsolationError,
  isInetDisconnectionError,
  isCodeSignatureError,
  isBfxApiServerAvailabilityError,
  isDatabaseLockError,
  isNetworkTimeoutError
}
