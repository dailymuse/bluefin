
import pg from 'pg'
import Promise from 'bluebird'

export default class Client {
  static clear () {
    this.history = []
  }

  static connect (loc) {
    const inst = new this(loc)
    return inst.connect().then(() => inst)
  }

  constructor (loc) {
    this.pgClient = new pg.Client(loc)
  }

  connect () {
    return new Promise((resolve, reject) => {
      this.pgClient.connect(err => {
        err ? reject(err) : resolve()
      })
    })
  }

  disconnect () {
    this.pgClient.end()
  }

  query (sql, ...args) {
    args = args.length ? args : undefined
    const context = {}
    Error.captureStackTrace(context, Client.prototype.query)
    return new Promise((resolve, reject) => {
      this.pgClient.query(sql, args, (err, result) => {
        this.log(sql, args, result)
        if (err) {
          err.stack = context.stack
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  exec () {
    return this.query(...arguments).then(result => undefined)
  }

  table () {
    return this.query(...arguments).then(result => result.rows)
  }

  row () {
    return this.query(...arguments).then(result => result.rows[0])
  }

  value () {
    return this.query(...arguments).then(result => {
      for (let p in result.rows[0]) return result.rows[0][p]
    })
  }

  log (sql, args, result) {
    const entry = {
      sql,
      args,
      result: {
        command: result.command,
        rowCount: result.rowCount,
        rows: result.rows
      }
    }
    if (!args) delete entry.args
    if (Client.logToConsole) console.log(JSON.stringify(entry))
    Client.history.push(entry)
  }
}

Client.clear()
Client.logToConsole = false
