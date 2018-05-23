const global = require('window-or-global')
const {Amount} = require('ledger-types')
let list = {}
new Array('BTC', 'GULD', 'GG').forEach(c => {
  list[c] = require(`./${c}.json`)
})

class Commodity {
  constructor (code) {
    this.code = code
  }

  static list () {
    return list
  }

  static getHostUrl (code) {
    return `https://github.com/${list[code].mirrors.github}/ledger-${code.toLowerCase()}.git`
  }

  get hostUrl () {
    return Commodity.getHostUrl(this.code)
  }

  static async getPrice (commodity, base, oname) {
    if (typeof commodity === 'undefined') commodity = 'GULD'
    if (typeof base === 'undefined') base = 'USD'
    if (!oname) {
      if (global.observer && global.observer.name) oname = global.observer.name
      else oname = 'guld'
    }
    var pricefl
    var pricea
    var amtstr
    var re
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
    var pricef = await global.fs.readFile(`/BLOCKTREE/${oname}/ledger/prices/${commodity.toLowerCase()}.db`, 'utf-8')
    pricef = pricef.split('\n').reverse()
    pricefl = pricef.filter(filterPricesByTime)
    var res = `${commodity.toUpperCase()}[ ]{0,1}.*[0-9.].*`.replace('$', '')
    re = new RegExp(res, 'm')
    pricea = re.exec(pricefl.join('\n'))
    if (pricea && pricea.length > 0 && pricea[0].length > 0) {
      amtstr = pricea[0].replace(commodity.toUpperCase(), '').trim()
      var amt = amtstr.replace(base, '').trim()
      return new Amount(amt, base)
    } else throw new RangeError(`Price not found for commodity ${commodity}`)
  }

  async getPrice (base) {
    return Commodity.getPrice(this.code, base)
  }

  static async clone (code) {
    return global.git.clone(
      `ledger/${code}`,
      this.hostUrl
    )
  }

  static async cloneAll () {
    return Promise.all(Object.keys(list).map(this.clone))
  }
}

module.exports = Commodity
