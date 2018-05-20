/* eslint-env node, mocha */

const assert = require('assert')
const os = require('os')
const path = require('path')
const git = require('isomorphic-git')
const {Amount} = require('ledger-types')
const {Blocktree, Transaction, Transfer, Grant, Register} = require('./guld-lib.js')
const BrowserFS = require('browserfs')
var fs = require('fs')

function getBrowserFS (config) {
  return new Promise((resolve, reject) => {
    fs.mkdtemp(path.join(os.tmpdir(), 'guld-lib-test'), (e, p) => {
      config = config || {
        fs: 'InMemory'// ,
        // options: {
        //   folder: p,
        //   wrapped: fs
        // }
      }
      BrowserFS.configure(config, err => {
        if (err) reject(err)
        resolve(BrowserFS.BFSRequire('fs'))
      })
    })
  })
}

const GRANT = `2016/01/01 * grant
    ; timestamp: 1451612082
    isysd:Assets   1.9 GULD
    isysd:Income   -1.9 GULD
    guld:Liabilities   -1.9 GULD
    guld:Equity:isysd   1.9 GULD
`

const TRANSFER_GULD = `2016/01/01 * transfer
    ; timestamp: 1451612083
    isysd:Assets   -1.9 GULD
    isysd:Expenses   1.9 GULD
    cz:Assets   1.9 GULD
    cz:Income   -1.9 GULD
`

const REGISTER_INDIVIDUAL = `2016/01/01 * register individual
    ; timestamp: 1451612084
    isysd:Assets   -0.1 GULD
    isysd:Expenses   0.1 GULD
    guld:Liabilities   0.1 GULD
    guld:Income:register:individual:isysd   -0.1 GULD
`

const REGISTER_GROUP = `2016/01/01 * register group
    ; timestamp: 1451612085
    isysd:Assets   -0.1 GULD
    isysd:Expenses   0.1 GULD
    guld:Liabilities   0.1 GULD
    guld:Income:register:individual:gg   -0.1 GULD
`

const REGISTER_GROUP_PAYEE = `2016/01/01 * register group
    ; timestamp: 1451612086
    isysd:Assets   -0.1 GULD
    isysd:Expenses   0.1 GULD
    guld:Liabilities   0.1 GULD
    guld:Income:register:individual:gg:isysd   -0.1 GULD
`

