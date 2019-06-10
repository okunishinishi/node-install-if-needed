/**
 * Test
 */
'use strict'

const fs = require('fs')
const lib = require('./lib')
const index = require('./index')
const { equal, ok, doesNotReject } = require('assert').strict

describe('Install if needed', async function () {
  this.timeout(40 * 1000)

  it('has index', ()=> {
    ok(index)
  })

  it('Install mock dir', async () => {
    await lib({
      cwd: `${__dirname}/misc/mocks/mock-pack01`,
    })
  })

  it('Install mock dir2: locale file dependency', async () => {
    await lib({
      cwd: `${__dirname}/misc/mocks/mock-pack02`,
    })
    await doesNotReject(() => fs.promises.stat(`${__dirname}/misc/mocks/mock-pack02/node_modules/mock-pack01`))
  })
})

/* global describe, it */
