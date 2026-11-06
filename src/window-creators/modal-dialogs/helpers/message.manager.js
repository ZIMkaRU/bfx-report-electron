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
      const diffMins = Math.floor(diffMs / 60_000)
      const ts = diffMins < 1
        ? i18next.t('showErrorModalDialog.timestampJustNow')
        : i18next.t('showErrorModalDialog.timestamp', { count: diffMins })
      const title = data.title ? data.title : ''
      const message = data.message ? data.message : ''
      const separator = (
        data.title &&
        data.message
      )
        ? ': '
        : ''
      const badge = this.#messages.size > 1
        ? `<small class="badge">${ts}</small>`
        : ''

      plainTextArr.push(`${title}${separator}${message} - ${ts}`)
      htmlArr.push(`<div>${title}${separator}${message}${badge}</div>`)
    }

    return {
      plainText: plainTextArr.join(os.EOL + os.EOL),
      html: htmlArr.join(os.EOL)
    }
  }
}

module.exports = MessageManager
