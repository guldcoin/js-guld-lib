/* eslint-env node, mocha */
const assert = require('chai').assert
const pify = require('pify')
const nodefs = pify(require('fs'))
const GuldKeyring = require('../src/keyring.js')
const GitGuld = require('../src/git.js')
const GuldDB = require('../src/db.js')
const GuldFS = require('../src/fs.js')
const Observer = require('../src/observer.js')
const o = new Observer()
nodefs.observer = o
const options = {
  observer: o
}

o.hosts = [{'auth': undefined}]

describe('GuldKeyring', () => {
  before(async function () {
    this.timeout(3000)
    await o.initComponent('db', async (o) => new GuldDB({observer: o}))
    await o.initComponent('fs', async (o) => new GuldFS(nodefs))
    await o.initComponent('git', async (o) => new GitGuld({observer: o}))
  })
  it('constructor', async () => {
    console.log(options)
    var keyring = new GuldKeyring(options)
    console.log(keyring)
    assert.isTrue(keyring instanceof GuldKeyring)
    assert.exists(keyring.observer)
    assert.notExists(o.keyring)
    assert.isTrue(keyring.observer instanceof Observer)
    assert.equal(keyring.observer, o)
  })
  if (o.hosts[0].auth) {
    it('init', async () => {
      await o.initComponent('keyring', async (o) => new GuldKeyring(options))
      assert.exists(o.keyring)
      assert.isTrue(o.keyring instanceof GuldKeyring)
      assert.equal(o.keyring.observer, o)
    })
    it('init again', async () => {
      await o.initComponent('keyring', async (o) => new GuldKeyring(options))
      assert.exists(o.keyring)
      assert.isTrue(o.keyring instanceof GuldKeyring)
      assert.equal(o.keyring.observer, o)
    })
  } else {
    console.warn('WARNING: Skipping git host tests.')
  }
})
