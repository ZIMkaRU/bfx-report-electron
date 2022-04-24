'use strict'

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production'

const path = require('path')

process.env.NODE_CONFIG_DIR = path.join(__dirname, 'config')

const express = require('express')
const config = require('config')
const cors = require('cors')

const app = express()

const port = config.get('app.port')
const host = config.get('app.host')


app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '-1')
  res.setHeader('If-Modified-Since', '0')

  next()
})

app.use(express.static(path.join(__dirname, 'static')))
// app.use('/api/', routes)

app.use((req, res, next) => {
  res.status(404)
  res.send('Not found')
})
app.use((err, req, res, next) => {
  console.error(err)

  res.status(500)
  res.send(`Internal Server Error\n${err?.stack ?? err?.toString() ?? ''}`)
})

const server = app.listen(port, host, () => {
  const host = server.address().address
  const port = server.address().port

  console.log(`Server listening on host ${host} port ${port}`)
})
