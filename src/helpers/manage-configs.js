'use strict'

const path = require('node:path')

const {
  IS_MAC
} = require('./platform-identifiers')
const { REPORT_FILES_PATH_VERSION } = require('../const')

const {
  configsKeeperFactory
} = require('../configs-keeper')

const _resetReportFilesPath = async (
  configsKeeper,
  opts = {}
) => {
  const {
    pathToUserReportFiles
  } = opts

  // Need to use a new report folder path for export
  const reportFilesPathVersion = configsKeeper
    .getConfigByName('reportFilesPathVersion')

  if (reportFilesPathVersion === REPORT_FILES_PATH_VERSION) {
    return
  }

  await configsKeeper.saveConfigs({
    reportFilesPathVersion: REPORT_FILES_PATH_VERSION,
    pathToUserReportFiles
  })
}

module.exports = (params) => {
  const {
    pathToUserData,
    pathToUserDocuments,
    pathToUserDownloads
  } = params ?? {}

  const pathToUserReportFiles = IS_MAC
    ? pathToUserDownloads
    : path.join(
      pathToUserDocuments,
      'bitfinex/reports'
    )

  const configsKeeper = configsKeeperFactory(
    {
      pathToUserData,
      configsByDefault: { pathToUserReportFiles }
    }
  )
  _resetReportFilesPath(
    configsKeeper,
    { pathToUserReportFiles }
  )

  return configsKeeper
}
