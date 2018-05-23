/* eslint-env node, mocha */

const assert = require('assert')
const os = require('os')
const path = require('path')
const git = require('../src/git.js')
const {Amount} = require('ledger-types')
const {Blocktree, Transaction, Transfer, Grant, Register} = require('./guld-lib.js')
const flexfs = require('flexfs')
var fs

describe('Blocktree', () => {
  before(async () => {
    fs = await flexfs()
  })
  it('construct', function () {
    this.blocktree = new Blocktree()
  })
  it('init', async () => {
    var plist = await fs.readdir(`/BLOCKTREE/guld/ledger/prices`)
    assert(plist.length > 0)
    assert(plist.indexOf('gg.db') >= 0)
    var glist = await fs.readdir(`/BLOCKTREE/guld/ledger/GULD`)
    assert(glist.length > 0)
    assert(glist.indexOf('isysd') >= 0)
    glist = await fs.readdir(`/BLOCKTREE/guld/ledger/GG`)
    assert(glist.length > 0)
    assert(glist.indexOf('isysd') >= 0)
    var klist = await fs.readdir(`/BLOCKTREE/guld/keys/pgp`)
    assert(klist.length > 0)
    assert(klist.indexOf('isysd') >= 0)
  }).timeout(120000)
  it('init again', async () => {
    await this.blocktree.init()
    var plist = await fs.readdir(`/BLOCKTREE/guld/ledger/prices`)
    assert(plist.length > 0)
    assert(plist.indexOf('gg.db') >= 0)
    var glist = await fs.readdir(`/BLOCKTREE/guld/ledger/GULD`)
    assert(glist.length > 0)
    assert(glist.indexOf('isysd') >= 0)
    var klist = await fs.readdir(`/BLOCKTREE/guld/keys/pgp`)
    assert(klist.length > 0)
    assert(klist.indexOf('isysd') >= 0)
  }).timeout(10000)
  it('listNames', function (done) {
    this.timeout(10000)
    this.blocktree.listNames().then(nlist => {
      assert(nlist.length > 1000)
      done()
    }).catch(done)
  })
  it('nameIsValid', function () {
    var valid = this.blocktree.nameIsValid('iamastupidnamenoonewouldtake-1')
    assert(valid)
  })
  it('nameIsValid uppercase', function () {
    try {
      this.blocktree.nameIsValid('ISYSD')
      assert(true === false)
    } catch (err) {
      return err
    }
  })
  it('nameIsValid _', function () {
    try {
      this.blocktree.nameIsValid('isy_sd')
      assert(true === false)
    } catch (err) {
      return err
    }
  })
  it('nameIsValid .', function () {
    try {
      this.blocktree.nameIsValid('isy.sd')
      assert(true === false)
    } catch (err) {
      return err
    }
  })
  it('nameIsValid :', function () {
    try {
      this.blocktree.nameIsValid('isy:sd')
      assert(true === false)
    } catch (err) {
      return err
    }
  })
  it('isNameAvail', function (done) {
    this.blocktree.isNameAvail('iamastupidnamenoonewouldtake-1').then(avail => {
      assert(avail)
      done()
    }).catch(done)
  })
  it('isNameAvail not', function (done) {
    this.blocktree.isNameAvail('isysd').then(avail => {
      assert(avail === false)
      done()
    })
  })
  it('setLedger', function (done) {
    this.timeout(60000)
    assert(typeof this.blocktree.getLedger() === 'undefined')
    this.blocktree.setLedger().then(() => {
      assert(typeof this.blocktree.getLedger() !== 'undefined')
      done()
    })
  })
  it('ledger balance', function (done) {
    this.timeout(10000)
    var ledger = this.blocktree.getLedger()
    ledger.balance().then(bals => {
      assert(typeof bals !== 'undefined')
      assert(bals.hasOwnProperty('isysd'))
      assert(bals.isysd.hasOwnProperty('Assets'))
      assert(bals.isysd.Assets._bal().hasOwnProperty('GULD'))
      assert(bals.isysd.Assets._bal().GULD.greaterThanOrEqualTo(new Amount(0, 'GULD')))
      assert(bals.isysd.Assets._bal().GG.greaterThanOrEqualTo(new Amount(0, 'GG')))
    }).catch(done)
  })
  it('ledger balance user', function (done) {
    var ledger = this.blocktree.getLedger()
    ledger.balance('isysd').then(bals => {
      assert(bals.hasOwnProperty('isysd'))
      assert(bals.isysd.hasOwnProperty('Assets'))
      assert(bals.isysd.Assets._bal().hasOwnProperty('GULD'))
      assert(bals.isysd.Assets._bal().GULD.greaterThanOrEqualTo(new Amount(0, 'GULD')))
      assert(bals.isysd.Assets._bal().GG.greaterThanOrEqualTo(new Amount(0, 'GG')))
      assert(!bals.hasOwnProperty('cz'))
      done()
    }).catch(done)
  })
  it('mapNamesToFPR single', function (done) {
    var p = this.blocktree.mapNamesToFPR('C7EA0E59D0660BF6848614B6441BDDD420F44729')
    p.then(n => {
      assert(n.hasOwnProperty('C7EA0E59D0660BF6848614B6441BDDD420F44729'))
      assert(n['C7EA0E59D0660BF6848614B6441BDDD420F44729'] === 'isysd')
      done()
    }).catch(done)
  })
  it('mapNamesToFPR multiple', function (done) {
    var p = this.blocktree.mapNamesToFPR([
      'C7EA0E59D0660BF6848614B6441BDDD420F44729',
      '756C6467EF8683A1B8E5C9551EB8402A1A1B35B6'
    ])
    p.then(n => {
      assert(n.hasOwnProperty('756C6467EF8683A1B8E5C9551EB8402A1A1B35B6'))
      assert(n['756C6467EF8683A1B8E5C9551EB8402A1A1B35B6'] === 'cz')
      assert(n.hasOwnProperty('C7EA0E59D0660BF6848614B6441BDDD420F44729'))
      assert(n['C7EA0E59D0660BF6848614B6441BDDD420F44729'] === 'isysd')
      done()
    }).catch(done)
  })
})
