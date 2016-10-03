import path from 'path'
import pg from 'pg'

import Configuration from '../lib/configuration'
import Endpoint from '../lib/endpoint'
import fix1 from './fixtures/one.js'

const base = '/test'

function vpath (relative) {
  return path.resolve(base, relative)
}

describe('endpoint', () => {
  let ep

  before(() => {
    return Configuration.read(vpath('conf.json'), fix1(base)).then(conf => {
      ep = conf.endpoint('production')
    })
  })

  it('connects', function () {
    return ep.connect().then(c => {
      c.must.be.a(pg.Client)
      c.end()
    })
  })
})
