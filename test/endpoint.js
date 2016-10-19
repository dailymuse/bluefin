import path from 'path'

import Client from '../lib/client'

import Configuration from '../lib/configuration'
import vfs from './fixtures/one.js'

describe('endpoint', () => {
  let ep

  before(() => {
    return Configuration.read('/test/conf.json', vfs).then(conf => {
      ep = conf.endpoint('production')
    })
  })

  it('connects', function () {
    return ep.connect().then(c => {
      c.must.be.a(Client)
      c.disconnect()
    })
  })
})
