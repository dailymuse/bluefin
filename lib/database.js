
import Entity from './entity'
import Schema from './schema'

export default class Database extends Entity {
  constructor (conf, nickname, raw) {
    super(conf, nickname, raw)
    this.cluster = conf.cluster(raw.cluster)
    this.schema = {}
    for (let nick in this.raw.schema) {
      this.schema[nick] = new Schema(conf, nick, this.raw.schema[nick])
    }
  }

  connect () {
    if (!this._dbClientVow) this._dbClientVow = this.cluster.connect(this.name)
    return this._dbClientVow
  }

  pgConnect () {
    if (!this._pgClientVow) this._pgClientVow = this.cluster.connect('postgres')
    return this._pgClientVow
  }

  disconnect () {
    if (this._dbClientVow && this._dbClientVow.isResolved()) {
      this._dbClientVow.value().disconnect()
      delete this._dbClientVow
    }
    if (this._pgClientVow && this._pgClientVow.isResolved()) {
      this._pgClientVow.value().disconnect()
      delete this._pgClientVow
    }
  }

  build () {
    return this.create()
      .then(() => this.connect())
      .then(c => {
        let vow = Schema.bluefin().build(c)
        for (let name in this.schema) {
          const s = this.schema[name]
          vow = vow.then(() => s.build(c))
        }
        return vow
      })
  }

  create () {
    return this.pgConnect()
      .then(c => c.exec(`CREATE DATABASE ${this.name}`))
  }

  drop () {
    if (this.raw.safety) return Promise.reject(new Error('safety'))
    return this.exists().then(exists => {
      if (exists) {
        return this.pgConnect()
          .then(c => c.exec(`DROP DATABASE ${this.name}`))
      }
    })
  }

  ensure () {
    return this.exists().then(exists => {
      if (!exists) return this.create()
    })
  }

  exists () {
    return this.pgConnect()
      .then(c => c.value(dbExistsSql, this.name))
      .then(value => !!value)
  }
}

const dbExistsSql = 'SELECT 1 FROM pg_database WHERE datname=$1'
