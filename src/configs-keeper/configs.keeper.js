'use strict'

const { app } = require('electron')
const path = require('node:path')
const {
  writeFileSync,
  mkdirSync,
  accessSync,
  chmodSync,
  constants: { F_OK, W_OK }
} = require('node:fs')
const {
  writeFile,
  mkdir,
  access,
  chmod
} = require('node:fs/promises')
const { cloneDeep, merge } = require('lib-js-util-base')

const CONFIGS_KEEPER_NAMES = require('./configs.keeper.names')
const CONFIGS_KEEPER_FILE_NAME_MAP = require(
  './configs.keeper.file.name.map'
)
const {
  WrongPathToUserDataError
} = require('../errors')

class ConfigsKeeper {
  #dirMode = '766'
  #queue = new Set()
  #configs = {}

  constructor (opts) {
    this.configsKeeperName = opts?.configsKeeperName ??
      CONFIGS_KEEPER_NAMES.MAIN
    this.configsFileName = opts?.configsFileName ??
      CONFIGS_KEEPER_FILE_NAME_MAP[this.configsKeeperName]
    this.configsByDefault = opts?.configsByDefault ?? {}
    this.pathToUserData = opts?.pathToUserData ??
      app.getPath('userData')

    if (!path.isAbsolute(this.pathToUserData)) {
      throw new WrongPathToUserDataError()
    }

    this.pathToConfigsFile = path.join(
      this.pathToUserData,
      this.configsFileName
    )

    this.#configs = merge(
      this.#configs,
      this.configsByDefault,
      this.#loadConfigs()
    )
  }

  #loadConfigs () {
    try {
      return require(this.pathToConfigsFile)
    } catch (err) {}
  }

  getConfigs () {
    return cloneDeep(this.#configs)
  }

  getConfigByName (name) {
    return (
      this.#configs[name] &&
      typeof this.#configs[name] === 'object'
    )
      ? cloneDeep(this.#configs[name])
      : this.#configs[name]
  }

  #setConfigs (configs) {
    this.#configs = merge(
      this.#configs,
      configs
    )

    return JSON.stringify(this.#configs, null, 2)
  }

  async #process () {
    for (const promise of this.#queue) {
      await promise

      this.#queue.delete(promise)
    }
  }

  async #saveConfigs (configs) {
    try {
      await this.#process()

      try {
        await access(this.pathToUserData, F_OK | W_OK)
      } catch (err) {
        if (err.code === 'ENOENT') {
          await mkdir(
            this.pathToUserData,
            { recursive: true, mode: this.#dirMode }
          )
        }
        if (err.code === 'EACCES') {
          await chmod(this.pathToUserData, this.#dirMode)
        }

        throw err
      }

      const jsonConfigs = this.#setConfigs(configs)

      await writeFile(
        this.pathToConfigsFile,
        jsonConfigs
      )

      return true
    } catch (err) {
      console.error(err)

      return false
    }
  }

  async saveConfigs (configs) {
    const task = this.#saveConfigs(configs)
    this.#queue.add(task)

    const res = await task

    return res
  }

  saveConfigsSync (configs) {
    try {
      try {
        accessSync(this.pathToUserData, F_OK | W_OK)
      } catch (err) {
        if (err.code === 'ENOENT') {
          mkdirSync(
            this.pathToUserData,
            { recursive: true, mode: this.#dirMode }
          )
        }
        if (err.code === 'EACCES') {
          chmodSync(this.pathToUserData, this.#dirMode)
        }
      }

      const jsonConfigs = this.#setConfigs(configs)

      writeFileSync(
        this.pathToConfigsFile,
        jsonConfigs
      )

      return true
    } catch (err) {
      console.error(err)

      return false
    }
  }
}

module.exports = ConfigsKeeper
