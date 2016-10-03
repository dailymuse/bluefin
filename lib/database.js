
export default class Database {
  constructor (conf, name, raw) {
    this.conf = conf
    this.name = raw.name || name
  }
}
