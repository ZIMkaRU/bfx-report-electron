'use strict'

const isWaylandSession = require('./is-wayland-session')
const relaunch = require('../relaunch')

const x11Flag = '--ozone-platform=x11'

module.exports = () => {
  const hasX11Flag = process.argv.slice(1).some((item) => {
    return (
      typeof item === 'string' &&
      item.includes(x11Flag)
    )
  })

  if (
    !isWaylandSession() ||
    hasX11Flag
  ) {
    return false
  }

  relaunch([
    x11Flag,
    '--disable-features=WaylandWindowDecorations'
  ])

  return true
}
