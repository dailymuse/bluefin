import Client from '../lib/client'
import Program from '../lib/program'
import User from '../lib/user'

const name = 'u1avk5hgsr'
const password = 'secret'

describe('user', () => {
  let client
  let conf
  let raw
  let u

  const exists = () => client.value(existsSql, name)

  before(() => {
    raw = {name}
    conf = {
      program: relpath => undefined,
      password: user => Promise.resolve(password)
    }
    u = new User(conf, 'nickname', raw)
    return Client.connect().then(_client => { client = _client })
  })

  describe('does not exist', () => {
    beforeEach(() => {
      return client.exec(`DROP USER IF EXISTS ${name}`)
    })

    it('exists returns false', () => {
      return u.exists(client)
        .must.eventually.be.false()
    })

    it('drop does nothing', () => {
      return u.drop(client)
        .then(exists)
        .must.eventually.be.false()
    })

    it('ensure creates the user', () => {
      return u.ensure(client)
        .then(exists).must.eventually.be.true()
    })

    it('simple create allows connection', () => {
      return u.create(client).then(() => {
        return Client.connect({user: name, database: 'postgres', password})
      }).then(uc => {
        uc.must.be.a(Client)
        return uc.disconnect()
      })
    })

    it('creates using template', () => {
      return u.create
    })
  })

  describe('does exist', () => {
    beforeEach(() => {
      return exists().then(exists => {
        if (!exists) return client.exec(`CREATE USER ${name}`)
      })
    })

    afterEach(() => {
      return client.exec(`DROP USER IF EXISTS ${name}`)
    })

    it('exists returns true', () => {
      return u.exists(client)
        .must.eventually.be.true()
    })

    it('drops the user', () => {
      return u.drop(client)
        .then(exists)
        .must.eventually.be.false()
    })
  })

  describe('template creation', () => {
    let oldConf
    let oldRaw
    let oldUser

    before(() => {
      oldConf = conf
      oldRaw = raw
      oldUser = u

      conf = {
        password: user => Promise.resolve(password),
        program: relpath => {
          relpath.must.equal('test.sql')
          return new Program(template)
        }
      }
      raw = {name, create: 'test.sql'}
      u = new User(conf, 'nickname', raw)
      return Client.connect().then(_client => { client = _client })
    })

    beforeEach(() => {
      return client.exec(`DROP USER IF EXISTS ${name}`)
    })

    after(() => {
      conf = oldConf
      raw = oldRaw
      u = oldUser
    })

    it('it creates a user with a tempalte', () => {
      return u.create(client)
        .then(() => client.value(hasCreateDbSql, name))
        .must.eventually.be.true()
    })
  })
})

const hasCreateDbSql = 'SELECT rolcreatedb FROM pg_roles WHERE rolname = $1'
const existsSql = 'SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1)'
const template = 'CREATE USER $user CREATEDB'
