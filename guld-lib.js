/**
 * @module js-guld-lib
 * @license MIT
 * @author zimmi
 */

/* global Amount:false git:false Ledger:false */

function mkdirps (p, tfs) {
  try {
    tfs.mkdirSync(p)
    return
  } catch (e) {
    return e
  }
}

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

class Blocktree {
  constructor (cfs, observer) {
    this.fs = cfs
    this.observer = observer || 'guld'
    this._ledger = undefined
  }

  setLedger () {
    var self = this
    var included = ''
    function mapCommodities (c) {
      if (c === 'prices') return Promise.resolve()
      return new Promise((resolve, reject) => {
        self.fs.readdir(`/BLOCKTREE/${self.observer}/ledger/${c}`,
          (err, users) => {
            if (err) return reject(err)
            users = users.filter(u => {
              if (u.startsWith('.')) return false
              else if (u.endsWith('.dat')) {
                included = `${included}\ninclude /BLOCKTREE/${self.observer}/ledger/${c}/${u}`
                return false
              } else {
                return true
              }
            })
            var promises = users.map(u => {
              return mapUsers(c, u)
            })
            Promise.all(promises).then(resolve).catch(reject)
          })
      })
    }
    function mapUsers (c, u) {
      return new Promise((resolve, reject) => {
        self.fs.readdir(`/BLOCKTREE/${self.observer}/ledger/${c}/${u}`,
          (err, files) => {
            if (err) return reject(err)
            files.forEach(f => {
              if (f.endsWith('.dat')) {
                included = `${included}\ninclude /BLOCKTREE/${self.observer}/ledger/${c}/${u}/${f}`
              }
            })
            resolve()
          })
      })
    }
    return new Promise((resolve, reject) => {
      self.fs.readdir(`/BLOCKTREE/${self.observer}/ledger/prices/`,
        (err, prices) => {
          if (err) return reject(err)
          prices.forEach(price => {
            if (price.endsWith('.db')) {
              included = `${included}\ninclude /BLOCKTREE/${self.observer}/ledger/prices/${price}`
            }
          })
          self.fs.readdir(`/BLOCKTREE/${self.observer}/ledger/`,
            (err, commodities) => {
              if (err) return reject(err)
              var promises = commodities.map(mapCommodities)
              Promise.all(promises).then(() => {
                self._ledger = new Ledger({'file': '-', 'raw': included, 'debug': true})
                resolve()
              }).catch(reject)
            })
        })
    })
  }

  getLedger () {
    return this._ledger
  }

  getPrice (commodity, base) {
    var pricefl
    var pricea
    var amtstr
    var re
    if (typeof commodity === 'undefined') commodity = 'GULD'
    if (typeof base === 'undefined') base = 'USD'
    commodity = commodity.toUpperCase()
    base = base.toUpperCase()
    let filterPricesByTime = line => {
      if (!line.startsWith('P ')) return false
      else {
        var pdate = line.substring(2, 12)
        var apdate = pdate.split('/')
        pdate = `${apdate[1]}/${apdate[2]}/${apdate[0]}`
        var now = Date.now()
        var ptime = new Date(pdate).getTime()
        if (now >= ptime) {
          return true
        } else return false
      }
    }
    return new Promise((resolve, reject) => {
      this.fs.readFile(
        `/BLOCKTREE/${this.observer}/ledger/prices/${commodity.toLowerCase()}.db`, 'utf-8', (err, pricef) => {
          if (err) return reject(err)
          else {
            pricef = pricef.split('\n').reverse()
            pricefl = pricef.filter(filterPricesByTime)
            var res = `${commodity.toUpperCase()}[ ]{0,1}.*[0-9.].*`.replace('$', '')
            re = new RegExp(res, 'm')
            pricea = re.exec(pricefl.join('\n'))
            if (pricea && pricea.length > 0 && pricea[0].length > 0) {
              amtstr = pricea[0].replace(commodity.toUpperCase(), '').trim()
              var amt = amtstr.replace(base, '').trim()
              return resolve(new Amount(amt, base))
            } else return reject(new RangeError(`Price not found for commodity ${commodity}`))
          }
        })
    })
  }

  listNames () {
    var namelist = []
    var gname
    var self = this
    let pushName = line => {
      gname = line.split('/')[0]
      if (namelist.indexOf(gname) === -1) namelist.push(gname)
    }
    return new Promise((resolve, reject) => {
      self.fs.readdir(`/BLOCKTREE/${self.observer}/keys/pgp`, (err, keys) => {
        if (err) return reject(err)
        keys = keys.filter((line) => {
          return line.indexOf('/') >= 0
        }).forEach(pushName)
        self.fs.readdir(`/BLOCKTREE/${self.observer}/ledger/GULD`, (err, ledgers) => {
          if (err) return reject(err)
          ledgers.forEach(pushName)
          return resolve(namelist)
        })
      })
    })
  }

  nameIsValid (gname) {
    var re = /^[a-z0-9-]{4,40}$/
    var result = re.exec(gname)
    if (!result || result[0].length === 0) {
      throw new RangeError(`name ${gname} is not valid. Can only be lowercase letters, numbers and dashes (-)`)
    } else return true
  }

  isNameAvail (gname) {
    if (!this.nameIsValid(gname)) {
      return Promise.resolve(false)
    } else {
      return this.listNames().then(namelist => {
        return (namelist.indexOf(gname) < 0)
      })
    }
  }

  initFS (seed, ghseed) {
    var self = this
    seed = seed || 'guld'
    ghseed = ghseed || 'guldcoin'

    function clonep (p, rname) {
      return new Promise((resolve, reject) => {
        self.fs.stat(p, (err, stats) => {
          if (err || !(stats.isDirectory())) {
            git.clone({
              fs: self.fs,
              dir: p,
              url: `https://github.com/${ghseed}/${rname}.git`,
              singleBranch: true,
              depth: 1
            }).then(resolve).catch(reject)
          } else {
            git.pull({
              fs: self.fs,
              dir: p,
              gitdir: `${p}/.git`,
              fastForwardOnly: true,
              singleBranch: true
            }).then(resolve).catch(reject)
          }
        })
      })
    }

    return new Promise((resolve, reject) => {
      mkdirps('/BLOCKTREE', self.fs)
      mkdirps(`/BLOCKTREE/${seed}`, self.fs)
      mkdirps(`/BLOCKTREE/${seed}/ledger`, self.fs)
      mkdirps(`/BLOCKTREE/${seed}/keys`, self.fs)
      clonep(`/BLOCKTREE/${seed}/ledger/GULD`, 'ledger-guld').then(() => {
        clonep(`/BLOCKTREE/${seed}/ledger/prices`, 'token-prices').then(() => {
          clonep(`/BLOCKTREE/${seed}/keys/pgp`, 'keys-pgp').then(resolve).catch(reject)
        }).catch(reject)
      }).catch(reject)
    })
  }

  ledgerBalance () {

  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    Blocktree: Blocktree,
    Transaction: Transaction,
    Transfer: Transfer,
    Grant: Grant,
    Register: Register
  }
} // Otherwise assume we're in a browser environment
