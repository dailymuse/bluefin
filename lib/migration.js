
import path from 'path'
import Program from './program'

const fileRegEx = /^(\d+)-([-\w]+).sql/

export default class Migration extends Program {
  constructor (template, fpath) {
    super(template, fpath)
    const filename = path.basename(fpath)
    const match = fileRegEx.exec(filename)
    if (match === null) {
      throw new Error(`Malformed filename '${filename}'`)
    }
    this.ordinal = parseInt(match[1])
    this.name = match[2]
  }

  exec (client, context, options = {}) {
    if (options.list) {
      if (options.log) this.log()
      return
    }

    return super.exec(client, context, options)
      .then(() => client.exec(sql, this.ordinal, context.schema, this.name))
  }
}

const sql = `INSERT INTO bluefin.migrations(ordinal, schema, name)
VALUES ($1, $2, $3)`
