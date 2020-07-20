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
const statAsync = promisify(fs.stat)

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

  async npmInstallAt (cwd, options = {}) {
    const { ignoreScript = false } = options
    return new Promise((resolve, reject) => {
      const npm = spawn(
        'npm',
        ['install', ...(ignoreScript ? ['--ignore-scripts'] : [])],
        {
          stdio: 'inherit',
          cwd,
          env: {...process.env},
        }
      )
      npm.on('close', () => resolve())
      npm.on('error', err => reject(err))
    })
  },

  async readFileAsJSON (filename) {
    try {
      return JSON.parse(await readFileAsync(filename))
    } catch (e) {
      console.warn(`[install-if-needed] Failed to read json`, filename)
      return null
    }
  },

  modulePackagePath (name, { cwd }) {
    const moduleIds = [
      `${cwd}/node_modules/${name}/package.json`,
      `${name}/package.json`,
      `node_modules/${name}/package.json`,
    ]
    for (const moduleId of moduleIds) {
      try {
        return require.resolve(moduleId)
      } catch (e) {}
    }
    debug('Not found', { name, cwd, moduleIds })
    return null
  }
}

/** @lends installIfNeeded */
async function installIfNeeded (options = {}) {
  const { cwd = process.cwd(), ignoreScript = false } = options
  const pkg = await utils.packageForDir(cwd)
  const needed = await installIfNeeded.needsInstall(pkg, { cwd })
  if (needed) {
    await utils.npmInstallAt(cwd, { ignoreScript })
  }
  return needed
}

installIfNeeded.needsInstall = async (pkg, { cwd }) => {
  const deps = {
    ...(pkg.dependencies || {}),
    ...(process.env.NODE_ENV === 'production' ? {} : (pkg.devDependencies || {}))
  }
  const foundNodeModules = await statAsync(`${cwd}/node_modules`)
    .then(() => true)
    .catch(() => false)
  if (!foundNodeModules) {
    debug('Not found node_modules')
    return true
  }
  for (const [name, version] of Object.entries(deps)) {
    const modulePackagePath = utils.modulePackagePath(name, { cwd })
    if (!modulePackagePath) {
      debug('Not found', name)
      return true
    }
    const isSemver = Boolean(semver.valid(version) || semver.validRange(version))
    if (isSemver) {
      const pkg = await utils.readFileAsJSON(modulePackagePath)
      const ok = !!pkg && semver.satisfies(pkg.version, version, { loose: true })
      if (!ok) {
        debug('Not specified', name, version)
        return true
      }
    }
  }
  return false
}

installIfNeeded.utils = utils

module.exports = installIfNeeded
