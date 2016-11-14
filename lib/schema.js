
import BluefinConfiguration from './bluefin-configuration'
import Entity from './entity'

export default class Schema extends Entity {
  static bluefin () {
    const conf = new BluefinConfiguration()
    const raw = { migrations: '/bluefin/migrations' }
    return new this(conf, 'bluefin', raw)
  }

  apply (client, options = {}) {
    return this.conf.migrations(this.raw.migrations, options.first, options.last)
      .then(migrations => {
        const context = {schema: this.name}
        return migrations.execInTransaction(client, context)
      })
  }

  build (client, options) {
    return this.create(client)
      .then(() => this.apply(client, options))
  }

  create (client) {
    return client.exec(`CREATE SCHEMA ${this.name}`)
  }

  drop (client) {
    return client.exec(`DROP SCHEMA IF EXISTS ${this.name} CASCADE`)
  }

  ensure (client) {
    return this.exists(client)
      .then(exists => !exists ? this.create(client) : undefined)
  }

  exists (client) {
    return client.value(existsSql, this.name)
  }

  getTableNames (client) {
    return client.column(tableNamesSql, this.name)
  }

  rebuild (client, options) {
    return this.drop(client)
      .then(() => this.build(client, options))
  }
}

const existsSql = `SELECT EXISTS (
  SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname = $1
)
`

const tableNamesSql = `SELECT c.relname
  FROM pg_catalog.pg_class c
  LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' AND n.nspname = $1
`
