/* eslint-env node, mocha */

const assert = require('assert')
const os = require('os')
const path = require('path')
const git = require('isomorphic-git')
const {Amount} = require('ledger-types')
const {Blocktree, Transaction, Transfer, Grant, Register} = require('./guld-lib.js')
const BrowserFS = require('browserfs')
var fs = require('fs')

describe('Session', () => {
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
