import path from 'path'

import Configuration from '../lib/configuration'
import Database from '../lib/database'
import Endpoint from '../lib/endpoint'
import fix1 from './fixtures/one.js'

const base = '/test'

function vpath (relative) {
  return path.resolve(base, relative)
}

describe('configuration', () => {
  let conf
  let vfs

  before(() => {
    vfs = fix1(base)
    return Configuration.read(vpath('conf.json'), vfs).then(_conf => {
      conf = _conf
    })
  })

  it('constructs a configuration', function () {
    conf.directory.must.equal(base)
    conf.file.must.equal('conf.json')
    conf.raw.must.be.an(Object)
    conf.fs.must.be(vfs)
  })

  it('supplies passwords', function () {
    return conf.password('root').must.eventually.equal('abc')
  })

  it('supplies endpoints', function () {
    const ep = conf.endpoint('production')
    ep.must.be.an(Endpoint)
    ep.must.have.property('name', 'production')
  })

  it('throws an error for unknown endpoints', function () {
    (() => conf.endpoint('nork')).must.throw(Error, 'unknown endpoint')
  })

  it('supplies databases via nickname', function () {
    const db = conf.database('prod')
    db.must.be.a(Database)
    db.name.must.equal('appdata')
  })

  it('supplies databases with implicit name', function () {
    const db = conf.database('unit')
    db.must.be.a(Database)
    db.name.must.equal('unit')
  })

  it('thrown an error for unknown databases', function () {
    (() => conf.database('nork')).must.throw(Error, 'unknown database')
  })
})
