'use strict'

const { app } = require('electron')

const ipcs = require('../ipcs')
const isMainWinAvailable = require(
  '../helpers/is-main-win-available'
)
const wins = require('../window-creators/windows')
const WINDOW_NAMES = require('../window-creators/window.names')

const PROCESS_STATES = require(
  '../../bfx-reports-framework/workers/loc.api/process.message.manager/process.states'
)

module.exports = () => {
  return () => {
    try {
      if (
        !app.isReady() ||
        !isMainWinAvailable(wins[WINDOW_NAMES.MAIN_WINDOW])
      ) {
        return
      }

      ipcs.serverIpc.send({ state: PROCESS_STATES.BACKUP_DB })
    } catch (err) {
      console.error(err)
    }
  }
}
