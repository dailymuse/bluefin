
import pg from 'pg'
import Promise from 'bluebird'

export default class Client {
  static clear () {
    this.history = []
  }

  static connect (dsn) {
    const inst = new this(dsn)
    return inst.connect().then(() => inst)
  }

  constructor (dsn) {
    this.dsn = dsn
    this.pgClient = new pg.Client(dsn)
  }

  connect () {
    return Promise.fromCallback(callback => {
      this.pgClient.connect(callback)
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
        if (err) {
          err.stack = context.stack
          return reject(err)
        }
        this.log(sql, args, result)
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

  column () {
    return this.query(...arguments).then(result => result.rows.map(ea => ea[0]))
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
