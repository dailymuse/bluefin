
import Program from './program'

export default class User {
  constructor (conf, name) {
    this.conf = conf
    this.name = name
  }

  get defaultCreateProgram () {
    return
  }

  create (client) {
    return this.conf.password(this.name)
      .then(password => {
        const program = new Program("CREATE USER $user PASSWORD '$password'")
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
