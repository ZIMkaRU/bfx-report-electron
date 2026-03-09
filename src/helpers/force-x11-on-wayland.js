'use strict'

const { app } = require('electron')

const isWaylandSession = require('./is-wayland-session')
const wasX11Forced = process.env.ELECTRON_FORCE_X11

module.exports = () => {
  if (
    !isWaylandSession() ||
    wasX11Forced
  ) {
    return false
  }

  app.relaunch({
    args: [
      ...process.argv.slice(1),
      '--ozone-platform=x11',
      '--disable-features=WaylandWindowDecorations'
    ],
    env: {
      ...process.env,
      ELECTRON_FORCE_X11: 1
    }
  })

  app.exit(0)

  return true
}
