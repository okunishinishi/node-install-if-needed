/**
 * Test
 */
'use strict'

const lib = require('./lib')
const index = require('./index')
const { equal, ok } = require('assert').strict

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
})

/* global describe, it */
