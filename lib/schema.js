
import Entity from './entity'

export default class Schema extends Entity {
  create (client) {
    return client.exec(`CREATE SCHEMA ${this.name}`)
  }

  drop (client) {
    return client.exec(`DROP SCHEMA IF EXISTS ${this.name}`)
  }

  ensure (client) {
    return this.exists(client)
      .then(exists => !exists ? this.create(client) : undefined)
  }

  exists (client) {
    return client.value(existsSql, this.name)
  }
}

const existsSql = `SELECT EXISTS (
  SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname = $1
)`
