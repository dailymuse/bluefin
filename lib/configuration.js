import nodeFs from 'fs'
import path from 'path'
import Promise from 'bluebird'

import Database from './database'
import Cluster from './cluster'

export default class Configuration {
  static read (pathToFile, fs) {
    const vfs = fs || nodeFs
    return Promise.fromCallback(cb => vfs.readFile(pathToFile, cb))
      .then(data => {
        const directory = path.dirname(pathToFile)
        const file = path.basename(pathToFile)
        const raw = JSON.parse(data)
        return new Configuration(directory, file, raw, vfs)
      })
  }

  constructor (directory, file, raw, fs) {
    this.directory = directory
    this.file = file
    this.raw = raw
    this.fs = fs || nodeFs

    if (typeof this.raw.passwords === 'object') {
      this._passwords = Promise.resolve(this.raw.passwords)
    } else if (typeof this.raw.passwords === 'string') {
      this._passwords = this.read(this.raw.passwords).then(
        data => JSON.parse(data)
      )
    }
  }

  read (relative) {
    const absolute = path.resolve(this.directory, relative)
    return Promise.fromCallback(cb => this.fs.readFile(absolute, cb))
  }

  password (name) {
    return this._passwords.then(map => map[name])
  }

  cluster (name) {
    if (!(name in this.raw.clusters)) {
      throw new Error(`unknown cluster ${name}`)
    }
    return new Cluster(this, name, this.raw.clusters[name])
  }

  database (name) {
    if (!(name in this.raw.databases)) {
      throw new Error(`unknown database ${name}`)
    }
    return new Database(this, name, this.raw.databases[name])
  }

  inspect () {
    return `<Configuration ${this.directory}/${this.file}>`
  }
}
