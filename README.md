Bluefin
-------

[![CircleCI](https://circleci.com/gh/dailymuse/bluefin.svg?style=svg)](https://circleci.com/gh/dailymuse/bluefin)

#### External Dependencies
[![nodejs](https://img.shields.io/badge/nodejs-%5E10.15.0-blue.svg)](https://nodejs.org/en/) [![docker](https://img.shields.io/badge/docker-%5E17.04.0-blue.svg)](https://www.docker.com/)


A migration tool for PostgreSQL

### Get started

```bash
brew install direnv
```
### Check that direnv is working
```bash
cd hire-db
bluefin rebuild dev
```


```bash
git clone git@github.com:dailymuse/bluefin.git
cd bluefin
bin/bluefin --help
```

### Building locally
> Bluefin pulls in a few packages from Gemfury, our private npm registry, in order to install these packages locally you need to have an environment variable on your system called `GEMFURY_TOKEN`, a token can be generated from your Gemfury account.

### Usage

import the library

`const bluefin = require('bluefin')`
