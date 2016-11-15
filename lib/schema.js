
import BluefinConfiguration from './bluefin-configuration'
import Entity from './entity'

export default class Schema extends Entity {
  static bluefin () {
    const conf = new BluefinConfiguration()
    const raw = { migrations: '/bluefin/migrations' }
    return new this(conf, 'bluefin', raw)
  }

  apply (client, options = {}) {
    const {migrations: absolute} = this.raw
    const last = options.last
    const vow = options.first
      ? Promise.resolve(options.first)
      : this.getOrdinalOfLastAppliedMigration(client)
        .then(ordinal => ordinal + 1)

    return vow
      .then(first => this.conf.migrations(absolute, first, last))
      .then(migrations => {
        const context = {schema: this.name}
        return migrations.execInTransaction(client, context, options)
      })
  }

  build (client, options) {
    const buildOpts = Object.assign({}, options, {first: 1})
    return this.create(client)
      .then(() => this.apply(client, buildOpts))
  }

  create (client) {
    return client.exec(`CREATE SCHEMA ${this.name}`)
  }

  drop (client) {
    return client.exec(`DROP SCHEMA IF EXISTS ${this.name} CASCADE`)
      .then(() => {
        if (this.name !== 'bluefin') {
          return client.exec(deleteMigrationsSql, this.name)
        }
      })
  }

  ensure (client) {
    return this.exists(client)
      .then(exists => !exists ? this.create(client) : undefined)
  }

  exists (client) {
    return client.value(existsSql, this.name)
  }

  getOrdinalOfLastAppliedMigration (client) {
    return client.value(maxOrdinalSql, this.name)
  }

  getTableNames (client) {
    return client.column(tableNamesSql, this.name)
  }

  rebuild (client, options) {
    return this.drop(client)
      .then(() => this.build(client, options))
  }
}

const deleteMigrationsSql = `DELETE FROM bluefin.migrations
WHERE schema = $1`

const existsSql = `SELECT EXISTS (
  SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname = $1
)
`

const maxOrdinalSql = `SELECT MAX (ordinal)
FROM bluefin.migrations
WHERE schema = $1
`

const tableNamesSql = `SELECT c.relname
  FROM pg_catalog.pg_class c
  LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' AND n.nspname = $1
`
