/* eslint-env node, mocha */
const assert = require('chai').assert
const {Amount} = require('ledger-types')
const Commodity = require('../src/commodity/commodity.js')
const flexfs = require('../../flexfs/flexfs.js')
const {zipdata} = require('./util.js')

describe('Commodity', () => {
  before(async () => {
    await flexfs({
      fs: 'MountableFileSystem',
      options: {
        '/': {
          fs: 'InMemory'
        },
        '/BLOCKTREE': {
          fs: 'InMemory'
        },
        '/BLOCKTREE/guld': {
          fs: 'ZipFS',
          options: {
            'zipData': zipdata,
            filename: '/BLOCKTREE/guld'
          }
        }
      }
    })
  })
  describe('static', () => {
    it('list', function () {
      assert.isAbove(Object.keys(Commodity.list()).length, 2)
      assert.exists(Commodity.list().GULD)
      assert.exists(Commodity.list().GG)
      assert.exists(Commodity.list().BTC)
    })
    it('getHostUrl', async () => {
      var url = await Commodity.getHostUrl('GULD')
      assert.equal(url, 'https://github.com/guldcoin/ledger-guld.git')
      var url = await Commodity.getHostUrl('GG')
      assert.equal(url, 'https://github.com/guld-games/ledger-gg.git')
      var url = await Commodity.getHostUrl('BTC')
      assert.equal(url, 'https://github.com/zimmiglobal/ledger-btc.git')
    })
    it('getPrice USD', async () => {
      var p = await Commodity.getPrice('USD', '$')
      var expAmount = new Amount(1, '$')
      assert(p.equals(expAmount))
    })
    it('getPrice usd', async () => {
      var p = await Commodity.getPrice('usd', '$')
      var expAmount = new Amount(1, '$')
      assert(p.equals(expAmount))
    })
    it('getPrice XXX', async () => {
      try {
        await Commodity.getPrice('XXX', '$')
        assert.fail('error should have been thrown')
      } catch (e) {
        assert(e instanceof Error)
      }
    })
    it('getPrice GULD', async () => {
      var p = await Commodity.getPrice('guld', '$')
      var expAmount = new Amount(75, '$')
      assert(p.equals(expAmount))
    })
    it('getPrice GG in GULD', async () => {
      var p = await Commodity.getPrice('GG', 'GULD')
      var minAmount = new Amount(0.00014085, 'GULD')
      var maxAmount = new Amount(1, 'GULD')
      assert(p.greaterThan(minAmount))
      assert(p.lessThan(maxAmount))
    })
  })
  describe('instance', () => {
    before(() => {
      this.GULD = new Commodity('GULD')
      this.GG = new Commodity('GG')
      this.BTC = new Commodity('BTC')
    })
    it('getHostUrl', async () => {
      var url = await this.GULD.hostUrl
      assert.equal(url, 'https://github.com/guldcoin/ledger-guld.git')
      var url = await this.GG.hostUrl
      assert.equal(url, 'https://github.com/guld-games/ledger-gg.git')
      var url = await this.BTC.hostUrl
      assert.equal(url, 'https://github.com/zimmiglobal/ledger-btc.git')
    })
    it('getPrice GULD', async () => {
      var p = await this.GULD.getPrice('$')
      var expAmount = new Amount(75, '$')
      assert(p.equals(expAmount))
    })
    it('getPrice GG in GULD', async () => {
      var p = await this.GG.getPrice('GULD')
      var minAmount = new Amount(0.00014085, 'GULD')
      var maxAmount = new Amount(1, 'GULD')
      assert(p.greaterThan(minAmount))
      assert(p.lessThan(maxAmount))
    })
  })
})
