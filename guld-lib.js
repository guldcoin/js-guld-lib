/**
 * @module js-guld-lib
 * @license MIT
 * @author zimmi
 */

/* global Amount:false git:false */

function mkdirps (p, tfs) {
  try {
    tfs.mkdirSync(p)
    return
  } catch (e) {
    return e
  }
}

class Blocktree {
  constructor (cfs, observer) {
    this.fs = cfs
    this.observer = observer || 'guld'
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
        `/BLOCKTREE/${this.observer}/ledger/prices/${commodity.toLowerCase()}.db`,
        'utf-8', (err, pricef) => {
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
}

if (typeof module !== 'undefined') {
  module.exports = {
    Blocktree: Blocktree
  }
} // Otherwise assume we're in a browser environment
