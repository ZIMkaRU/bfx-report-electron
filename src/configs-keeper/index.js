'use strict'

const ConfigsKeeper = require('./configs.keeper')

const {
  DEFAULT_CONFIGS_KEEPER_NAME
} = require('../const')

module.exports = {
  configsKeeperFactory: (opts) => {
    const configsKeeperName = opts?.configsKeeperName ??
      DEFAULT_CONFIGS_KEEPER_NAME

    const configsKeeper = new ConfigsKeeper(opts)
    this[configsKeeperName] = configsKeeper

    return configsKeeper
  },

  getConfigsKeeperByName: (name) => {
    const configsKeeperName = name ?? DEFAULT_CONFIGS_KEEPER_NAME

    return this[configsKeeperName]
  }
}
