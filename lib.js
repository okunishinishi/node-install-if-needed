/**
 * @function installIfNeeded
 * @param {Object} [options={}]
 * @param {string} [options.cwd=process.cwd()]
 * @returns {boolean} Installed or not
 */
'use strict'

const semver = require('semver')
const findup = require('findup')
const { exec, spawn } = require('child_process')
const { promisify } = require('util')
const path = require('path')
const debug = require('debug')('install-if-needed')
const fs = require('fs')

const readFileAsync = promisify(fs.readFile)
const findupAsync = promisify(findup)
const execAsync = promisify(exec)

const utils = {
  async packageForDir (cwd) {
    const basename = 'package.json'
    const dirname = await findupAsync(cwd, basename).catch(err => {
      throw `[install-if-needed] package.json not found from ${cwd}`
    })
    const filename = path.resolve(dirname, basename)
    const content = await readFileAsync(filename)
    return JSON.parse(content)
  },

  async npmInstallAt (cwd) {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        stdio: 'inherit',
        cwd
      })
      npm.on('close', () => resolve())
      npm.on('error', err => reject(err))
    })
  },

  modulePackagePath (name) {
    try {
      return require.resolve(`${name}/package.json`)
    } catch (e) {
      return null
    }
  }
}

/** @lends installIfNeeded */
async function installIfNeeded (options = {}) {
  const { cwd = process.cwd() } = options
  const pkg = await utils.packageForDir(cwd)
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  }
  for (const [name, version] of Object.entries(deps)) {
    if (/^file:/.test(version)) {
      debug('Skip', name, version)
      continue
    }
    const modulePackagePath = utils.modulePackagePath(name)
    if (!modulePackagePath) {
      await utils.npmInstallAt(cwd)
      return true
    }
    const pkg = JSON.parse(await readFileAsync(modulePackagePath))
    const ok = semver.satisfies(pkg.version, version)
    if (ok) {
      debug('No need', name, version)
      continue
    }
    await utils.npmInstallAt(cwd)
    return true
  }
  return false
}

module.exports = installIfNeeded
