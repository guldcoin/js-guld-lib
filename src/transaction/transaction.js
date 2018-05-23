class Transaction {
  constructor (text) {
    this.raw = text
  }

  static getType (tx) {
    var re = /^[0-9]{4}\/[0-9]{2}\/[0-9]{2} \* [ a-zA-Z0-9]*$/m
    var txheader = re.exec(tx)
    if (txheader && txheader.length > 0 && txheader[0].length > 0) {
      return txheader[0].split('*')[1].trim()
    } else {
      throw new TypeError('expected a ledger transaction, but found unknown type')
    }
  }

  static getTimestamp (tx) {
    var re = /^ {4}; timestamp: [0-9]+$/m
    var txheader = re.exec(tx)
    if (txheader && txheader.length > 0 && txheader[0].length > 0) {
      return txheader[0].split(':')[1].trim()
    } else {
      throw new TypeError('expected a ledger transaction, but found unknown type')
    }
  }

  static getAmount (tx) {
    var re = /^ +[:a-zA-Z-]+ +[0-9a-zA-Z,. ]+$/m
    var txheader = re.exec(tx)
    if (txheader && txheader.length > 0 && txheader[0].length > 0) {
      var posting = txheader[0].replace(',', '')
      re = /[0-9.]+/
      txheader = re.exec(posting)
      if (txheader && txheader.length > 0 && txheader[0].length > 0) {
        return txheader[0]
      } else {
        throw new TypeError('expected a ledger transaction, but found unknown type')
      }
    } else {
      throw new TypeError('expected a ledger transaction, but found unknown type')
    }
  }
}

module.exports = Transaction
