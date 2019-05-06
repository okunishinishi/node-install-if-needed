#!/usr/bin/env node
/**
 * install if needed
 */
'use strict'

const lib = require('./lib')
const {argv} = require('yargs')

void async function () {
  const installed = await lib({
    cwd: argv.cwd,
    ignoreScript: argv.ignoreScript,
  })
  if (installed) {
    console.log('[install-if-needed] Package has been installed')
  } else {
    console.log('[install-if-needed] No need to install')
  }
}()
