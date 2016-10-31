
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
}
