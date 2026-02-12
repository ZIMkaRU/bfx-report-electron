'use strict'

const path = require('node:path')
const Ajv = require('ajv')
const addFormats = require('ajv-formats')
const cronValidate = require('cron-validate')

const isDevEnv = process.env.NODE_ENV === 'development'

const SCHEMA_IDS = require('./schema.ids')
const schemas = require('./schemas')
const {
  DataValidationSchemaDefError,
  DataValidationError
} = require('../../errors')

const ajv = new Ajv({
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
addFormats(ajv)
ajv.addFormat('abs-path', {
  type: 'string',
  validate: (val) => path.isAbsolute(val)
})
ajv.addFormat('cron-expression', {
  type: 'string',
  validate: (val) => cronValidate(val).isValid()
})

const validate = (configs, schemaId) => {
  const validate = ajv.getSchema(schemaId)

  if (typeof validate !== 'function') {
    console.error(new DataValidationSchemaDefError())

    return false
  }

  const res = validate(configs)

  if (validate.errors) {
    console.debug(new DataValidationError({
      message: `ERR_DATA_IS_INVALID_WITH_ID: ${schemaId}`,
      data: validate.errors
    }))
  }

  return res
}

module.exports = {
  SCHEMA_IDS,
  validate
}
