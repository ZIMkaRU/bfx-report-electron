'use strict'

try {
  const envVars = require('./electronEnv.json')

  for (const [key, val] of Object.entries(envVars)) {
    if (typeof process.env[key] !== 'undefined') {
      continue
    }

    process.env[key] = val
  }
} catch (err) {}
try {
  // Uses only in dev mode as dotenv is added into dev deps
  require('dotenv').config({ override: true })
} catch (err) {}

process.traceDeprecation = true
process.traceProcessWarnings = true
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true

const { app } = require('electron')
app.allowRendererProcessReuse = true

require('./src/i18next')
  .initI18next()

const productName = require('./src/helpers/product-name')
const {
  IS_E2E_TEST
} = require('./src/helpers/env-identifiers')
app.setName(productName)

require('./src/error-manager')
  .initLogger()

const initializeApp = require('./src/initialize-app')
const makeSingleInstance = require('./src/make-single-instance')

const shouldQuit = makeSingleInstance()

if (shouldQuit) {
  app.quit()
} else {
  ;(async () => {
    try {
      if (IS_E2E_TEST) {
        require('wdio-electron-service/main')
      }

      await initializeApp()
    } catch (err) {
      console.error(err)
    }
  })()
}
