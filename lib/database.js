
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

  apply (options) {
    return this.connect()
      .then(client => {
        let vow = Promise.resolve()

        for (let name in this.schema) {
          const schema = this.schema[name]
          vow = vow.then(() => schema.apply(client, options))
        }

        return vow
      })
  }

  applySchema (name, options) {
    return this.connect().then(c => this.schema[name].apply(c, options))
  }

  build (options) {
    return this.create()
      .then(() => this.connect())
      .then(c => {
        let vow = Promise.resolve()
        for (let name in this.schema) {
          const s = this.schema[name]
          vow = vow.then(() => s.build(c, options))
        }
        return vow
      })
  }

  create () {
    const bluefin = Schema.bluefin()
    return this.pgConnect()
      .then(c => c.exec(`CREATE DATABASE ${this.name}`))
      .then(() => this.connect())
      .then(c => bluefin.build(c))
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

  getSchemaNames () {
    return this.connect()
      .then(c => c.column(getSchemaNamesSql))
  }

  rebuild (options) {
    // for most entities we drop() and build(), but databases can't be dropped
    // if there are clients connected, so we just rebuild it in place
    return this.ensure()
      .then(() => this.connect())
      .then(c => {
        // rebuild the bluefin schema first
        const bluefin = Schema.bluefin()
        let vow = bluefin.rebuild(c, options)

        // then rebuild all the schemata in the configuration
        for (let name in this.schema) {
          const s = this.schema[name]
          vow = vow.then(() => s.rebuild(c, options))
        }

        return vow
      })
  }

  rebuildSchema (name, options) {
    return this.connect().then(c => this.schema[name].rebuild(c))
  }
}

const dbExistsSql = 'SELECT 1 FROM pg_database WHERE datname=$1'
const getSchemaNamesSql = `SELECT n.nspname
FROM pg_catalog.pg_namespace n
WHERE n.nspname !~ '^pg_'
  AND n.nspname <> 'information_schema'
ORDER BY n.nspname
`
