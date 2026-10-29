'use strict'

const ModalIpcChannelHandlers = require('./modal-ipc-channel-handlers')

class ErrorModalIpcChannelHandlers extends ModalIpcChannelHandlers {
  static channelName = 'errorModal'
}

module.exports = ErrorModalIpcChannelHandlers
