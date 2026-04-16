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

const isDocumentsPathGettingError = (err) => (
  /Failed to get 'documents' path/i.test(_getErrorString(err))
)

module.exports = {
  isDocumentsPathGettingError
}
