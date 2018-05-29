const pify = require('pify')
const { Transaction } = require('./transaction/transaction.js')
const { EventEmitter } = require('events')
const { Decimal } = require('decimal.js')
const { DBError } = require('keyvaluedb')
const global = require('window-or-global')
const GuldFS = require('./fs.js')
const logger = require('./log.js')
const GuldDB = require('./db.js')
const GitGuld = require('./git.js')
const GuldKeyring = require('./keyring.js')
const GuldLedger = require('./ledger.js')

class Observer extends EventEmitter {
  constructor (config = {}) {
    super(config)
    this.initialized = false
    this.observer = this
    var observer = Object.assign(this.guldObserver, config.observer)
    for (var prop in observer) {
      this[prop] = observer[prop]
    }
    this.log = logger
  }

  get guldObserver () {
    return {
      name: 'guld',
      mail: '',
      fullname: '',
      fpr: '',
      hosts: [
        {
          'name': 'guldcoin',
          'url': 'https://github.com/'
        }
      ]
    }
  }

  async init () {
    await this.initComponent('db', async (o) => new GuldDB({observer: o}))
    var observer = await this.db.get('observer')
    for (p in observer) {
      this[p] = observer[p]
    }
    await this.initComponent('fs', GuldFS.getFS)
    await this.initComponent('git', async (o) => new GitGuld({observer: o}))
    await this.initComponent('keyring', async (o) => new GuldKeyring({observer: o}))
    var lconf = GuldLedger.getDefaults()
    lconf.observer = this
    await this.initComponent('ledger', async (o) => new GuldLedger(lconf))
    this.initialized = true
    this.emit('initialized')
  }

  async initComponent (component, factory) {
    var c = await factory(this)
    if (!(await c.isInitialized())) {
      await c.init(this)
    }
    c.observer = this
    this[component] = c
    this.emit(`${component}-ready`)
  }

  static nameIsValid (gname) {
    var re = /^[a-z0-9-]{4,40}$/
    var result = re.exec(gname)
    if (!result || result[0].length === 0) {
      throw new RangeError(`name ${gname} is not valid. Can only be lowercase letters, numbers and dashes (-)`)
    } else return true
  }

  async listGuldNames () {
    var namelist = []
    var gname
    let pushName = line => {
      gname = line.split('/')[0]
      if (namelist.indexOf(gname) === -1) namelist.push(gname)
    }
    (await pify(fs.readdir)(`/BLOCKTREE/${this.observer.name}/keys/pgp`)).forEach((line) => {
      return line.indexOf('/') >= 0
    }).forEach(pushName)
    var ledgers = await pify(fs.readdir)(`/BLOCKTREE/${this.observer.name}/ledger/GULD`)
    ledgers.forEach(pushName)
    return namelist
  }

  async isGuldNameAvail (gname) {
    gname = gname || this.name || this.observer.name
    try {
      var valid = Observer.nameIsValid(gname)
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

  // getters and setters
  static async getGlobal () {
    return await new Promise(resolve => {
      if (chrome && chrome.runtime) {
        chrome.runtime.getBackgroundPage(b => {
          if (b) resolve(b)
          else resolve(global)
        })
      } else resolve(global)
    })
  }
}

module.exports = Observer
