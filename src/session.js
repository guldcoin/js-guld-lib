/* global chrome */
const { EventEmitter } = require('events')
const { Ledger } = require('ledger-cli-browser')
const flexfs = require('flexfs')
const { getBest } = require('keyvaluedb')
const global = require('window-or-global')
// declare globals to be managed with the session
let fs
let git = require('git')
let observer = {
  name: 'guld'
  mail: '',
  fullname: '',
  fpr: ''
}
const db = getBest()

class Session extends EventEmitter {
  constructor () {
    super()
    // start initialization, and let events notify consumers
    this.init()
  }

  async init () {
    global = await Session.getGlobal()
    global.session = this
    var config
    if (observer.name === 'guld') {
      try {
        zipdata = Buffer(require('fs').readFileSync('../fixtures/guld.zip'))
        observer = global.observer = await db.get('observer')
      } catch (e) {
        // TODO fetch
      }
      config = {
        fs: 'MountableFileSystem',
        options: {
          '/': {
            fs: 'ChromeStorage'
          },
          '/BLOCKTREE': {
            fs: 'ChromeStorage'
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
    } else {
      config = {
        fs: 'MountableFileSystem',
      }
    }
    fs = global.fs = await flexfs()
    this.blocktree = new Blocktree()
    await this.blocktree.init()
    this.ledger = new Ledger(ledger.getDefaults())
    await this.ledger.includeJournal(`/BLOCKTREE/${observer.name}/ledger`)
    await this.ledger.setAccounts()
    this.emit('initialized')
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

  static async getSession () {
    global = await Session.getGlobal()
    if (!global.session) {
      var session = new Session()
      await session.init()
      return session
    }
    return global.session
  }

  // session flow

  async login () {

  }

  async logout () {
    // if (e && e.preventDefault) e.preventDefault()
    return getBackground().then((b) => {
      this._hosts.gh.client = undefined
      this._hosts.gh.creds = undefined
      this._hosts.gh.name = ''
      this._hosts.gh.mail = ''
      this._hosts.gh.keyid = ''
      this._hosts.gh.avatar = ''
      this._hosts.gh.oauth = ''
      observer.name = 'guld'
      observer.mail = ''
      observer.fpr = ''
      observer.fullname = ''
      this._keyring = null
    })
  }
}

module.exports = Session
