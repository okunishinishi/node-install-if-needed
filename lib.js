/**
 * @function installIfNeeded
 * @param {Object} [options={}]
 * @param {string} [options.cwd=process.cwd()]
 * @returns {boolean} Installed or not
 */
"use strict";

const semver = require("semver");
const findup = require("findup");
const { exec, spawn } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const debug = require("debug")("install-if-needed");
const fs = require("fs");

const readFileAsync = promisify(fs.readFile);
const findupAsync = promisify(findup);
const execAsync = promisify(exec);

const utils = {
  async packageForDir(cwd) {
    const basename = "package.json";
    const dirname = await findupAsync(cwd, basename).catch(err => {
      throw `[install-if-needed] package.json not found from ${cwd}`;
    });
    const filename = path.resolve(dirname, basename);
    const content = await readFileAsync(filename);
    return JSON.parse(content);
  },

  async npmInstallAt(cwd, options = {}) {
    const { ignoreScript = false } = options;
    return new Promise((resolve, reject) => {
      const npm = spawn(
        "npm",
        ["install", ...(ignoreScript ? ["--ignore-scripts"] : [])],
        {
          stdio: "inherit",
          cwd
        }
      );
      npm.on("close", () => resolve());
      npm.on("error", err => reject(err));
    });
  },

  async readFileAsJSON(filename) {
    try {
      return JSON.parse(await readFileAsync(filename));
    } catch (e) {
      console.warn(`[install-if-needed] Failed to read json`, filename);
      return null;
    }
  },

  modulePackagePath(name) {
    try {
      return require.resolve(`${name}/package.json`);
    } catch (e) {
      return null;
    }
  }
};

/** @lends installIfNeeded */
async function installIfNeeded(options = {}) {
  const { cwd = process.cwd(), ignoreScript = false } = options;
  const pkg = await utils.packageForDir(cwd);
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  };
  const needed = installIfNeeded.needsInstall(pkg);
  if (needed) {
    await utils.npmInstallAt(cwd, { ignoreScript });
  }
  return needed;
}

installIfNeeded.needsInstall = async pkg => {
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  };
  for (const [name, version] of Object.entries(deps)) {
    if (/^file:/.test(version)) {
      debug("Skip local deps", name, version);
      continue;
    }
    const modulePackagePath = utils.modulePackagePath(name);
    if (!modulePackagePath) {
      debug("Not found", name);
      return true;
    }
    const pkg = await utils.readFileAsJSON(modulePackagePath);
    const ok = !!pkg && semver.satisfies(pkg.version, version);
    if (!ok) {
      debug("Not specified", name, version);
      return true;
    }
  }
  return false;
};

module.exports = installIfNeeded;
