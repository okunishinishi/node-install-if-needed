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
  async packageForDir(cwd) {
    const basename = 'package.json'
    const dirname = await findupAsync(cwd, basename).catch((err) => {
      throw (`[install-if-needed] package.json not found from ${cwd}`)
    })
    const filename = path.resolve(dirname, basename)
    const content = await readFileAsync(filename)
    return JSON.parse(content)
  },

  async npmInstallAt(cwd) {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        stdio: 'inherit',
        cwd,
      })
      npm.on('close', () => resolve())
      npm.on('error', (err) => reject(err))
    })
  }
}

/** @lends installIfNeeded */
async function installIfNeeded(options = {}) {
  const {
    cwd = process.cwd()
  } = options
  const pkg = await utils.packageForDir(cwd)
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  }
  for (const [name, version] of Object.entries(deps)) {
    if (/^file:/.test(version)) {
      debug('Skip', name, version)
      continue
    }
    try {
      const { stdout } = await execAsync(`node -e "try { process.stdout.write(require.resolve('${name}/package.json')) } catch (e) { }"`, { cwd })
      const pkg = JSON.parse(await readFileAsync(stdout.trim()))
      const ok = semver.satisfies(pkg.version, version)
      if (ok) {
        debug('No need', name, version)
        continue
      }
      await utils.npmInstallAt(cwd)
    } catch (e) {
      await utils.npmInstallAt(cwd)
      return true
    }
  }
  return false
}

module.exports = installIfNeeded
