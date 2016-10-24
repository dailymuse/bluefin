
import Entity from './entity'
import Program from './program'
import Promise from 'bluebird'

export default class User extends Entity {
  get defaultCreateProgram () {
    return new Program("CREATE USER $user PASSWORD '$password'")
  }

  create (client) {
    return Promise.all([
      this.conf.password(this.name),
      this.raw.create ? this.conf.program(this.raw.create) : undefined
    ]).spread((password, program) => {
      program = program || this.defaultCreateProgram
      return program.exec(client, {user: this.name, password})
    })
  }

  drop (client) {
    return client.exec(`DROP USER IF EXISTS ${this.name}`)
  }

  ensure (client) {
    return this.exists(client)
      .then(exists => {
        if (!exists) return this.create(client)
      })
  }

  exists (client) {
    const sql = 'SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1)'
    return client.value(sql, this.name)
  }
}
