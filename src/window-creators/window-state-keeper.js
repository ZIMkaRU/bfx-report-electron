'use strict'

const { screen } = require('electron')

const { getConfigsKeeperByName } = require('../configs-keeper')

module.exports = () => {
  let state = null
  let winRef = null
  let stateChangeTimer = null

  const eventHandlingDelay = 100

  const isNormal = (win) => {
    return !win.isMaximized() &&
      !win.isMinimized() &&
      !win.isFullScreen()
  }

  const hasBounds = () => {
    return state &&
      Number.isInteger(state.x) &&
      Number.isInteger(state.y) &&
      Number.isInteger(state.width) && state.width > 400 &&
      Number.isInteger(state.height) && state.height > 400
  }

  const resetStateToDefault = () => {
    /**
     * screen.getCursorScreenPoint() segfaults under Wayland
     * if called before a BrowserWindow is created
     * https://github.com/electron/electron/issues/41559
     */
    const point = screen.getCursorScreenPoint()
    const displayBounds = screen.getDisplayNearestPoint(point)
    const {
      bounds: {
        x: defaultX,
        y: defaultY
      },
      workAreaSize: {
        width: defaultWidth,
        height: defaultHeight
      }
    } = displayBounds ?? {}

    state = {
      width: defaultWidth ?? 800,
      height: defaultHeight ?? 600,
      x: defaultX ?? 0,
      y: defaultY ?? 0,
      displayBounds
    }
  }

  const ensureWindowVisibleOnSomeDisplay = () => {
    const {
      maxWidth,
      maxHeight
    } = screen.getAllDisplays().reduce((
      { maxWidth, maxHeight },
      { workAreaSize: { width, height } }
    ) => {
      return {
        maxWidth: maxWidth + width,
        maxHeight: maxHeight + height
      }
    }, { maxWidth: 0, maxHeight: 0 })
    const visible = state.x < maxWidth && state.y < maxHeight

    if (!visible) {
      return resetStateToDefault()
    }
  }

  const validateState = () => {
    const isValid = (
      state &&
      (
        hasBounds() ||
        state.isMaximized ||
        state.isFullScreen
      )
    )

    if (!isValid) {
      resetStateToDefault()

      return
    }

    if (hasBounds() && state.displayBounds) {
      ensureWindowVisibleOnSomeDisplay()
    }
  }

  const updateState = (win) => {
    win = win || winRef

    if (!win) {
      return
    }

    try {
      /**
       * On Wayland, `win.getBounds()` method returns
       * `{ x: 0, y: 0, ... }` as introspecting or programmatically
       * changing the global window coordinates is prohibited
       * https://github.com/electron/electron/issues/40886
       * https://github.com/electron/electron/pull/49632
       */
      const winBounds = win.getBounds()

      if (isNormal(win)) {
        state.x = winBounds.x
        state.y = winBounds.y
        state.width = winBounds.width
        state.height = winBounds.height
      }

      state.isMaximized = win.isMaximized()
      state.isFullScreen = win.isFullScreen()
      state.displayBounds = screen.getDisplayMatching(winBounds).bounds
    } catch (err) {}
  }

  const saveState = (win) => {
    if (win) {
      updateState(win)
    }

    getConfigsKeeperByName()
      .saveConfigsSync({ windowState: state })
  }

  const stateChangeHandler = () => {
    clearTimeout(stateChangeTimer)
    stateChangeTimer = setTimeout(updateState, eventHandlingDelay)
  }

  const closeHandler = () => {
    updateState()
  }

  const closedHandler = () => {
    unmanage()
    saveState()
  }

  const manage = (win) => {
    win.on('resize', stateChangeHandler)
    win.on('move', stateChangeHandler)
    win.on('close', closeHandler)
    win.on('closed', closedHandler)

    winRef = win
  }

  const unmanage = () => {
    if (winRef) {
      winRef.removeListener('resize', stateChangeHandler)
      winRef.removeListener('move', stateChangeHandler)
      clearTimeout(stateChangeTimer)
      winRef.removeListener('close', closeHandler)
      winRef.removeListener('closed', closedHandler)
      winRef = null
    }
  }

  state = getConfigsKeeperByName()
    .getConfigByName('windowState')

  validateState()

  return {
    get x () { return state.x },
    get y () { return state.y },
    get width () { return state.width },
    get height () { return state.height },
    get displayBounds () { return state.displayBounds },
    get isMaximized () { return state.isMaximized },
    get isFullScreen () { return state.isFullScreen },
    saveState,
    unmanage,
    manage,
    resetStateToDefault
  }
}
