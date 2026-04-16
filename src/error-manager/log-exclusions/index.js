'use strict'

const errorTesters = require('./error-testers')
const {
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
} = errorTesters

const { isENetError } = require(
  '../../../bfx-reports-framework/workers/loc.api/helpers/api-errors-testers'
)

// If log is skipped, a new GH issue will be suppressed
const shouldLogBeSkipped = (err) => (
  isContextIsolationError(err) ||
  isInetDisconnectionError(err) ||
  isCodeSignatureError(err) ||
  isBfxApiServerAvailabilityError(err) ||
  isDatabaseLockError(err) ||
  isNetworkTimeoutError(err)
)

// Don't open a new GH issue, but log anyway
const shouldErrorModalWinBeSuppressed = (err) => (
  isENetError(err) ||
  isDiffUpdateDownloadError(err) ||
  isGHUpdateDownloadError(err) ||
  isHtmlLoadingForPdfError(err) ||
  isPdfGenerationError(err) ||
  isDeprecationWarningFsStatsError(err) ||
  isDeprecationWarningUrlParseError(err)
)

module.exports = {
  errorTesters,
  shouldLogBeSkipped,
  shouldErrorModalWinBeSuppressed
}
