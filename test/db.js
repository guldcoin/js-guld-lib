/* eslint-env node, mocha */
const assert = require('chai').assert
const GuldDB = require('../src/db.js')
const Observer = require('../src/observer.js')
const o = new Observer()

describe('GuldDB', () => {
  it('constructor', async () => {
    var db = new GuldDB(o)
    assert.isTrue(db instanceof GuldDB)
    assert.exists(db.observer)
    assert.notExists(o.db)
    assert.isTrue(db.observer instanceof Observer)
    assert.equal(db.observer, o)
  })
  it('init', async () => {
    await o.initComponent('db', async (o) => new GuldDB({observer: o}))
    assert.exists(o.db)
    assert.isTrue(o.db instanceof GuldDB)
    assert.equal(o.db.observer, o)
  })
  it('init again', async () => {
    await o.initComponent('db', async (o) => new GuldDB({observer: o}))
    assert.exists(o.db)
    assert.isTrue(o.db instanceof GuldDB)
    assert.equal(o.db.observer, o)
  })
})
