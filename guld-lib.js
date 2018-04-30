/**
 * @module js-guld-lib
 * @license MIT
 * @author zimmi
 */

/* global fs:false Amount:false git:false */

class Blocktree {
  constructor (cfs, observer) {
    this.fs = cfs || fs
    this.observer = observer || 'guld'
  }

  getPrice (commodity, base) {
    var pricefl
    var pricea
    var amtstr
    var re
    commodity = commodity || 'GULD'
    base = base || 'USD'
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
          pricef = pricef.split('\n').reverse()
          pricefl = pricef.filter(filterPricesByTime)
          re = new RegExp(`${commodity.toUpperCase()} .*[0-9.].*`, 'm')
          pricea = re.exec(pricefl.join('\n'))
          if (pricea && pricea.length > 0 && pricea[0].length > 0) {
            amtstr = pricea[0].replace(commodity.toUpperCase(), '').trim()
            return resolve(new Amount(amtstr.replace(base, '').trim(), base))
          }
          return reject(new RangeError(`Price not found for commodity ${commodity}`))
        })
    })
  }

  listNames () {
    var namelist = []
    var gname
    let pushName = line => {
      gname = line.split('/')[0]
      if (namelist.indexOf(gname) === -1) namelist.push(gname)
    }
    let repo = {
      fs: this.fs,
      dir: `/BLOCKTREE/${this.observer}/ledger/GULD`
    }
    return git.listFiles(repo).then((keys) => {
      keys = keys.filter((line) => {
        return line.indexOf('/') >= 0
      }).forEach(pushName)
      return git.listFiles(repo).then((ledgers) => {
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
    if (!this.nameIsValid(gname)) {
      return Promise.resolve(false)
    } else {
      return this.listNames().then(namelist => {
        return (namelist.indexOf(gname) < 0)
      })
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    Blocktree: Blocktree
  }
} // Otherwise assume we're in a browser environment
