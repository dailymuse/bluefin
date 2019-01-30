
import BluefinConfiguration from './bluefin-configuration'
import Entity from './entity'
import Program from './program'
import Promise from 'bluebird'

export default class Schema extends Entity {
  static bluefin () {
    const conf = new BluefinConfiguration()
    const raw = { migrations: '/bluefin/migrations' }
    return new this(conf, 'bluefin', raw)
  }

  get grants () {
    return this.raw.grants || {}
  }

  get userNames () {
    return Object.keys(this.grants)
  }

  apply (client, options = {}) {
    const { migrations: absolute } = this.raw
    const last = options.last
    const vow = options.first
      ? Promise.resolve(options.first)
      : this.getOrdinalOfLastAppliedMigration(client)
        .then(ordinal => ordinal + 1)

    return vow
      .then(first => this.conf.migrations(absolute, first, last))
      .then(migrations => {
        const context = { schema: this.name }
        return migrations.execInTransaction(client, context, options)
      })
  }

  build (client, options) {
    const buildOpts = Object.assign({}, options, { first: 1 })
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

  getPrivileges (client) {
    return client.table(privilegesSql, this.name, this.userNames)
  }

  getTableNames (client) {
    return client.column(tableNamesSql, this.name)
  }

  grantPrivileges (client, options) {
    let vow = Promise.resolve()

    this.userNames.forEach(u => {
      const context = {
        schema: this.name,
        user: u
      }

      let paths = this.grants[u]
      if (!Array.isArray(paths)) paths = [paths]
      paths.forEach(p => {
        vow = vow.then(() => {
          return this.conf.program(p)
            .then(program => program.exec(client, context, options))
        })
      })
    })

    return vow
  }

  rebuild (client, options) {
    return this.drop(client)
      .then(() => this.build(client, options))
  }

  revoke (client, kind, users) {
    const context = {
      kind,
      schema: this.name,
      users
    }
    return revokeProgram.exec(client, context)
  }

  revokePrivileges (client) {
    let users
    return Promise.try(() => {
      users = this.userNames.join(', ')
    })
      .then(() => this.revoke(client, 'tables', users))
      .then(() => this.revoke(client, 'functions', users))
      .then(() => this.revoke(client, 'sequences', users))
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

const revokeProgram = new Program(
  `REVOKE ALL PRIVILEGES
  ON ALL $kind IN SCHEMA $schema
  FROM $users CASCADE`
)

const privilegesSql = `
with
  n as (
    select
      oid,
      oid as nsp,
      'n'::"char" as kind,
      nspname as name,
      aclexplode(nspacl) as priv
    from pg_namespace
  ),
  c as (
    select
      oid,
      relnamespace as nsp,
      relkind as kind,
      relname as name,
      aclexplode(relacl) as priv
    from pg_class
  ),
  f as (
    select
      oid,
      pronamespace as nsp,
      'f'::"char" as kind,
      proname as name,
      aclexplode(proacl) as priv
    from pg_proc
  ),
  p as (
    select * from n
    union
    select * from c
    union
    select * from f
  )

select
  u.usename,
  p.kind,
  p.name,
  (p.priv).privilege_type as priv
from pg_namespace nsp
join p on p.nsp = nsp.oid
join pg_user u on u.usesysid = (p.priv).grantee
where nsp.nspname = $1
  and u.usename = ANY($2)
`
