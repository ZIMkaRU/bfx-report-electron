'use strict'

const errorTesters = require('./error-testers')
const {
  isContextIsolationError,
  isInetDisconnectionError,
  isCodeSignatureError,
  isBfxApiServerAvailabilityError,
  isDatabaseLockError,
  isNetworkTimeoutError
} = errorTesters

const shouldLogBeSkipped = (err) => (
  isContextIsolationError(err) ||
  isInetDisconnectionError(err) ||
  isCodeSignatureError(err) ||
  isBfxApiServerAvailabilityError(err) ||
  isDatabaseLockError(err) ||
  isNetworkTimeoutError(err)
)

module.exports = {
  errorTesters,
  shouldLogBeSkipped
}
