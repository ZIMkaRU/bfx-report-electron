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
const { cloneDeep, merge, get } = require('lib-js-util-base')

const CONFIGS_KEEPER_NAMES = require('./configs.keeper.names')
const CONFIGS_KEEPER_FILE_NAME_MAP = require(
  './configs.keeper.file.name.map'
)
const CONFIGS_KEEPER_VALIDATION_ID_MAP = require(
  './configs.keeper.validation.id.map'
)
const { validate } = require('./configs-validation')
const {
  WrongPathToUserDataError
} = require('../errors')

class ConfigsKeeper {
  #dirMode = '766'
  #queue = new Set()
  #configs = { createdAt: new Date().toISOString() }

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
      const loadedConfigs = require(this.pathToConfigsFile)

      if (!this.#validateConfigs(loadedConfigs)) {
        return
      }

      return loadedConfigs
    } catch (err) {}
  }

  #validateConfigs (configs) {
    return validate(
      configs,
      CONFIGS_KEEPER_VALIDATION_ID_MAP[this.configsKeeperName]
    )
  }

  getConfigs () {
    return cloneDeep(this.#configs)
  }

  getConfigByName (name) {
    const value = get(this.#configs, name)

    return (
      value &&
      typeof value === 'object'
    )
      ? cloneDeep(value)
      : value
  }

  #setConfigs (configs) {
    if (!this.#validateConfigs(configs)) {
      return JSON.stringify(this.#configs, null, 2)
    }

    this.#configs = merge(
      this.#configs,
      configs,
      { updatedAt: new Date().toISOString() }
    )

    return JSON.stringify(this.#configs, null, 2)
  }

  async #process (queue) {
    for (const promise of queue) {
      await promise

      this.#queue.delete(promise)
    }
  }

  async #manageConfigsDir () {
    try {
      await access(this.pathToUserData, F_OK | W_OK)
    } catch (err) {
      if (err.code === 'ENOENT') {
        await mkdir(
          this.pathToUserData,
          { recursive: true, mode: this.#dirMode }
        )

        return
      }
      if (err.code === 'EACCES') {
        await chmod(this.pathToUserData, this.#dirMode)

        return
      }

      throw err
    }
  }

  #manageConfigsDirSync () {
    try {
      accessSync(this.pathToUserData, F_OK | W_OK)
    } catch (err) {
      if (err.code === 'ENOENT') {
        mkdirSync(
          this.pathToUserData,
          { recursive: true, mode: this.#dirMode }
        )

        return
      }
      if (err.code === 'EACCES') {
        chmodSync(this.pathToUserData, this.#dirMode)

        return
      }

      throw err
    }
  }

  async #saveConfigs (configs, queue) {
    try {
      await this.#process(queue)
      await this.#manageConfigsDir()

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
    const task = this.#saveConfigs(configs, [...this.#queue])
    this.#queue.add(task)

    const res = await task

    return res
  }

  saveConfigsSync (configs) {
    try {
      this.#manageConfigsDirSync()

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
