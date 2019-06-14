#!/usr/bin/env node
/**
 * install if needed
 */
'use strict'

const lib = require('./lib')
const {argv} = require('yargs')

void async function () {
  const cwd = argv.cwd || process.cwd()
  const pkg = await lib.utils.packageForDir(cwd)
  const installed = await lib({
    cwd,
    ignoreScript: argv.ignoreScript,
  })
  if (installed) {
    console.log(`[install-if-needed] Package "${pkg.name}" has been installed`)
  } else {
    console.log(`[install-if-needed] No need to install in "${pkg.name}"`)
  }
}()
