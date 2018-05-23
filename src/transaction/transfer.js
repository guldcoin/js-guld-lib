const Transaction = require('./transaction.js')

class Transfer extends Transaction {
  static create (sender, receipient, amount, commodity, time) {
    time = time || Math.trunc(Date.now() / 1000)
    var date = new Date(time * 1000)
    var datestr = `${date.toISOString().split('T')[0].replace(/-/g, '/')}`
    return new Transfer(`${datestr} * transfer
    ; timestamp: ${time}
    ${sender}:Assets   -${amount} ${commodity}
    ${sender}:Expenses   ${amount} ${commodity}
    ${receipient}:Assets   ${amount} ${commodity}
    ${receipient}:Income   -${amount} ${commodity}
`)
  }
}

module.exports = Transfer
