# install-if-needed

[![Build Status][bd_travis_shield_url]][bd_travis_url]
[![npm Version][bd_npm_shield_url]][bd_npm_url]
[![JS Standard][bd_standard_shield_url]][bd_standard_url]

[bd_travis_url]: http://travis-ci.org/okunishinishi/node-install-if-needed
[bd_travis_shield_url]: http://img.shields.io/travis/okunishinishi/node-install-if-needed.svg?style=flat
[bd_npm_url]: http://www.npmjs.org/package/install-if-needed
[bd_npm_shield_url]: http://img.shields.io/npm/v/install-if-needed.svg?style=flat
[bd_standard_url]: http://standardjs.com/
[bd_standard_shield_url]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg



Run npm install only if needed 

## Install

```bash
npm i install-if-needed
```

## Usage 

```bash

cd __your_package_dir__
npx install-if-needed # Run npm install only if needed

```

## Programmatic API

```node
const installIfNeeded = require('install-if-needed')

installIfNeeded()
```
