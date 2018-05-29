const aggregation = require('aggregation/es6')
const o2c = require('object-to-class')
const GuldComponent = require('./component.js')
const {Amount} = require('ledger-types')
const {Ledger} = require('ledger-cli-browser')

class GuldLedger extends aggregation(
  Ledger,
  GuldComponent
) {
  constructor (config) {
    config.options = config.options || {}
    config.options = Object.assign(config.options, {fs: config.observer.fs, db: config.observer.db, hosts: config.observer.hosts})
    super(config)
    this.observer = config.observer
  }

  async isInitialized () {
    return (this.options && this.options.journal && this._account)
  }

  async init () {
    await this.includeJournal(`/BLOCKTREE/${this.observer.name}/ledger`)
    await this.setAccounts()
  }

  async writeTx (tx, gname, comm, sender, time) {
    gname = gname || this.observer.name
    sender = sender || gname
    time = time || Transaction.getTimestamp(tx)
    var repoDir = `/BLOCKTREE/${gname}/ledger/${comm}/${sender}/`
    await this.observer.fs.mkdirps(repoDir)
    await this.observer.fs.writeFile(`${repoDir}${time}.dat`, tx.raw)
    this.observer.git.add(`ledger/${comm}`, `${sender}/${time}.dat`)
    var hash = this.observer.git.commit(`ledger/${comm}`, time)
    var objid = this.observer.git.signCommit(`ledger/${comm}`)
    await updateLedger(tx.raw)
    var results = this.observer.git.push(`ledger/${comm}`)
    if (!(results) || !results.ok) {
      // TODO unwind
      throw new Error(`unable to publish transaction ${objid}`)
    }
  }

  async isRegistered (oname) {
    oname = oname || this.observer.name
    var bal = await getBalance('guld')
    return (
      bal &&
      bal.Income &&
      bal.Income.register &&
      bal.Income.register.individual &&
      bal.Income.register.individual[gname] &&
      bal.Income.register.individual[gname].__bal &&
      bal.Income.register.individual[gname].__bal.GULD &&
      bal.Income.register.individual[gname].__bal.GULD.value &&
      bal.Income.register.individual[gname].__bal.GULD.value.equals(new Decimal(-0.1))
    )
  }

  getHostUrl (code) {
    return `https://github.com/${list[code].mirrors.github}/ledger-${code.toLowerCase()}.git`
  }

  static async cloneLedger (code) {
    return global.git.clone(
      `ledger/${code}`,
      this.hostUrl
    )
  }

  static async cloneAllLedgers () {
    return Promise.all(Object.keys(list).map(this.clone))
  }
}

module.exports = GuldLedger
