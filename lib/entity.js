
export default class Entity {
  constructor (conf, nickname, raw) {
    this.conf = conf
    this.name = raw.name || nickname
    this.raw = typeof raw === 'object' ? raw : {migrations: raw}
  }
}
