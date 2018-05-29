const GuldComponent = require('./component.js')
const {commit, pull, push, add, clone, log, getRemoteInfo} = require('isomorphic-git')
const { DBError } = require('keyvaluedb')

class GitGuld extends GuldComponent {
  constructor (config) {
    super(config)
  }

  async isInitialized () {
    var ps = await Promise.all([
      [`keys/pgp`, `keys-pgp`],
      [`ledger/GULD`, `ledger-GULD`],
      [`ledger/prices`, `token-prices`],
      [`ledger/GG`, `ledger-GG`]
    ].map(d => {
      return this.isBehind(`/BLOCKTREE/${this.observer.name}/${d[0]}`, `https://github.com/guldcoin/${d[1]}.git`)
    }))
    for (var p; p < ps.length; p++) {
      if (ps[p]) return false
    }
    return true
  }

  async isBehind (p, url) {
    var commit = await log({
      fs: this.observer.fs,
      dir: p,
      gitdir: `${p}/.git`,
      depth: 1
    })
    var info = {'url': url, auth: this.observer.hosts[0].auth}
    try {
      var resp = await getRemoteInfo(info)
      return commit[0].oid !== resp.refs.heads['master']
    } catch (e) {
      console.error(e)
      return false // hack for offline mode
    }
  }

  async init () {
    // TODO check for read-only fs
    await git.clonep(`ledger/prices`, `https://github.com/${this.observer.name}/token-prices.git`)
    await git.clonep(`keys/pgp`, `https://github.com/${this.observer.name}/keys-pgp.git`)
    await git.clonep(`ledger/GULD`, `https://github.com/${this.observer.name}/ledger-guld.git`)
  }

  async commit (partial, time) {
    return commit({
      fs: this.observer.fs,
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
      fs: this.observer.fs,
      dir: `/BLOCKTREE/${this.observer.name}/${partial}/`,
      gitdir: `/BLOCKTREE/${this.observer.name}/${partial}/.git`,
      ref: ref,
      authUsername: this.observer.hosts[0].auth.username,
      authPassword: this.observer.hosts[0].auth.password
    })
  }

  async push (partial, ref = 'master', remote = 'origin') {
    return push({
      fs: this.observer.fs,
      dir: `/BLOCKTREE/${this.observer.name}/${partial}/`,
      gitdir: `/BLOCKTREE/${this.observer.name}/${partial}/.git`,
      remote: remote,
      ref: ref,
      authUsername: this.observer.hosts[0].auth.username,
      authPassword: this.observer.hosts[0].auth.password
    })
  }

  async add (partial, filepath) {
    return add({
      fs: this.observer.fs,
      dir: `/BLOCKTREE/${this.observer.name}/${partial}/`,
      gitdir: `/BLOCKTREE/${this.observer.name}/${partial}/.git`,
      filepath: filepath
    })
  }

  async clone (partial, url) {
    var p = `/BLOCKTREE/${this.observer.name}/${partial}`
    return clone({
      fs: this.observer.fs,
      dir: p,
      gitdir: `${p}/.git`,
      url: url,
      singleBranch: true,
      depth: 1,
      authUsername: this.observer.hosts[0].auth.username,
      authPassword: this.observer.hosts[0].auth.password
    })
  }

  async clonep (partial, url, ref = 'master') {
    /*
     * Clone or pull if already exists.
     */
    var p = `/BLOCKTREE/${this.observer.name}/${partial}`
    var stats
    try {
      stats = await this.observer.fs.stat(p)
    } catch (e) {
      return this.clone(partial, url)
    }
    if (stats && !stats.isDirectory()) throw new DBError(`${p} already exists`, 'EEXIST')
    var commit = await git.log({
      fs: this.observer.fs,
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
    var cfg = await this.observer.fs.readFile(dir, 'utf-8')
    await this.fs.writeFile(dir, cfg.replace('guldcoin', this.observer.hosts[0].auth.auth.username))
  }

  async redirectAllRemotes () {
    return Promise.all(['ledger/GULD', 'ledger/GG', 'keys/pgp'].map(partial => {
      return this.redirectRemote(`/BLOCKTREE/${this.observer.name}/${partial}/.git/config`)
    }))
  }
}

module.exports = GitGuld
