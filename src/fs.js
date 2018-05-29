const pify = require('pify')
const global = require('window-or-global')
const o2c = require('object-to-class')
const GuldComponent = require('./component.js')
const BrowserFS = require('browserfs')
const {extraFS, supplimentFS} = require('flexfs')
const ExtraFS = o2c(extraFS, 'ExtraFS')
const SupplimentFS = o2c(supplimentFS, 'SupplimentFS')
const Transaction = require('./transaction/transaction.js')
const Buffer = require('buffer/').Buffer
const readOrFetch = require('read-or-fetch')
const BROWSER = require('detect-browser').detect()
const aggregation = require('aggregation/es6')
var zipdata
var bfsconf = pify(BrowserFS.configure)
var fs
let STYPE

if (BROWSER && BROWSER.name.startsWith('node')) {
  try {
    var nodefs = pify(require('fs'))
    nodefs = new GuldFS(nodefs)
    STYPE = 'node'
  } catch (e) {
    STYPE = 'ChromeStorage'
  }
} else if (BROWSER && BROWSER.name.startsWith('chrom')) {
  STYPE = 'ChromeStorage'
} else {
  STYPE = 'LocalStorage'
}

class GuldFS extends aggregation(GuldComponent, SupplimentFS, ExtraFS) {
  constructor (tfs = {}) {
    super(tfs)
    for (var fn in tfs) {
      this[fn] = tfs[fn]
    }
    this.mkdirp = extraFS.mkdirp
    this.cpr = extraFS.cpr
    this.copyFile = supplimentFS.copyFile
  }

  static async getFS (o) {
    // check for cached instance
    if (this instanceof GuldFS) return this
    else if (this && this.fs instanceof GuldFS) return this.fs
    else if (o instanceof GuldFS) return o
    else if (o && o.fs instanceof GuldFS) return o.fs
    // attempt to get primary choice of either node fs or chrome storage
    if (STYPE === 'node' && typeof require !== 'undefined' && nodefs) {
      try {
        fs = pify(nodefs)
        fs.observer = o
        fs = new GuldFS(fs)
      } catch (e) {
        fs = await getDefaultStorageFS()
        //      fs = await getZipFixtureFS()
        fs.observer = o
        fs = new GuldFS(fs)
      }
    } else {
//      fs = await getDefaultStorageFS()
      fs = await getZipFixtureFS()
      fs.observer = o
      fs = new GuldFS(fs)
    }
    var observers = []
    try {
      observers = await fs.detectObservers()
      if (observers.length > 1) {
        observers = observers.filter(obs => obs !== 'guld' && !obs.startsWith('.'))
      }
    } catch (e) {
      fs = await getZipFixtureFS()
      fs.observer = o
      return new GuldFS(fs)
    }
    return fs
  }

  async isInitialized (oname) {
    oname = oname || this.observer.name
    var inited = true
    await this.readdir(`/BLOCKTREE/${oname}/ledger/GULD`).catch(e => inited = false)
    await this.readdir(`/BLOCKTREE/${oname}/ledger/GG`).catch(e => inited = false)
    await this.readdir(`/BLOCKTREE/${oname}/keys/pgp`).catch(e => inited = false)
    return inited
  }

  async init () {
    await this.mkdirp(`/BLOCKTREE/${this.observer.name}/ledger/GULD`)
    await this.mkdirp(`/BLOCKTREE/${this.observer.name}/ledger/prices`)
    await this.mkdirp(`/BLOCKTREE/${this.observer.name}/keys/pgp`)
  }

  async cpBlocktree (from, to) {
    try {
      var stats = await this.stat(`/BLOCKTREE/${to}`)
    } catch (e) {
      await this.cpr(`/BLOCKTREE/${from}`, `/BLOCKTREE/${to}`)
    }
  }

  async detectObservers (fs) {
    fs = fs || this
    return fs.readdir('/BLOCKTREE')
  }
}

async function getBrowserFS (config = {}) {
  return bfsconf(config).then(async (e) => {
    if (e) throw e
    var fs = pify(BrowserFS.BFSRequire('fs'))
    return fs
  })
}

async function getZipFixtureFS () {
  zipdata = zipdata || await readOrFetch('fixtures/guld.zip')
  var config = {
    fs: 'MountableFileSystem',
    options: {
      '/': {
        fs: STYPE,
        options: {
          'storeType': 'local',
          'cacheSize': 500
        }
      },
      '/BLOCKTREE': {
        fs: STYPE,
        options: {
          'storeType': 'local',
          'cacheSize': 500
        }
      },
      '/BLOCKTREE/guld': {
        fs: 'ZipFS',
        options: {
          'zipData': zipdata,
          filename: '/BLOCKTREE/guld'
        }
      }
    }
  }
  return getBrowserFS(config)
}

async function getDefaultStorageFS () {
  if (STYPE === 'node') return nodefs
  var config = {
    fs: STYPE,
    options: {
      'storeType': 'local',
      'cacheSize': 500
    }
  }
  return getBrowserFS(config)
}

module.exports = GuldFS
