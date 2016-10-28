
import Client from '../lib/client'
import Configuration from '../lib/configuration'
import Schema from '../lib/schema'
import vfs from './fixtures/simple.js'

const name = 'basketball'

describe('schema', () => {
  let c
  let db
  let hoops

  before(() => {
    return Configuration.read('/test/conf.json', vfs)
      .then(conf => {
        db = conf.database('bft')
        hoops = db.schema.hoops
        return db.ensure()
      })
      .then(() => Client.connect({database: db.name}))
      .then(client => { c = client })
  })

  beforeEach(() => {
    Client.clear()
  })

  after(() => {
    if (c) c.disconnect()
  })

  it('initializes correctly', function () {
    hoops.must.be.a(Schema)
    hoops.name.must.equal(name)
    hoops.conf.must.be.a(Configuration)
    hoops.raw.must.be.an(Object)
  })

  describe('does not exist', () => {
    beforeEach(() => {
      return c.exec(dropSql)
    })

    it('exists is false', function () {
      return hoops.exists(c).must.eventually.be.false()
    })

    it('create creates', function () {
      return hoops.create(c)
        .then(() => hoops.exists(c))
        .must.eventually.be.true()
    })

    it('drop succeeds', function () {
      return hoops.drop(c)
        .then(() => hoops.exists(c))
        .must.eventually.be.false()
    })

    it('ensure creates', function () {
      return hoops.ensure(c)
        .then(() => hoops.exists(c))
        .must.eventually.be.true()
    })

    it('build applies migrations', function () {
      return hoops.build(c)
        .then(() => hoops.getTableNames(c))
        .then(names => {
          console.log('names', names)
          names.must.include('team')
          names.must.include('game')
        })
    })
  })

  describe('does exist', () => {
    beforeEach(() => {
      return hoops.ensure(c)
    })

    it('exists is true', function () {
      return hoops.exists(c).must.eventually.be.true()
    })

    it('create fails', function () {
      return hoops.create(c).must.reject.an(Error)
    })

    it('drop succeeds', function () {
      return hoops.drop(c)
        .then(() => hoops.exists(c))
        .must.eventually.be.false()
    })

    it('ensure does nothing', function () {
      Client.clear()
      return hoops.ensure(c)
        .then(() => hoops.exists(c))
        .then(exists => {
          exists.must.be.true()
          Client.history.some(ea => ea.command === 'CREATE').must.be.false()
        })
    })
  })
})

const dropSql = `DROP SCHEMA IF EXISTS ${name} CASCADE`
