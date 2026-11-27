'use strict'

const setup = require('@bitfinex/lint-js')
const { defaultIgnores } = require('@bitfinex/lint-js/lib/ignores')

module.exports = setup({
  mocha: true,
  ignores: [
    ...defaultIgnores,
    'bfx-report-ui',
    'bfx-reports-framework'
  ],
  globals: { document: 'readonly', window: 'readonly' }
})
