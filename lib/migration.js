
import path from 'path'
import Program from './program'

export default class Migration extends Program {
  constructor (template, fpath) {
    super(template, fpath)
    const filename = path.basename(fpath)
    this.ordinal = parseInt(/^(\d+)-/.exec(filename)[1])
    if (isNaN(this.ordinal)) throw new Error('no migration number!')
  }
}
