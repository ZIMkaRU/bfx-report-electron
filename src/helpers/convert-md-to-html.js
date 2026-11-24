'use strict'

const { marked } = require('marked')

marked.use({
  gfm: true,
  breaks: false
})

module.exports = (md) => {
  return marked.parse(md)
}
