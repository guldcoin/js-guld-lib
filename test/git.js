/* eslint-env node, mocha */
const assert = require('chai').assert
const pify = require('pify')
const nodefs = pify(require('fs'))
const GitGuld = require('../src/git.js')
const GuldDB = require('../src/db.js')
const GuldFS = require('../src/fs.js')
const Observer = require('../src/observer.js')
const o = new Observer()
nodefs.observer = o

o.hosts = [{'auth': undefined}]

describe('GitGuld', () => {
  before(async () => {
    await o.initComponent('db', async (o) => new GuldDB({observer: o}))
    await o.initComponent('fs', async (o) => new GuldFS(nodefs))
  })
  it('constructor', async () => {
    var git = new GitGuld(o)
    assert.isTrue(git instanceof GitGuld)
    assert.exists(git.observer)
    assert.notExists(o.git)
    assert.isTrue(git.observer instanceof Observer)
    assert.equal(git.observer, o)
  })
  if (o.hosts[0].auth) {
    it('init', async () => {
      await o.initComponent('git', async (o) => new GitGuld({observer: o}))
      assert.exists(o.git)
      assert.isTrue(o.git instanceof GitGuld)
      assert.equal(o.git.observer, o)
    })
    it('init again', async () => {
      await o.initComponent('git', async (o) => new GitGuld({observer: o}))
      assert.exists(o.git)
      assert.isTrue(o.git instanceof GitGuld)
      assert.equal(o.git.observer, o)
    })
  } else {
    console.warn('WARNING: Skipping git host tests.')
  }
})
