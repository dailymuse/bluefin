
import fs from 'fs'
import path from 'path'
import Promise from 'bluebird'

import {Migration, User} from './entities'

export default class Configuration {
  constructor (pathToConfig) {
    this.directory = path.dirname(pathToConfig)
    
    const data = this.constructor.fs.readFileSync(pathToConfig)
    const json = JSON.parse(data)
    if (!json.migrations) throw new Error('migrations not configured')
    if (!json.grants) throw new Error('grants not configured')

    this.loc = {
      migrations: path.resolve(this.directory, json.migrations),
      grants: path.resolve(this.directory, json.grants)
    }
  }

  migrations () {
    return this.scan('migrations', Migration)
  }

  grants () {
    return this.scan('grants', User)
  }

  scan (directory, Entity) {
    const vfs = this.constructor.fs
    return new Promise((resolve, reject) => {
      vfs.readdir(this.loc[directory], (e, names) => {
        if (e) return reject(e)
        const entities = names.map(ea => {
          const fullpath = path.resolve(this.loc[directory], ea)
          return new Entity(fullpath)
        })
        resolve(entities)
      })
    })
  }
}

Configuration.fs = fs