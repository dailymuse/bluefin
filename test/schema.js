
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
      .then(() => Client.connect({ host: 'pg', port: 5432, user: 'postgres', password: 'postgres' }))
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
      return hoops.drop(c)
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
          names.must.include('team')
          names.must.include('game')
        })
    })

    it('build honors last option', function () {
      return hoops.build(c, { last: 1 })
        .then(() => hoops.getTableNames(c))
        .then(names => {
          names.must.include('team')
          names.must.not.include('game')
        })
    })

    it('apply honors first option', function () {
      return hoops.build(c, { last: 1 })
        .then(() => hoops.apply(c, { first: 2 }))
        .then(() => hoops.getTableNames(c))
        .then(names => {
          names.must.include('game')
        })
    })

    it('apply honors last option', function () {
      return hoops.build(c, { last: 1 })
        .then(() => hoops.apply(c, { first: 2, last: 1 }))
        .then(() => hoops.getTableNames(c))
        .then(names => {
          names.must.not.include('game')
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

  describe('has partial migrations', () => {
    beforeEach(() => {
      return db.rebuild({ last: 1 })
    })

    it('applies new migrations', function () {
      return hoops.apply(c)
        .then(() => hoops.getTableNames(c))
        .then(names => {
          names.length.must.equal(2)
          names.must.include('game')
        })
    })
  })

  describe('bluefin', function () {
    let bluefin

    beforeEach(() => {
      bluefin = Schema.bluefin()
      return bluefin.drop(c)
    })

    it('is a schema', function () {
      bluefin.must.be.a(Schema)
    })

    it('creates the migrations table', function () {
      return bluefin.build(c).then(() => {
        return bluefin.getTableNames(c).must.eventually.include('migrations')
      })
    })
  })
})
