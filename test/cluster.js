
import Client from '../lib/client'
import Cluster from '../lib/cluster'

describe('cluster', () => {
  let conf
  let raw
  let cluster

  function connectionTests () {
    it('connects to default db', function () {
      return cluster.connect().then(c => {
        c.must.be.a(Client)
        c.disconnect()
      })
    })

    it('connects to postgres db', function () {
      return cluster.connect('postgres').then(c => {
        c.must.be.a(Client)
        c.disconnect()
      })
    })
  }

  describe('no dsn', () => {
    before(() => {
      conf = {}
      raw = {}
      cluster = new Cluster(conf, 'nickname', raw)
    })

    connectionTests()
  })

  describe('localhost dsn', () => {
    before(() => {
      conf = {}
      raw = {
        dsn: {
          host: 'localhost',
          port: 5432
        }
      }
      cluster = new Cluster(conf, 'nickname', raw)
    })
    connectionTests()
  })

  describe('dsn with user but no password', () => {
    before(() => {
      conf = { password: () => Promise.resolve(undefined) }
      raw = {
        dsn: {
          user: process.env.USER
        }
      }
      cluster = new Cluster(conf, 'nickname', raw)
    })
    connectionTests()
  })

  describe('dsn with password', () => {
    before(() => {
      conf = { password: () => Promise.resolve('secret') }
      raw = {
        dsn: {
          user: process.env.USER
        }
      }
      cluster = new Cluster(conf, 'nickname', raw)
    })

    it('connects to default db', function () {
      return cluster.connect().then(c => {
        c.must.be.a(Client)
        c.dsn.password.must.equal('secret')
        c.disconnect()
      })
    })
  })
})
