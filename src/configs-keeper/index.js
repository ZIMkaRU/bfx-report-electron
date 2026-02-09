'use strict'

const ConfigsKeeper = require('./configs.keeper')

const CONFIGS_KEEPER_NAMES = require('./configs.keeper.names')

module.exports = {
  configsKeeperFactory: (opts) => {
    const configsKeeperName = opts?.configsKeeperName ??
      CONFIGS_KEEPER_NAMES.MAIN

    const configsKeeper = new ConfigsKeeper({
      ...opts,
      configsKeeperName
    })
    this[configsKeeperName] = configsKeeper

    return configsKeeper
  },

  getConfigsKeeperByName: (name) => {
    const configsKeeperName = name ?? CONFIGS_KEEPER_NAMES.MAIN

    return this[configsKeeperName]
  }
}
