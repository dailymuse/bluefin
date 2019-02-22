import Client from '../lib/client'
import Program from '../lib/program'
import Sequence from '../lib/sequence'

describe('sequence', () => {
  let client

  before(() => {
    return Client.connect({ host: 'pg', port: 5432, user: 'postgres', password: 'postgres' }).then(_client => { client = _client })
  })

  after(() => {
    if (client) client.disconnect()
  })

  describe('single program', () => {
    it('can be executed', () => {
      const p = new Program('SELECT 1')
      const s = new Sequence(p)
      const context = {}
      return s.exec(client, context)
    })
  })

  describe('multiprograms', () => {
    function build () {
      const programs = [...arguments].map(ea => new Program(ea))
      return new Sequence(...programs)
    }

    it('checks for unrecognized variables before executing', () => {
      const s = build('SELECT 1', 'SELECT $arb')
      const fn = () => s.checkContext({})
      Client.clear()
      fn.must.throw(Error, 'Unrecognized variable $arb')
      Client.history.must.be.empty()
    })

    it('rejects on error', () => {
      const s = build('SELECT 1', 'SELECT nurp')
      return s.execInTransaction(client, {}).must.reject.with.an(Error)
    })

    it('executes in a transaction', () => {
      const s = build('CREATE TABLE _test_table ()', 'SELECT nurp')
      return s.execInTransaction(client, {})
        .catch(e => e.message.must.equal('column "nurp" does not exist'))
        .then(() => client.value(tableExistsSql, '_test_table'))
        .then(exists => exists.must.be.false())
    })
  })
})

const tableExistsSql = 'SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relname = $1)'
