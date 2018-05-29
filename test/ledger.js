/* eslint-env node, mocha */
const assert = require('chai').assert
const pify = require('pify')
const nodefs = pify(require('fs'))
const GuldLedger = require('../src/ledger.js')
const GitGuld = require('../src/git.js')
const GuldDB = require('../src/db.js')
const GuldFS = require('../src/fs.js')
const Observer = require('../src/observer.js')
const o = new Observer()
nodefs.observer = o
const options = GuldLedger.getDefaults('')
options.observer = o

o.hosts = [{'auth': undefined}]

describe('GuldLedger', () => {
  before(async () => {
    await o.initComponent('db', async (o) => new GuldDB(options))
    await o.initComponent('fs', async (o) => new GuldFS(nodefs))
    await o.initComponent('git', async (o) => new GitGuld(options))
  })
  it('constructor', async () => {
    var ledger = new GuldLedger(options)
    assert.isTrue(ledger instanceof GuldLedger)
    assert.exists(ledger.observer)
    assert.notExists(o.ledger)
    assert.isTrue(ledger.observer instanceof Observer)
    assert.equal(ledger.observer, o)
  }).timeout(60000)
  it('init', async () => {
    await o.initComponent('ledger', async (o) => new GuldLedger(options))
    assert.exists(o.ledger)
    assert.isTrue(o.ledger instanceof GuldLedger)
    assert.equal(o.ledger.observer, o)
  })
  it('init again', async () => {
    await o.initComponent('ledger', async (o) => new GuldLedger(options))
    assert.exists(o.ledger)
    assert.isTrue(o.ledger instanceof GuldLedger)
    assert.equal(o.ledger.observer, o)
  })
})
