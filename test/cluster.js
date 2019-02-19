
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

  // can't test this in the docker environment we've created
  describe.skip('no dsn', () => {
    before(() => {
      conf = {}
      raw = {}
      cluster = new Cluster(conf, 'nickname', raw)
    })

    connectionTests()
  })

  // can't test this in the docker environment we've created
  describe.skip('localhost dsn', () => {
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

  describe('dsn with password', () => {
    before(() => {
      conf = { password: () => Promise.resolve('postgres') }
      raw = {
        dsn: {
          host: 'pg',
          user: 'postgres'
        }
      }
      cluster = new Cluster(conf, 'nickname', raw)
    })

    it('connects to default db', function () {
      return cluster.connect().then(c => {
        c.must.be.a(Client)
        c.dsn.password.must.equal('postgres')
        c.disconnect()
      })
    })
  })
})
