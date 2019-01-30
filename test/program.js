import Client from '../lib/client'
import Program from '../lib/program'

describe('program', () => {
  let client

  before(() => {
    return Client.connect().then(_client => { client = _client })
  })

  after(() => {
    if (client) client.disconnect()
  })

  it('can be executed', () => {
    const p = new Program('SELECT 1')
    const context = {}
    return p.exec(client, context)
  })

  it('resolves parameters', () => {
    const p = new Program('SELECT $arb AS num')
    const context = { arb: 42 }
    return p.exec(client, context)
      .then(result => result.rows[0].num.must.equal(42))
  })

  it('executes in a transaction', () => {
    const p = new Program('SELECT $arb')
    const context = { arb: 42 }
    return p.execInTransaction(client, context)
  })

  it('throws an error for unrecognized variables', () => {
    const p = new Program('SELECT $arb')
    const context = {}
    const fn = () => p.exec(client, context)
    fn.must.throw(Error)
  })

  it('throws an error for unrecognized variables in a transaction', () => {
    const p = new Program('SELECT $arb')
    const context = {}
    const fn = () => p.execInTransaction(client, context)
    fn.must.throw(Error)
  })

  it('checks a context without executing', () => {
    const p = new Program('SELECT $arb FROM t')
    const context = { arb: true }
    const fn = () => p.checkContext(context)
    Client.clear()
    fn.must.not.throw(Error)
    Client.history.must.be.empty()
  })

  it('checking finds unrecognized variables', () => {
    const p = new Program('SELECT $arb FROM t')
    const context = {}
    const fn = () => p.checkContext(context)
    Client.clear()
    fn.must.throw(Error, 'Unrecognized variable $arb')
    Client.history.must.be.empty()
  })

  it('ignores query parameters when checking', () => {
    const p = new Program('SELECT $1 FROM t')
    const fn = () => p.checkContext({})
    Client.clear()
    fn.must.not.throw(Error)
    Client.history.must.be.empty()
  })

  it('ignores query parameters when resolving', () => {
    const p = new Program('SELECT $1 FROM t')
    const fn = () => p.resolve({})
    Client.clear()
    fn.must.not.throw(Error)
    Client.history.must.be.empty()
  })
})
