'use strict'

const os = require('node:os')
const i18next = require('i18next')

class MessageManager {
  #lifetimeMs = 10 * 60 * 1000
  #messages = null

  constructor (lifetimeMs) {
    this.#lifetimeMs = lifetimeMs ?? this.#lifetimeMs
    this.#messages = new Map()
  }

  setMessage (args) {
    const { title, message } = args ?? {}

    if (
      !title &&
      !message
    ) {
      return this
    }

    const mts = Date.now()
    const timer = setTimeout(() => {
      this.#messages.delete(timer)
    }, this.#lifetimeMs).unref()
    const data = { mts, title, message }

    this.#messages.set(timer, data)

    return this
  }

  getMessages () {
    if (this.#messages.size === 0) {
      return {
        plainText: '',
        html: ''
      }
    }

    const currMts = Date.now()
    const plainTextArr = []
    const htmlArr = []

    for (const [, data] of this.#messages) {
      const diffMs = currMts - data.mts
      // TODO: Need to improve translation
      const ts = i18next.t('showErrorModalDialog.timestamp', { diffMs })
      const title = data.title ? data.title : ''
      const message = data.message ? data.message : ''
      const separator = (
        data.title &&
        data.message
      )
        ? ': '
        : ''

      plainTextArr.push(`${title}${separator}${message} - ${ts}`)
      htmlArr.push(`<p>${data.message} <small>${ts}<\\small><\\p>`)
    }

    return {
      plainText: plainTextArr.join(os.EOL + os.EOL),
      html: htmlArr.join(os.EOL)
    }
  }
}

module.exports = MessageManager
