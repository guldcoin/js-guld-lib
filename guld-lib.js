/**
 * @module js-guld-lib
 * @license MIT
 * @author zimmi
 */

/* global fs:false Amount:false git:false */

class Blocktree {
  constructor (fs, observer) {
    this.observer = observer || 'guld'
  }

  getPrice (commodity, base) {
    commodity = commodity || 'GULD'
    base = base || 'USD'
    commodity = commodity.toUpperCase()
    base = base.toUpperCase()
    return new Promise((resolve, reject) => {
      fs.readFile(
        `/BLOCKTREE/${this.observer}/ledger/prices/${commodity.toLowerCase()}.db`,
        'utf-8', (err, pricef) => {
          if (err) return reject(err)
          pricef = pricef.split('\n').reverse()
          var pricefl = pricef.filter((line) => {
            if (!line.startsWith('P ')) return false
            else {
              var pdate = line.substring(2, 12)
              var apdate = pdate.split('/')
              pdate = `${apdate[1]}/${apdate[2]}/${
                apdate[0]}`
              var now = Date.now()
              var ptime = new Date(pdate).getTime()
              if (now >= ptime) {
                return true
              } else return false
            }
          })
          var re = new RegExp(`${commodity.toUpperCase()} .*[0-9.].*`, 'm')
          var pricea = re.exec(pricefl.join('\n'))
          if (pricea && pricea.length > 0 && pricea[0].length > 0) {
            var amtstr = pricea[0].replace(commodity.toUpperCase(), '').trim(
              ' ')
            return resolve(new Amount(amtstr.replace(base, '').trim(), base))
          }
          return reject(new Error(`Price not found for commodity ${
            commodity}`))
        })
    })
  }

  listNames () {
    var namelist = []
    return git.listFiles({
      fs,
      dir: `/BLOCKTREE/${this.observer}/keys/pgp`
    }).then((keys) => {
      keys = keys.filter((line) => {
        return line.indexOf('/') >= 0
      }).forEach((line) => {
        var gname = line.split('/')[0]
        if (namelist.indexOf(gname) === -1) namelist.push(gname)
      })
      return git.listFiles({
        fs,
        dir: `/BLOCKTREE/${this.observer}/ledger/GULD`
      }).then((ledgers) => {
        ledgers.forEach((line) => {
          var gname = line.split('/')[0]
          if (namelist.indexOf(gname) === -1) namelist.push(gname)
        })
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
