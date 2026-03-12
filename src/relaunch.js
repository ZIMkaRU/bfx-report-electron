'use strict'

const { spawn } = require('node:child_process')
const { app } = require('electron')

module.exports = (args) => {
  const options = {
    args: [
      ...process.argv.slice(1),
      ...(args ?? []),
      '--relaunch'
    ]
  }

  if (process.env.APPIMAGE) {
    options.execPath = process.env.APPIMAGE
    options.args.unshift('--appimage-extract-and-run')

    if (app.isPackaged) {
      spawn(options.execPath, options.args, {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env }
      }).unref()
      app.exit(0)

      return
    }
  }

  app.relaunch(options)
  app.exit(0)
}
