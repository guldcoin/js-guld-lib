/* global Amount:false fs:false */
/* eslint-env node, mocha */

const assert = require('assert')
global.fs = require('fs')
global.Decimal = require('decimal.js')
global.util = require('util')
var ltypes = require('ledger-types')
global.Amount = ltypes.Amount
global.Balance = ltypes.Balance
global.Account = ltypes.Account
global.git = require('isomorphic-git')
const guldlib = require('./guld-lib.js')
const Blocktree = guldlib.Blocktree
const BrowserFS = require('browserfs')

function getBrowserFS (config) {
  config = config || {fs: 'InMemory'}
  return new Promise((resolve, reject) => {
    BrowserFS.configure(config, err => {
      if (err) reject(err)
      resolve(BrowserFS.BFSRequire('fs'))
    })
  })
}

var cfs = fs

describe('Blocktree', () => {
  before(done => {
    //    var altconfig = {
    //      fs: 'FolderAdapter',
    //      options: {
    //        folder: "tmp",
    //        wrapped: fs
    //      }
    //    }
    getBrowserFS().then(tfs => {
      cfs = tfs
      done()
    })
  })
  it('construct', function () {
    this.blocktree = new Blocktree(cfs, 'guld')
    assert.equal(true, true)
  })
  it('initFS', function (done) {
    this.timeout(150000)
    this.blocktree.initFS().then(() => {
      var plist = cfs.readdirSync(`/BLOCKTREE/guld/ledger/prices`)
      assert(plist.length > 0)
      assert(plist.indexOf('gg.db') >= 0)
      var glist = cfs.readdirSync(`/BLOCKTREE/guld/ledger/GULD`)
      assert(glist.length > 0)
      assert(glist.indexOf('isysd') >= 0)
      var klist = cfs.readdirSync(`/BLOCKTREE/guld/keys/pgp`)
      assert(klist.length > 0)
      assert(klist.indexOf('isysd') >= 0)
      done()
    })
  })
  it('initFS again', function (done) {
    this.timeout(15000)
    this.blocktree.initFS().then(() => {
      var plist = cfs.readdirSync(`/BLOCKTREE/guld/ledger/prices`)
      assert(plist.length > 0)
      assert(plist.indexOf('gg.db') >= 0)
      var glist = cfs.readdirSync(`/BLOCKTREE/guld/ledger/GULD`)
      assert(glist.length > 0)
      assert(glist.indexOf('isysd') >= 0)
      var klist = cfs.readdirSync(`/BLOCKTREE/guld/keys/pgp`)
      assert(klist.length > 0)
      assert(klist.indexOf('isysd') >= 0)
      done()
    }).catch(done)
  })
  it('getPrice USD', function (done) {
    var t = this;
    (async function () {
      var p = await t.blocktree.getPrice('USD', '$')
      var expAmount = new Amount(1, '$')
      assert(p.equals(expAmount))
      done()
    })()
  })
  it('getPrice usd', function (done) {
    var t = this;
    (async function () {
      var p = await t.blocktree.getPrice('usd', '$')
      var expAmount = new Amount(1, '$')
      assert(p.equals(expAmount))
      done()
    })()
  })
  it('getPrice XXX', function (done) {
    var t = this
    t.blocktree.getPrice('XXX', '$')
      .then((price) => {
        assert(price === 'error should have been thrown')
      })
      .catch(() => {
        done()
      })
  })
  it('getPrice GULD', function (done) {
    var t = this;
    (async function () {
      var p = await t.blocktree.getPrice('guld', '$')
      var expAmount = new Amount(75, '$')
      assert(p.equals(expAmount))
      done()
    })()
  })
  it('getPrice GG in GULD', function (done) {
    this.blocktree.getPrice('GG', 'GULD').then(p => {
      var expAmount = new Amount(0.002, 'GULD')
      assert(p.equals(expAmount))
      done()
    }).catch(done)
  })
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
})
