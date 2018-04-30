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

describe('Blocktree', () => {
  it('construct', function () {
    this.blocktree = new Blocktree(fs, 'guld')
    assert.equal(true, true)
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
    var t = this;
    (async function () {
      try {
        await t.blocktree.getPrice('XXX', '$')
      } catch (err) {
        done()
      }
    })()
  })
  it('getPrice GULD', function (done) {
    var t = this;
    (async function () {
      var p = await t.blocktree.getPrice('guld')
      var expAmount = new Amount(75, 'USD')
      assert(p.equals(expAmount))
      done()
    })()
  })
  it('getPrice GG in GULD', function (done) {
    var t = this;
    (async function () {
      var p = await t.blocktree.getPrice('GG', 'GULD')
      var expAmount = new Amount(0.002, 'GULD')
      assert(p.equals(expAmount))
      done()
    })()
  })
  it('listNames', function (done) {
    var t = this;
    (async function () {
      var nlist = await t.blocktree.listNames()
      assert(nlist.length > 1000)
      done()
    })()
  })
  it('nameIsValid', function (done) {
    var t = this;
    (async function () {
      var valid = t.blocktree.nameIsValid('iamastupidnamenoonewouldtake-1')
      assert(valid)
      done()
    })()
  })
  it('nameIsValid uppercase', function (done) {
    var t = this;
    (async function () {
      try {
        t.blocktree.nameIsValid('ISYSD')
        done(new RangeError('expected RangeError'))
      } catch (err) {
        done()
      }
    })()
  })
  it('nameIsValid _', function (done) {
    var t = this;
    (async function () {
      try {
        t.blocktree.nameIsValid('isy_sd')
        done(new RangeError('expected RangeError'))
      } catch (err) {
        done()
      }
    })()
  })
  it('nameIsValid .', function (done) {
    var t = this;
    (async function () {
      try {
        t.blocktree.nameIsValid('isy.sd')
        done(new RangeError('expected RangeError'))
      } catch (err) {
        done()
      }
    })()
  })
  it('nameIsValid :', function (done) {
    var t = this;
    (async function () {
      try {
        t.blocktree.nameIsValid('isy:sd')
        done(new RangeError('expected RangeError'))
      } catch (err) {
        done()
      }
    })()
  })

  it('isNameAvail', function (done) {
    var t = this;
    (async function () {
      var avail = await t.blocktree.isNameAvail('iamastupidnamenoonewouldtake-1')
      assert(avail)
      done()
    })()
  })
  it('isNameAvail not', function (done) {
    var t = this;
    (async function () {
      var avail = await t.blocktree.isNameAvail('isysd')
      assert(avail === false)
      done()
    })()
  })
})
