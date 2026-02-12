'use strict'

const SCHEMA_IDS = require('./schema.ids')

const MAIN = {
  $id: SCHEMA_IDS.MAIN,
  type: 'object',
  additionalProperties: false,
  properties: {
    createdAt: {
      type: 'string',
      format: 'iso-date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'iso-date-time'
    },
    theme: {
      type: 'string',
      minLength: 1,
      enum: ['system', 'dark', 'light'],
      default: 'system'
    },
    schedulerRule: {
      type: 'string',
      minLength: 1,
      format: 'cron-expression',
      default: '0 */2 * * *'
    },
    triggeredSyncAfterUpdatesVer: {
      type: 'string',
      minLength: 1,
      format: 'semver',
      default: '0.0.0'
    },
    language: {
      type: 'string',
      minLength: 2
    },
    pathToUserReportFiles: {
      type: 'string',
      format: 'abs-path'
    },
    reportFilesPathVersion: {
      type: 'integer',
      minimum: 1,
      default: 1
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
