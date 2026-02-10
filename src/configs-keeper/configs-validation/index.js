'use strict'

const Ajv = require('ajv')

const isDevEnv = process.env.NODE_ENV === 'development'

const SCHEMA_IDS = require('./schema.ids')
const schemas = require('./schemas')

let ajv

const init = () => {
  ajv = new Ajv({
    // Compile schema on initialization
    schemas,

    // Strict mode
    strict: true,
    strictRequired: true,
    allowMatchingProperties: true,
    allowUnionTypes: true,

    coerceTypes: true,
    useDefaults: 'empty',
    removeAdditional: true,
    $data: true,
    ownProperties: true,
    allErrors: true,
    messages: true,
    formats: { reserved: true },
    verbose: isDevEnv
  })
}

const validate = (configs, schemaId) => {
  const validate = ajv.getSchema(schemaId)

  if (typeof validate !== 'function') {
    // TODO:
    console.debug('Config validation schema is not defined')

    return false
  }

  const res = validate(configs)

  if (validate.errors) {
    console.debug(validate.errors)
  }

  return res
}

module.exports = {
  SCHEMA_IDS,

  init,
  validate
}
