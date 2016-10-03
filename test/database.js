import path from 'path'
import pg from 'pg'
import Promise from 'bluebird'

import Configuration from '../lib/configuration'
import Database from '../lib/database'
import fix1 from './fixtures/one.js'

Promise.promisifyAll(pg);

const base = '/test'

function vpath (relative) {
  return path.resolve(base, relative)
}

function connect(config) {
  const c = new pg.Client(config)
  return Promise.fromCallback(cb => c.connect(cb))
    .then(() => c)
}

describe('database', () => {
  let db
  let c

  before(() => {
    return Configuration.read(vpath('conf.json'), fix1(base))
      .then(conf => {db = conf.database('prod')})
  })

  it('ensure creates', function () {

  })
})
