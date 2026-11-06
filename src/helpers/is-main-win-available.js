'use strict'

module.exports = (
  win,
  opts = {}
) => {
  return (
    win &&
    typeof win === 'object' &&
    !win.isDestroyed() &&
    (
      !opts?.shouldCheckVisibility ||
      win.isVisible()
    )
  )
}
