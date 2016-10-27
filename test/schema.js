
import Client from '../lib/client'
import Configuration from '../lib/configuration'
import Schema from '../lib/schema'
import vfs from './fixtures/simple.js'

describe('schema', () => {
  let c
  let db
  let hoops

  before(() => {
    return Configuration.read('/test/conf.json', vfs)
      .then(conf => {
        db = conf.database('bft')
        hoops = db.schema.hoops
        return Client.connect({})
      })
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
    hoops.name.must.equal('basketball')
    hoops.conf.must.be.a(Configuration)
    hoops.raw.must.be.an(Object)
  })
})

