
export default class Database {
  constructor (conf, name, raw) {
    this.conf = conf
    this.name = raw.name || name
    this.endpoint = conf.endpoint(raw.endpoint)
  }

  connect () {
    if (!this._dbClientVow) this._dbClientVow = this.endpoint.connect(this.name)
    return this._dbClientVow
  }

  pgConnect () {
    if (!this._pgClientVow) this._pgClientVow = this.endpoint.connect('postgres')
    return this._pgClientVow
  }

  disconnect () {
    if (this._dbClientVow && this._dbClientVow.isResolved) {
      this._dbClientVow.value.disconnect()
    }
    if (this._pgClientVow && this._pgClientVow.isResolved) {
      this._pgClientVow.value.disconnect()
    }
  }

  exists () {
    return this.pgConnect()
      .then(c => c.value(dbExistsSql, this.name))
      .then(value => !!value)
  }

  ensure () {
    return this.exists().then(exists => {
      if (!exists) {
        return this.pgConnect()
          .then(c => c.exec(`CREATE DATABASE ${this.name}`))
      }
    })
  }

  drop () {
    return this.exists().then(exists => {
      if (exists) {
        return this.pgConnect()
          .then(c => c.exec(`DROP DATABASE ${this.name}`))
      }
    })
  }
}

const dbExistsSql = 'SELECT 1 FROM pg_database WHERE datname=$1'
