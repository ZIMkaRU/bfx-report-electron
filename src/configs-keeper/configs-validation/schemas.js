'use strict'

const SCHEMA_IDS = require('./schema.ids')

const MAIN = {
  $id: SCHEMA_IDS.MAIN,
  type: 'object',
  additionalProperties: false,
  properties: {
    language: {
      type: 'string',
      minLength: 2,
      default: 'en'
    },
    windowState: {
      type: 'object',
      additionalProperties: false,
      default: {},
      properties: {
        x: {
          type: 'integer',
          minimum: 0,
          default: 0
        },
        y: {
          type: 'integer',
          minimum: 0,
          default: 0
        },
        width: {
          type: 'integer',
          minimum: 400
        },
        height: {
          type: 'integer',
          minimum: 400
        }
      }
    }
  }
}

module.exports = [
  MAIN
]
