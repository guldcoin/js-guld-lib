const isogit = require('isomorphic-git')
const global = require('window-or-global')
const { DBError } = require('keyvaluedb')
const observer = global.observer
const fs = global.fs
let auth = {
  username: observer.name,
  password: ''
}

class git {
  constructor (auth) {
    this.auth = auth
    this.git = isogit
    global.git = this
  }

  async commit (partial, time) {
    return this.git.commit({
      fs: fs,
      dir: `/BLOCKTREE/${observer['name']}/${partial}/`,
      gitdir: `/BLOCKTREE/${observer['name']}/${partial}/.git`,
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
    return this.git.pull({
      fs: fs,
      dir: `/BLOCKTREE/${observer['name']}/${partial}/`,
      gitdir: `/BLOCKTREE/${observer['name']}/${partial}/.git`,
      ref: ref,
      authUsername: this.auth.username,
      authPassword: this.auth.password
    })
  }

  async push (partial, ref = 'master', remote = 'origin') {
    return this.git.push({
      fs: fs,
      dir: `/BLOCKTREE/${observer['name']}/${partial}/`,
      gitdir: `/BLOCKTREE/${observer['name']}/${partial}/.git`,
      remote: remote,
      ref: ref,
      authUsername: this.auth.username,
      authPassword: this.auth.password
    })
  }

  async add (partial, filepath) {
    return this.git.add({
      fs: fs,
      dir: `/BLOCKTREE/${observer['name']}/${partial}/`,
      gitdir: `/BLOCKTREE/${observer['name']}/${partial}/.git`,
      filepath: filepath
    })
  }

  async clone (partial, url) {
    var p = `/BLOCKTREE/${observer['name']}/${partial}`
    return git.clone({
      fs: fs,
      dir: p,
      gitdir: `${p}/.git`,
      url: url,
      singleBranch: true,
      depth: 1
    })
  }

  /*
   * Clone or pull if already exists.
   */
  async clonep (partial, url, ref = 'master') {
    var p = `/BLOCKTREE/${observer['name']}/${partial}`
    var stats
    try {
      stats = await fs.stat(p)
    } catch (e) {
      return this.clone(partial, url)
    }
    if (stats && !stats.isDirectory()) throw new DBError(`${p} already exists`, 'EEXIST')
    var commit = await git.log({
      fs: fs,
      dir: p,
      gitdir: `${p}/.git`,
      depth: 1
    })
    var info = await this.git.getRemoteInfo({'url': url})
    if (commit[0].oid !== info.refs.heads[ref]) {
      return this.pull(partial)
    }
  }

  async redirectRemote (dir) {
    var cfg = await fs.readFile(dir, 'utf-8')
    await fs.writeFile(dir, cfg.replace('guldcoin', this.auth.username))
  }

  async redirectAllRemotes () {
    return Promise.all(['ledger/GULD', 'ledger/GG', 'keys/pgp'].map(partial => {
      return this.redirectRemote(`/BLOCKTREE/${observer['name']}/${partial}/.git/config`)
    }))
  }
}

module.exports = git
