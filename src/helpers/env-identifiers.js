'use strict'

const ENVS = {
  PROD: 'production',
  DEV: 'development',
  TEST: 'test'
}

const IS_PROD = process.env.NODE_ENV === ENVS.PROD
const IS_DEV = process.env.NODE_ENV === ENVS.DEV
const IS_TEST = process.env.NODE_ENV === ENVS.TEST

module.exports = {
  ENVS,
  IS_PROD,
  IS_DEV,
  IS_TEST
}
