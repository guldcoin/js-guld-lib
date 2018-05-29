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
var nodefs
let STYPE

if (BROWSER && BROWSER.name.startsWith('node')) {
  try {
    nodefs = pify(require('fs'))
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
  }

  static async getFS (o) {
    // check for cached instance
    if (this instanceof GuldFS) return this
    else if (this.fs instanceof GuldFS) return this.fs
    else if (o instanceof GuldFS) return o
    else if (o.fs instanceof GuldFS) return o.fs
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
      fs = await getDefaultStorageFS()
      //      fs = await getZipFixtureFS()
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
    await this.readdir(`/BLOCKTREE/${oname}/ledger/GULD`)
    await this.readdir(`/BLOCKTREE/${oname}/keys/pgp`)
  }

  async init () {
    await this.mkdirp(`/BLOCKTREE/${this.observer.name}/ledger`)
    await this.mkdirp(`/BLOCKTREE/${this.observer.name}/keys`)
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
  await bfsconf(config)
  return pify(BrowserFS.BFSRequire('fs'))
}

async function getZipFixtureFS () {
  zipdata = zipdata || Buffer(await readOrFetch('fixtures/guld.zip'))
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
  if (STYPE === 'node') return pify(require('fs'))
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
