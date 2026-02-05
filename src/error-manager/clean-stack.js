'use strict'

let cleanStack = (stack) => stack

/*
 * The latest `clean-stack` lib uses ECMAScript modules,
 * it means we have to provide async import() for CommonJS modules,
 * and it can lead to an undefined state during the start period
 */
import('clean-stack').then((dep) => {
  cleanStack = dep?.default ?? cleanStack
}).catch((err) => console.error(err))

module.exports = (stack, opts) => {
  return cleanStack(stack, opts)
}
