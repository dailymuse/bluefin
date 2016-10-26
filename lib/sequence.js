export default class Sequence {
  constructor () {
    this.programs = [...arguments]
  }

  checkContext (context) {
    this.programs.forEach(ea => ea.checkContext(context))
  }

  exec (client, context) {
    let vow = Promise.resolve()
    this.programs.forEach(ea => {
      vow = vow.then(() => ea.exec(client, context))
    })
    return vow
  }

  execInTransaction (client, context) {
    return client.exec('BEGIN')
      .then(() => this.exec(client, context))
      .then(
        result => client.exec('COMMIT').return(result),
        err => client.exec('ROLLBACK').throw(err)
      )
  }
}
