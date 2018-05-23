const pify = require('pify')
const { Transaction } = require('./transaction/transaction.js')
const { EventEmitter } = require('events')
const { Decimal } = require('decimal.js')
const { DBError } = require('keyvaluedb')
const global = require('window-or-global')
const pgp = require('./pgp.js')

module.export = class Blocktree extends EventEmitter {
  constructor () {
    super()
    this.initialized = false
  }

  async init (seed, ghseed) {
    seed = seed || 'guld'
    ghseed = ghseed || 'guldcoin'
    var inited = false
    try {
      inited = await db.get('blocktree-initialized')
    } catch () {}
    if (!inited) {
      await db.set('guld-initialized', true, true)
      return await this._init(observer.name, 'guldcoin')
    }
  }

  async _init (seed, ghseed) {
    await fs.mkdirp(`/BLOCKTREE/${seed}/ledger`, fs)
    await fs.mkdirp(`/BLOCKTREE/${seed}/keys`, fs)
    this.emit('basic-fs-ready')
    await git.clonep(`ledger/prices`, `https://github.com/${ghseed}/token-prices.git`)
    this.emit('token-prices-ready')
    git.clonep(`keys/pgp`, `https://github.com/${ghseed}/keys-pgp.git`)
    this.emit('keys-pgp-ready')
    git.clonep(`ledger/GULD`, `https://github.com/${ghseed}/ledger-guld.git`)
    // this.emit('ledger-guld-ready')
    this.emit('initialized')
    this.initialized = true
  }

  async bootstrap () {
    try {
      await fs.readdir(`/BLOCKTREE/${observer.name}/ledger/GULD`)
      await fs.readdir(`/BLOCKTREE/${observer.name}/keys/pgp`)
      blocktree.initialized = true
      blocktree.emit('initialized')
    } catch (err) {
      this.init()
    }
  }

  async cpBlocktree (guldname) {
    try {
      var stats = await fs.stat(`/BLOCKTREE/${observer.name}`)
    } catch (e) {
      await fs.cpr('/BLOCKTREE/guld', `/BLOCKTREE/${observer.name}`)
    }
    if (!stats.isDirectory()) {
      await fs.cpr('/BLOCKTREE/guld', `/BLOCKTREE/${observer.name}`)
    }
  }

  async listNames () {
    var namelist = []
    var gname
    let pushName = line => {
      gname = line.split('/')[0]
      if (namelist.indexOf(gname) === -1) namelist.push(gname)
    }
    (await pify(fs.readdir)(`/BLOCKTREE/${observer.name}/keys/pgp`)).forEach((line) => {
      return line.indexOf('/') >= 0
    }).forEach(pushName)
    var ledgers = await pify(fs.readdir)(`/BLOCKTREE/${observer.name}/ledger/GULD`)
    ledgers.forEach(pushName)
    return namelist
  }

  static nameIsValid (gname) {
    var re = /^[a-z0-9-]{4,40}$/
    var result = re.exec(gname)
    if (!result || result[0].length === 0) {
      throw new RangeError(`name ${gname} is not valid. Can only be lowercase letters, numbers and dashes (-)`)
    } else return true
  }

  async isNameAvail (gname) {
    try {
      var valid = Blocktree.nameIsValid(gname)
    } catch (e) {
      return Promise.reject(e)
    }
    if (!this.initialized || !valid) {
      return Promise.resolve(false)
    } else {
      var namelist = await this.listNames()
      return (namelist.indexOf(gname) < 0)
    }
  }


  async mapNamesToFPR (fpr) {
    if (typeof fpr === 'string') fpr = [fpr]
    var kn = {}
    var names = fs.readdir(`/BLOCKTREE/${observer.name}/keys/pgp/`)
    for (var i = 0; i < names.length; i++) {
      if (fpr.length === 0) return kn
      var p = `/BLOCKTREE/${observer.name}/keys/pgp/${names[i]}`
      var keys = await fs.readdir(p)
      if (fpr.length === 0) return kn
      keys.forEach(key => {
        key = key.replace('.asc', '')
        if (fpr.indexOf(key) >= 0) {
          kn[key] = names[i]
          fpr = fpr.filter(f => {
            return f !== key
          })
        }
        if (fpr.length === 0) return kn
      })
      throw new DBError('No names found.', 'ENOENT')
    }
  }

  async isRegistered (gname) {
    gname = gname || this.guldname
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

  async writeTx (tx, gname, comm, sender, time) {
    gname = gname || this.guldname
    comm = comm || commodity
    sender = sender || gname
    time = time || Transaction.getTimestamp(tx)
    var repoDir = `/BLOCKTREE/${gname}/ledger/${comm}/${sender}/`
    await fs.mkdirps(repoDir)
    await fs.writeFile(`${repoDir}${time}.dat`, tx.raw)
    console.log(`wrote ${repoDir}${time}.dat`)
    await git.add(`ledger/${comm}`, `${sender}/${time}.dat`)
    console.log(`${(Date.now() - time * 1000) / 1000} seconds to create and add tx`) // eslint-disable-line no-console
    var hash = await git.commit(`ledger/${comm}`, time)
    console.log(`${(Date.now() - time * 1000) / 1000} seconds to create unsigned commit ${hash}`) // eslint-disable-line no-console
    var objid = await pgp.signCommit(`ledger/${comm}`)
    console.log(`${(Date.now() - time * 1000) / 1000} seconds to sign commit ${objid}`) // eslint-disable-line no-console
    await updateLedger(tx.raw)
    var results = await git.push(`ledger/${comm}`)
    if (results && results.ok) {
      console.log(`${(Date.now() - time * 1000) / 1000} seconds to push commit ${objid}`) // eslint-disable-line no-console
    }
  }

  getBalance () {

  }
}
