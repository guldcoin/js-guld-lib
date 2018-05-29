const GuldComponent = require('./component.js')
const {commit, pull, push, add, clone, log, getRemoteInfo} = require('isomorphic-git')
const { DBError } = require('keyvaluedb')

class GitGuld extends GuldComponent {
  constructor (config) {
    super(config)
    this.fs = this.observer.fs
    this.db = this.observer.db
  }

  async init () {
    // TODO check for read-only fs
    await this.clonep(`ledger/prices`, `https://github.com/${this.observer.name}/token-prices.git`).catch(e => console.error)
    await this.clonep(`keys/pgp`, `https://github.com/${this.observer.name}/keys-pgp.git`).catch(e => console.error)
    await this.clonep(`ledger/GULD`, `https://github.com/${this.observer.name}/ledger-guld.git`).catch(e => console.error)
  }

  async isInitialized () {
    var ps = await Promise.all([
      [`keys/pgp`, `keys-pgp`],
      [`ledger/GULD`, `ledger-GULD`],
      [`ledger/prices`, `token-prices`]
    ].map(d => {
      return this.isBehind(`/BLOCKTREE/${this.observer.name}/${d[0]}`, `https://github.com/guldcoin/${d[1]}.git`)
    }))
    for (var p; p < ps.length; p++) {
      if (ps[p]) return false
    }
    return true
  }

  async isBehind (p, url) {
    var exists = await this.fs.readdir(p).catch(e => false)
    if (exists === false) return exists
    var commit = await log({
      fs: this.fs,
      dir: p,
      gitdir: `${p}/.git`,
      depth: 1
    }).catch(e => false)
    if (!commit) return false
    var info = {'url': url}
    if (this.observer.hosts && this.observer.hosts.github && this.observer.hosts.github.auth) info = {'url': url, ...auth}
    var resp = true
    var resp = await getRemoteInfo(info).catch(e => resp = false)
    if (!resp) return false
    return commit[0].oid !== resp.refs.heads['master']
  }

  async commit (partial, time) {
    return commit({
      fs: this.fs,
      dir: `/BLOCKTREE/${this.observer.name}/${partial}/`,
      gitdir: `/BLOCKTREE/${this.observer.name}/${partial}/.git`,
      message: `guld app transaction`,
      author: {
        name: observer['fullname'],
        email: observer['mail'],
        date: new Date(time * 1000),
        timestamp: time
      }
    })
  }

  async pull (partial, ref = 'master') {
    return pull({
      fs: this.fs,
      dir: `/BLOCKTREE/${this.observer.name}/${partial}/`,
      gitdir: `/BLOCKTREE/${this.observer.name}/${partial}/.git`,
      ref: ref,
      authUsername: this.observer.hosts['github'].auth.username,
      authPassword: this.observer.hosts['github'].auth.password
    })
  }

  async push (partial, ref = 'master', remote = 'origin') {
    return push({
      fs: this.fs,
      dir: `/BLOCKTREE/${this.observer.name}/${partial}/`,
      gitdir: `/BLOCKTREE/${this.observer.name}/${partial}/.git`,
      remote: remote,
      ref: ref,
      authUsername: this.observer.hosts['github'].auth.username,
      authPassword: this.observer.hosts['github'].auth.password
    })
  }

  async add (partial, filepath) {
    return add({
      fs: this.fs,
      dir: `/BLOCKTREE/${this.observer.name}/${partial}/`,
      gitdir: `/BLOCKTREE/${this.observer.name}/${partial}/.git`,
      filepath: filepath
    })
  }

  async clone (partial, url) {
    var p = `/BLOCKTREE/${this.observer.name}/${partial}`
    return clone({
      fs: this.fs,
      dir: p,
      gitdir: `${p}/.git`,
      url: url,
      singleBranch: true,
      depth: 1,
      authUsername: this.observer.hosts['github'].auth.username,
      authPassword: this.observer.hosts['github'].auth.password
    })
  }

  async clonep (partial, url, ref = 'master') {
    /*
     * Clone or pull if already exists.
     */
    var p = `/BLOCKTREE/${this.observer.name}/${partial}`
    var stats
    try {
      stats = await this.fs.stat(p)
    } catch (e) {
      return this.clone(partial, url)
    }
    if (stats && !stats.isDirectory()) throw new DBError(`${p} already exists`, 'EEXIST')
    var commit = await git.log({
      fs: this.fs,
      dir: p,
      gitdir: `${p}/.git`,
      depth: 1
    })
    var info = await getRemoteInfo({'url': url})
    if (commit[0].oid !== info.refs.heads[ref]) {
      return this.pull(partial)
    }
  }

  async redirectRemote (dir) {
    var cfg = await this.fs.readFile(dir, 'utf-8')
    await this.fs.writeFile(dir, cfg.replace('guldcoin', this.observer.hosts['github'].auth.auth.username))
  }

  async redirectAllRemotes () {
    return Promise.all(['ledger/GULD', 'ledger/GG', 'keys/pgp'].map(partial => {
      return this.redirectRemote(`/BLOCKTREE/${this.observer.name}/${partial}/.git/config`)
    }))
  }
}

module.exports = GitGuld
