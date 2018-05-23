/* eslint-env node, mocha */

const assert = require('assert')
const os = require('os')
const path = require('path')
const git = require('isomorphic-git')
const {Amount} = require('ledger-types')
const {Blocktree, Transaction, Transfer, Grant, Register} = require('./guld-lib.js')
const BrowserFS = require('browserfs')
var fs = require('fs')


describe('Blocktree', () => {
  it('initFS', function (done) {
    this.timeout(150000)
    var p = `/BLOCKTREE/guld/ledger/GG`
    this.blocktree.initFS().then(() => {
      git.clone({
        fs: fs,
        dir: p,
        gitdir: `${p}/.git`,
        url: 'https://github.com/guld-games/ledger-gg.git',
        singleBranch: true,
        depth: 1
      }).then(() => {
        var plist = fs.readdirSync(`/BLOCKTREE/guld/ledger/prices`)
        assert(plist.length > 0)
        assert(plist.indexOf('gg.db') >= 0)
        var glist = fs.readdirSync(`/BLOCKTREE/guld/ledger/GULD`)
        assert(glist.length > 0)
        assert(glist.indexOf('isysd') >= 0)
        glist = fs.readdirSync(`/BLOCKTREE/guld/ledger/GG`)
        assert(glist.length > 0)
        assert(glist.indexOf('isysd') >= 0)
        var klist = fs.readdirSync(`/BLOCKTREE/guld/keys/pgp`)
        assert(klist.length > 0)
        assert(klist.indexOf('isysd') >= 0)
        done()
      }).catch(done)
    }).catch(done)
  })
  it('initFS again', function (done) {
    this.timeout(15000)
    this.blocktree.initFS().then(() => {
      var plist = fs.readdirSync(`/BLOCKTREE/guld/ledger/prices`)
      assert(plist.length > 0)
      assert(plist.indexOf('gg.db') >= 0)
      var glist = fs.readdirSync(`/BLOCKTREE/guld/ledger/GULD`)
      assert(glist.length > 0)
      assert(glist.indexOf('isysd') >= 0)
      var klist = fs.readdirSync(`/BLOCKTREE/guld/keys/pgp`)
      assert(klist.length > 0)
      assert(klist.indexOf('isysd') >= 0)
      done()
    }).catch(done)
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
})
