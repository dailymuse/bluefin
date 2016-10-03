import path from 'path'

class FileEntity {
  constructor (filepath, re) {
    this.path = filepath
    const match = re.exec(path.basename(filepath))
    if (match) {
      this.name = match[1]
    }
  }
}

export class Migration extends FileEntity {
  constructor (filepath) {
    super(filepath, /\d+-(.+)\.sql/)
    const match = /(\d+)-.+\.sql/.exec(path.basename(filepath))
    if (match) this.ordinal = parseInt(match[1])
  }
}
