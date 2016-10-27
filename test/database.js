
import Client from '../lib/client'
import Configuration from '../lib/configuration'
import Schema from '../lib/schema'
import vfs from './fixtures/one.js'

describe('database', () => {
  let db
  let c

  describe('safety off', () => {
    before(() => {
      return Configuration.read('/test/conf.json', vfs)
        .then(conf => {
          db = conf.database('integration')
          db.conf.raw.databases.integration.cluster = 'test'
          return Client.connect(db.conf.cluster('test').dsn)
        })
        .then(client => { c = client })
    })

    beforeEach(() => {
      Client.clear()
    })

    after(() => {
      if (c) c.disconnect()
    })

    it('creates schema', function () {
      const baseball = db.schema.baseball
      baseball.must.be.a(Schema)
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

    it('drop destroys database when present', function () {
      return db.ensure()
        .then(() => db.drop())
        .then(() => db.exists())
        .then(exists => exists.must.be.false())
    })

    it('drop does nothing when database not present', function () {
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

  describe('safety on', () => {
    before(() => {
      return Configuration.read('/test/conf.json', vfs)
        .then(conf => {
          db = conf.database('prod')
          db.conf.raw.databases.prod.cluster = 'test'
          return Client.connect(db.conf.cluster('test').dsn)
        })
        .then(client => { c = client })
    })

    it('drop throws error when safety is on', function () {
      return db.drop().must.reject.to.eql(new Error('safety'))
    })
  })
})

