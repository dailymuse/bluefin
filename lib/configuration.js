
import fs from 'fs'
import path from 'path'
import Promise from 'bluebird'

import Migration from './migration'

export default class Configuration {
  constructor (pathToConfig) {
    this.directory = path.dirname(pathToConfig)
    
    const vfs = this.constructor.fs
    const data = vfs.readFileSync(pathToConfig)
    const json = JSON.parse(data)
    
    this.loc = {
      migrations: path.resolve(
        this.directory, 
        json.migrations
      )
    }
  }

  migrations () {
    const vfs = this.constructor.fs
    return new Promise((resolve, reject) => {
      vfs.readdir(this.loc.migrations, (e, names) => {
        if (e) return reject(e)
        const migrations = names.map(ea => {
          const fullpath = path.resolve(this.loc.migrations, ea)
          return new Migration(fullpath)
        })
        resolve(migrations)
      })
    })
  }
}

Configuration.fs = fs