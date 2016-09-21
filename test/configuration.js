
import path from 'path'

import Configuration from '../lib/configuration'
import {Migration, User} from '../lib/entities'
import fix1 from './fixtures/one.js'

const base = '/test'

function vpath (relative) {
  return path.resolve(base, relative)
}
function mount (fix) {
  Configuration.fs = fix(base)
}

describe('configuration', () => {
  it('constructor', function () {
    mount(fix1)
    const conf = new Configuration(vpath('conf.json'))
    conf.directory.must.equal(base)
    conf.loc.must.have.property('migrations', `${base}/migrations`)
    conf.loc.must.have.property('grants', `${base}/grants`)
  })

  it('migrations', function () {
    mount(fix1)
    const conf = new Configuration(vpath('conf.json'))
    return conf.migrations().then(migrations => {
      migrations.must.be.an.array()
      migrations.length.must.equal(2)

      const first = migrations[0]
      first.must.be.a(Migration)
      first.ordinal.must.equal(1)
      first.name.must.equal('create-team')

      const second = migrations[1]
      second.must.be.a(Migration)
      second.ordinal.must.equal(2)
      second.name.must.equal('create-game')
    })
  })

  it('grants', function () {
    mount(fix1)
    const conf = new Configuration(vpath('conf.json'))
    return conf.grants().then(grants => {
      grants.must.be.an.array()
      grants.length.must.equal(2)

      const first = grants[0]
      first.name.must.equal('reader')

      const second = grants[1]
      second.name.must.equal('writer')
    })
  })

})