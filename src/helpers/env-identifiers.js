'use strict'

const ENVS = {
  PROD: 'production',
  DEV: 'development',
  TEST: 'test'
}

const IS_PROD = process.env.NODE_ENV === ENVS.PROD
const IS_DEV = process.env.NODE_ENV === ENVS.DEV
const IS_TEST = process.env.NODE_ENV === ENVS.TEST
const IS_E2E_TEST = (
  process.env.E2E_TEST === 'true' ||
  process.env.E2E_TEST === 1
)

module.exports = {
  ENVS,
  IS_PROD,
  IS_DEV,
  IS_TEST,
  IS_E2E_TEST
}
