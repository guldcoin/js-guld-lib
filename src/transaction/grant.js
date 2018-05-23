const Transaction = require('./transaction.js')

class Grant extends Transaction {
  static create (contributor, amount, commodity, time) {
    time = time || Math.trunc(Date.now() / 1000)
    var date = new Date(time * 1000)
    var datestr = `${date.toISOString().split('T')[0].replace(/-/g, '/')}`
    return new Grant(`${datestr} * grant
    ; timestamp: ${time}
    ${contributor}:Assets   ${amount} ${commodity}
    ${contributor}:Income   -${amount} ${commodity}
    guld:Liabilities   -${amount} ${commodity}
    guld:Equity:${contributor}   ${amount} ${commodity}
`)
  }
}

module.exports = Grant
