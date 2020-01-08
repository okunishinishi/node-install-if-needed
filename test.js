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
    const wasInstalled = await lib({
      cwd: `${__dirname}/misc/mocks/mock-pack01`,
    })
    ok(!wasInstalled)
  })

  it('Install mock dir2: locale file dependency', async () => {
    await lib({
      cwd: `${__dirname}/misc/mocks/mock-pack02`,
    })
    const wasInstalled = await lib({
      cwd: `${__dirname}/misc/mocks/mock-pack02`,
    })
    ok(!wasInstalled)
    await doesNotReject(() => fs.promises.stat(`${__dirname}/misc/mocks/mock-pack02/node_modules/mock-pack01`))
  })

  it('Install mock dir3: npm-install-if-needed が上のパッケージでインストールされているときにも正しく解決する', async () => {
    await lib({
      cwd: `${__dirname}/misc/mocks/mock-pack03`,
    })
    const wasInstalled = await lib({
      cwd: `${__dirname}/misc/mocks/mock-pack03`,
    })
    ok(!wasInstalled)
  })

  it('Install mock dir4: npm install if node_modules are not found', async () => {
    await lib({
      cwd: `${__dirname}/misc/mocks/mock-pack04`,
    })
    await doesNotReject(() => fs.promises.stat(`${__dirname}/misc/mocks/mock-pack04/npm-install-done`))
  })
})

/* global describe, it */
