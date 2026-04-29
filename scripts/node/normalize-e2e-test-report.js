'use strict'

const path = require('node:path')
const {
  readFileSync,
  writeFileSync
} = require('node:fs')
const {
  XMLParser,
  XMLBuilder
} = require('fast-xml-parser')

const cwd = process.cwd()
const fileName = process.argv[2]
const filePath = path.join(cwd, fileName)

const reportXML = readFileSync(filePath, { encoding: 'utf8' })

const opts = {
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  attributeNamePrefix: 'attr_',
  cdataPropName: '__cdata',
  format: true,
  unpairedTags: 'property',
  suppressUnpairedNode: false
}
const parser = new XMLParser(opts)
const reportObj = parser.parse(reportXML)

/*
 * For compatibility with the dorny/test-reporter,
 * there needs to be 'time' attribute to '<testsuites>' tag
 */
const testsuites = Array.isArray(reportObj.testsuites.testsuite)
  ? reportObj.testsuites.testsuite
  : [reportObj.testsuites.testsuite]
const totalTime = testsuites.reduce((accum, curr) => {
  if (!curr?.attr_time) {
    return accum
  }

  const time = Number.parseFloat(curr.attr_time)

  return Number.isFinite(time)
    ? accum + time
    : accum
}, 0)
reportObj.testsuites.attr_time = totalTime

const builder = new XMLBuilder(opts)
const outputXML = builder.build(reportObj)

writeFileSync(filePath, outputXML)
