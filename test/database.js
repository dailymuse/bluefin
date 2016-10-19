
import Client from '../lib/client'
import Configuration from '../lib/configuration'
import vfs from './fixtures/one.js'

describe('database', () => {
  let db
  let c

  before(() => {
    return Configuration.read('/test/conf.json', vfs)
      .then(conf => {
        db = conf.database('prod')
        db.conf.raw.databases.prod.endpoint = 'test'
        return Client.connect(db.conf.endpoint('test').loc)
      })
      .then(client => { c = client })
  })

  beforeEach(() => {
    Client.clear()
  })

  after(() => {
    if (c) c.disconnect()
  })

  it('ensure creates when absent', function () {
    return c.query(`DROP DATABASE IF EXISTS ${db.name}`)
      .then(() => db.ensure())
      .then(() => c.value('SELECT 1 FROM pg_database WHERE datname=$1', db.name))
      .then(value => value.must.equal(1))
  })

  it('ensure does nothing when present', function () {
    return db.ensure()
      .then(() => {
        Client.clear()
        return db.ensure()
      })
      .then(() => {
        Client.history.some(ea => ea.result.command === 'CREATE').must.be.false()
      })
  })

  it('drop destroys when present', function () {
    return db.ensure()
      .then(() => db.drop())
      .then(() => db.exists())
      .then(exists => exists.must.be.false())
  })

  it('drop skips when not present', function () {
    return db.drop()
      .then(() => {
        Client.clear()
        return db.drop()
      })
      .then(() => {
        Client.history.some(ea => ea.result.command === 'DROP').must.be.false()
      })
  })

})