describe('Transaction', () => {
  it('getType', function () {
    var gtype = Transaction.getType(GRANT)
    assert(gtype === 'grant')
    gtype = Transaction.getType(TRANSFER_GULD)
    assert(gtype === 'transfer')
    gtype = Transaction.getType(REGISTER_INDIVIDUAL)
    assert(gtype === 'register individual')
    gtype = Transaction.getType(REGISTER_GROUP)
    assert(gtype === 'register group')
    gtype = Transaction.getType(REGISTER_GROUP_PAYEE)
    assert(gtype === 'register group')
  })
  it('getType new', function () {
    var type = Transaction.getType(GRANT.replace('grant', 'theft'))
    assert(type === 'theft')
  })
  it('getType incomplete', function () {
    try {
      Transaction.getType(GRANT.replace('*', ''))
      assert(true === false)
    } catch (e) {
      assert(e instanceof TypeError)
    }
  })
  it('getTimestamp', function () {
    var gtime = Transaction.getTimestamp(GRANT)
    assert(gtime === '1451612082')
    gtime = Transaction.getTimestamp(TRANSFER_GULD)
    assert(gtime === '1451612083')
    gtime = Transaction.getTimestamp(REGISTER_INDIVIDUAL)
    assert(gtime === '1451612084')
    gtime = Transaction.getTimestamp(REGISTER_GROUP)
    assert(gtime === '1451612085')
    gtime = Transaction.getTimestamp(REGISTER_GROUP_PAYEE)
    assert(gtime === '1451612086')
  })
  it('getAmount', function () {
    var gamount = Transaction.getAmount(GRANT)
    assert(gamount === '1.9')
    gamount = Transaction.getAmount(TRANSFER_GULD)
    assert(gamount === '1.9')
    gamount = Transaction.getAmount(REGISTER_INDIVIDUAL)
    assert(gamount === '0.1')
    gamount = Transaction.getAmount(REGISTER_GROUP)
    assert(gamount === '0.1')
    gamount = Transaction.getAmount(REGISTER_GROUP_PAYEE)
    assert(gamount === '0.1')
  })
  it('constructor', function () {
    var trans = new Transaction(TRANSFER_GULD)
    assert(trans instanceof Transaction)
    assert(trans.raw === TRANSFER_GULD)
  })
  describe('Transfer', () => {
    it('constructor', function () {
      var trans = new Transfer(TRANSFER_GULD)
      assert(trans instanceof Transfer)
      assert(trans instanceof Transaction)
      assert(trans.raw === TRANSFER_GULD)
    })
    it('create', function () {
      var trans = Transfer.create('isysd', 'cz', 1.9, 'GULD', 1451612083)
      assert(trans instanceof Transfer)
      assert(trans instanceof Transaction)
      assert(trans.raw === TRANSFER_GULD)
    })
    it('create no time', function () {
      var now = Math.trunc(Date.now() / 1000)
      var trans = Transfer.create('isysd', 'cz', 1.9, 'GULD')
      assert(trans instanceof Transfer)
      assert(trans instanceof Transaction)
      var time = Transfer.getTimestamp(trans.raw)
      assert([now.toString(), (now + 1).toString()].indexOf(time) >= 0)
    })
  })
  describe('Grant', () => {
    it('constructor', function () {
      var trans = new Grant(GRANT)
      assert(trans instanceof Grant)
      assert(trans instanceof Transaction)
      assert(trans.raw === GRANT)
    })
    it('create', function () {
      var trans = Grant.create('isysd', 1.9, 'GULD', 1451612082)
      assert(trans instanceof Grant)
      assert(trans instanceof Transaction)
      assert(trans.raw === GRANT)
    })
    it('create no time', function () {
      var now = Math.trunc(Date.now() / 1000)
      var trans = Grant.create('isysd', 1.9, 'GULD')
      assert(trans instanceof Grant)
      assert(trans instanceof Transaction)
      var time = Grant.getTimestamp(trans.raw)
      assert([now.toString(), (now + 1).toString()].indexOf(time) >= 0)
    })
  })
  describe('Register', () => {
    it('constructor', function () {
      var trans = new Register(REGISTER_INDIVIDUAL)
      assert(trans instanceof Register)
      assert(trans instanceof Transaction)
      assert(trans.raw === REGISTER_INDIVIDUAL)
    })
    it('create', function () {
      var trans = Register.create('isysd', 'individual', 1, 'GULD', undefined, 1451612084)
      assert(trans instanceof Register)
      assert(trans instanceof Transaction)
      assert(trans.raw === REGISTER_INDIVIDUAL)
    })
    it('create no time', function () {
      var now = Math.trunc(Date.now() / 1000)
      var trans = Register.create('isysd', 1.9, 'GULD')
      assert(trans instanceof Register)
      assert(trans instanceof Transaction)
      var time = Register.getTimestamp(trans.raw)
      assert([now.toString(), (now + 1).toString()].indexOf(time) >= 0)
    })
  })
})

describe('Blocktree', () => {
  before(done => {
    getBrowserFS().then(tfs => {
      fs = tfs
      done()
    })
  })
  it('construct', function () {
    this.blocktree = new Blocktree(fs, 'guld')
    assert.equal(true, true)
  })
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
      var minAmount = new Amount(0.00014085, 'GULD')
      var maxAmount = new Amount(1, 'GULD')
      assert(p.greaterThan(minAmount))
      assert(p.lessThan(maxAmount))
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
