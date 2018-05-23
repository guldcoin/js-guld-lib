/* eslint-env node, mocha */
const assert = require('chai').assert
const Transaction = require('../src/transaction/transaction.js')
const Transfer = require('../src/transaction/transfer.js')
const Grant = require('../src/transaction/grant.js')
const Register = require('../src/transaction/register.js')

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
