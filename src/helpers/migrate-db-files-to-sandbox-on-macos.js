'use strict'

const { app } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const getUserDataPath = require('./get-user-data-path')
const productName = require('./product-name')
const { IS_MAC } = require('./platform-identifiers')
const {
  DB_FILE_NAME,
  DB_SHM_FILE_NAME,
  DB_WAL_FILE_NAME,
  SECRET_KEY_FILE_NAME
} = require('../const')

const filesToMigrate = [
  DB_FILE_NAME,
  DB_SHM_FILE_NAME,
  DB_WAL_FILE_NAME,
  SECRET_KEY_FILE_NAME
]

module.exports = () => {
  if (!IS_MAC) {
    return
  }

  const homeDir = app.getPath('home')
  const oldDir = path
    .join(homeDir, 'Library', 'Application Support', productName)
  const newDir = getUserDataPath()

  // If the paths match, Sandbox is turned off
  if (oldDir === newDir) {
    return
  }

  const hasOldDb = (
    fs.existsSync(path.join(oldDir, DB_FILE_NAME)) &&
    fs.existsSync(path.join(oldDir, SECRET_KEY_FILE_NAME))
  )
  const hasNewDb = (
    fs.existsSync(path.join(newDir, DB_FILE_NAME)) &&
    fs.existsSync(path.join(newDir, SECRET_KEY_FILE_NAME))
  )

  if (
    !hasOldDb ||
    hasNewDb
  ) {
    return
  }

  try {
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true })
    }

    for (const file of filesToMigrate) {
      const oldFilePath = path.join(oldDir, file)
      const newFilePath = path.join(newDir, file)

      if (!fs.existsSync(oldFilePath)) {
        continue
      }

      fs.copyFileSync(oldFilePath, newFilePath)
    }
  } catch (err) {
    console.debug(err)

    // Clean up if migration failed
    for (const file of filesToMigrate) {
      const newFilePath = path.join(newDir, file)

      fs.rmSync(newFilePath, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 500
      })
    }
  }
}
