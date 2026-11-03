'use strict'

const {
  showWindow
} = require('../../helpers/manage-window')
const { createNativeMessageDialog } = require('./helpers')

module.exports = async (win, opts = {}) => {
  if (
    win &&
    typeof win === 'object' &&
    opts?.shouldParentWindowBeShown
  ) {
    await showWindow(win)
  }

  return await createNativeMessageDialog(win, opts)
}
