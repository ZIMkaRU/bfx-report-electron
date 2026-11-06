'use strict'

const { screen } = require('electron')

const IpcChannelHandlers = require('./ipc.channel.handlers')
const GeneralIpcChannelHandlers = require('./general-ipc-channel-handlers')
const { initClosedEventListener } = require('./helpers')

class ModalIpcChannelHandlers extends IpcChannelHandlers {
  static channelName = 'modal'

  static lastWin = null
  static lastToastId = null
  static laseClosedEventPromise = null
  static isModalClosedEventListenerInited = false
  static modalClosedEventHandlerSet = new Set()
  static isModalReadyToBeShownControlObj = {
    promise: Promise.resolve(),
    resolve: () => {}
  }

  static onModalClosedEvent (cb) {
    return this.handleListener(this.onModalClosedEvent, cb)
  }

  static sendCloseModalEvent (win, args) {
    return this.sendToRenderer(this.sendCloseModalEvent, win, args)
  }

  static async sendFireModalEvent (win, args) {
    const needLastToBeRerendered = !win
    const _win = needLastToBeRerendered ? this.lastWin : win
    GeneralIpcChannelHandlers.sendNS(_win, { ns: this.channelName })

    if (!args?.preventSettingHeightToContent) {
      this.isModalReadyToBeShownControlObj
        .promise = new Promise((resolve) => {
          this.isModalReadyToBeShownControlObj.resolve = () => {
            this.isModalReadyToBeShownControlObj.resolve = () => {}
            resolve()
          }
        })
    }
    if (needLastToBeRerendered) {
      this.sendToRenderer(this.sendFireModalEvent, _win, {
        ...args,
        toastId: this.lastToastId,
        needLastToBeRerendered
      })

      return await this.laseClosedEventPromise
    }

    const {
      closedEventPromise,
      toastId
    } = initClosedEventListener({
      handlerSet: this.modalClosedEventHandlerSet,
      setInitFlagFn: (flag) => {
        this.isModalClosedEventListenerInited = flag
      },
      getInitFlagFn: () => this.isModalClosedEventListenerInited,
      onClosedEventFn: (cb) => {
        this.onModalClosedEvent(cb)
      }
    })

    this.lastWin = _win
    this.lastToastId = toastId
    this.laseClosedEventPromise = closedEventPromise

    this.sendToRenderer(this.sendFireModalEvent, _win, {
      ...args,
      toastId
    })

    return await closedEventPromise
  }

  setWindowHeightHandler (event, args) {
    const win = this.constructor.lastWin
    const height = args?.height

    if (
      !win ||
      !Number.isInteger(height)
    ) {
      return
    }

    const point = screen.getCursorScreenPoint()
    const { workArea } = screen.getDisplayNearestPoint(point)
    const { height: screenHeight } = workArea
    const maxHeight = Math.floor(screenHeight * 0.90)

    win.setBounds({ height: Math.min(height, maxHeight) }, true)
    win.center()
    this.constructor.isModalReadyToBeShownControlObj.resolve()
  }
}

module.exports = ModalIpcChannelHandlers
