import Client from '../lib/client'
import Migration from '../lib/migration'

describe('migration', () => {
  let client

  before(() => {
    return Client.connect().then(_client => { client = _client })
  })

  after(() => {
    if (client) client.disconnect()
  })

  it('parses filenames', function () {
    const m = new Migration('ignore', '/migration/1-test.sql')
    m.ordinal.must.equal(1)
    m.name.must.equal('test')
  })

  it('handles leading zeros', function () {
    const m = new Migration('ignore', '/migration/001-test.sql')
    m.ordinal.must.equal(1)
    m.name.must.equal('test')
  })

  it('handles multi-dash-name', function () {
    const m = new Migration('ignore', '/migration/001-multi-dash-name.sql')
    m.ordinal.must.equal(1)
    m.name.must.equal('multi-dash-name')
  })

  it('handles camelCaseName', function () {
    const m = new Migration('ignore', '/migration/001-camelCaseName.sql')
    m.ordinal.must.equal(1)
    m.name.must.equal('camelCaseName')
  })

  it('handles underscore_name', function () {
    const m = new Migration('ignore', '/migration/001-underscore_name.sql')
    m.ordinal.must.equal(1)
    m.name.must.equal('underscore_name')
  })

  it('throws on no ordinal', function () {
    const create = () => new Migration('ignore', '/migration/gong.sql')
    create.must.throw(Error, "Malformed filename 'gong.sql'")
  })

  it('throws on no SQL extension', function () {
    const create = () => new Migration('ignore', '/migration/001-gong')
    create.must.throw(Error, "Malformed filename '001-gong'")
  })
})
