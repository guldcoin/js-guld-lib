/**
 * @module guld-lib
 * @license MIT
 * @author zimmi
 */

const { EventEmitter } = require('events')
const git = require('isomorphic-git')
const { Amount } = require('ledger-types')
const { Ledger } = require('ledger-cli-browser')
const pify = require('pify')

function mkdirps (p, tfs) {
  return new Promise((resolve, reject) => {
    try {
      resolve(tfs.mkdir(p))
    } catch (e) {
      reject(e)
    }
  })
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

class Blocktree extends EventEmitter {
  constructor (cfs, observer) {
    super()
    this.fs = cfs
    this.observer = observer || 'guld'
    this._ledger = undefined
    this.initialized = false
  }

  setLedger (re) {
    var self = this
    var included = ''

    function includeFile (path) {
      return new Promise((resolve, reject) => {
        self.fs.readFile(path, 'utf8', (err, data) => {
          if (err) reject(err)
          if (!re || re.test(data)) {
            included = `${included}\n${data}\n`
            resolve()
          } else resolve()
        })
      })
    }

    function checkLine (path, l) {
      var newpath = `${path}/${l}`
      if (l.startsWith('.')) return Promise.resolve()
      else if (l.endsWith('.dat') || l.endsWith('.db')) {
        return includeFile(newpath)
      } else {
        return new Promise((resolve, reject) => {
          self.fs.stat(newpath, (err, stats) => {
            if (err) return resolve()
            else if (stats.isDirectory()) {
              includeRecursive(newpath).then(resolve).catch(reject)
            } else resolve()
          })
        })
      }
    }

    function includeRecursive (path) {
      return new Promise((resolve, reject) => {
        self.fs.readdir(path, (err, list) => {
          if (err) return reject(err)
          Promise.all(list.map(l => {
            return checkLine(path, l)
          })).then(resolve).catch(reject)
        })
      })
    }

    return includeRecursive(`/BLOCKTREE/${self.observer}/ledger`)
      .then(() => {
        var cfg = {'file': '-', 'raw': included}
        if (re) {
          cfg['query'] = re
        } if (typeof chrome !== 'undefined') {
          cfg['binary'] = 'chrome'
        }
        self._ledger = new Ledger(cfg)
        return self._ledger
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
    return pify(self.fs.readdir)(`/BLOCKTREE/${self.observer}/keys/pgp`).then(keys => {
      keys = keys.filter((line) => {
        return line.indexOf('/') >= 0
      }).forEach(pushName)
      return pify(self.fs.readdir)(`/BLOCKTREE/${self.observer}/ledger/GULD`).then(ledgers => {
        ledgers.forEach(pushName)
        return namelist
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
    try {
      var valid = this.nameIsValid(gname)
    } catch (e) {
      return Promise.reject(e)
    }
    if (!this.initialized || !valid) {
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
      function pull () {
        return git.pull({
          fs: self.fs,
          dir: p,
          gitdir: `${p}/.git`,
          fastForwardOnly: true,
          singleBranch: true
        })
      }
      return new Promise((resolve, reject) => {
        var ghurl = `https://github.com/${ghseed}/${rname}.git`
        self.fs.stat(p, (err, stats) => {
          if (err || !(stats.isDirectory())) {
            git.clone({
              fs: self.fs,
              dir: p,
              gitdir: `${p}/.git`,
              url: ghurl,
              singleBranch: true,
              depth: 1
            }).then(resolve).catch(reject)
          } else {
            git.log({
              fs: self.fs,
              dir: p,
              gitdir: `${p}/.git`,
              depth: 1
            }).then(commit => {
              git.getRemoteInfo({'url': ghurl}).then(info => {
                if (commit[0].oid !== info.refs.heads.master) {
                  pull().then(resolve).catch(reject)
                } else resolve()
              }).catch(reject)
            }).catch(() => {
              pull().then(resolve).catch(reject)
            })
          }
        })
      })
    }

    return new Promise((resolve, reject) => {
      mkdirps('/BLOCKTREE', self.fs).then(() => {
        return mkdirps(`/BLOCKTREE/${seed}`, self.fs)
      }).then(() => {
        return mkdirps(`/BLOCKTREE/${seed}/ledger`, self.fs)
      }).then(() => {
        return mkdirps(`/BLOCKTREE/${seed}/keys`, self.fs)
      }).then(() => {
        // console.log('made pre-dirs')
        clonep(`/BLOCKTREE/${seed}/ledger/prices`, 'token-prices').then(() => {
          // console.log('cloned token-prices')
          clonep(`/BLOCKTREE/${seed}/keys/pgp`, 'keys-pgp').then(() => {
            // console.log('cloned keys-pgp')
            clonep(`/BLOCKTREE/${seed}/ledger/GULD`, 'ledger-guld').then(() => {
              // console.log('cloned ledger-guld')
              self.emit('initialized')
              self.initialized = true
              resolve()
            }).catch(reject)
          }).catch(reject)
        }).catch(reject)
      })
    })
  }

  mapNamesToFPR (fpr) {
    var self = this
    if (typeof fpr === 'string') fpr = [fpr]
    var kn = {}
    return new Promise((resolve, reject) => {
      function maybeResolve () {
        if (fpr.length === 0) {
          resolve(kn)
          return true
        } else return false
      }
      self.fs.readdir(`/BLOCKTREE/${self.observer}/keys/pgp/`, (error, names) => {
        if (error) reject(error)
        else {
          for (var i = 0; i < names.length; i++) {
            if (maybeResolve()) return
            var p = `/BLOCKTREE/${self.observer}/keys/pgp/${names[i]}`
            self.fs.readdir(p, (err, keys) => {
              if (fpr.length === 0) return maybeResolve()
              else if (!(err)) {
                keys.forEach(key => {
                  key = key.replace('.asc', '')
                  if (fpr.indexOf(key) >= 0) {
                    kn[key] = names[i]
                    fpr = fpr.filter(f => {
                      return f !== key
                    })
                    maybeResolve()
                  }
                })
                return reject(new Error('No names found.'))
              }
            })
          }
        }
      })
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
