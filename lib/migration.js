
import path from 'path'

export default class Migration {
  constructor (filepath) {
    this.path = filepath
    
    const base = path.basename(filepath)
    const match = /(\d+)-(.+).sql/.exec(base)
    this.ordinal = parseInt(match[1])
    this.name = match[2]
  }
}