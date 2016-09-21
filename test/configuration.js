
import Configuration from '../lib/configuration'
import memfs from 'memfs'
import path from 'path'

import fix1 from './fixtures/one.js'

const base = '/test'

function vpath (relative) {
  return path.resolve(base, relative)
}
function mount (tree) {
  Configuration.fs = new memfs.Volume()
  Configuration.fs.mountSync(base, tree)
  Configuration.fs.mkdirSync(`${base}/migrations`)
}

describe('configuration', () => {

  it('constructor', function () {
    mount(fix1)
    const conf = new Configuration(vpath('conf.json'))
    conf.directory.must.equal(base)
    conf.loc.must.have.property('migrations', `${base}/migrations`)
  })

  it('migrations', function () {
    mount(fix1)
    const conf = new Configuration(vpath('conf.json'))
    return conf.migrations().then(migrations => {
      migrations.must.be.an.array()
      migrations.length.must.equal(2)

      const first = migrations[0]
      first.ordinal.must.equal(1)
      first.name.must.equal('create-zilt')

      const second = migrations[1]
      second.ordinal.must.equal(2)
      second.name.must.equal('create-derp')
    })
  })
})