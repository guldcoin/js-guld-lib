const Transaction = require('./transaction.js')

class Register extends Transaction {
  static create (rname, rtype, qty, commodity, payee, time) {
    var amount = qty * 0.1
    if (payee) {
      payee = `:${payee}`
    } else payee = ''
    time = time || Math.trunc(Date.now() / 1000)
    var date = new Date(time * 1000)
    var datestr = `${date.toISOString().split('T')[0].replace(/-/g, '/')}`
    return new Register(`${datestr} * register ${rtype}
    ; timestamp: ${time}
    ${rname}:Assets   -${amount} ${commodity}
    ${rname}:Expenses   ${amount} ${commodity}
    guld:Liabilities   ${amount} ${commodity}
    guld:Income:register:${rtype}:${rname}${payee}   -${amount} ${commodity}
`)
  }
}

module.exports = Register
