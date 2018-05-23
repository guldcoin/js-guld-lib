const openpgp = require('openpgp')
const global = require('window-or-global')
const observer = global.observer
const git = global.git
const fs = global.fs
let keyring = new openpgp.Keyring()

class Keyring {
  constructor (pin) {
    this.pin = pin // TODO encrypt keyring session with pin
  }

  async sign (message) {
    var signed = await openpgp.sign({
      data: message,
      privateKeys: [keyring.privateKeys.getForId(observer['fpr'])],
      detached: true
    })
    return signed.signature
  }

  async decrypt (message) {
    return (await openpgp.decrypt({
      message: openpgp.message.readArmored(message),
      privateKeys: [keyring.privateKeys.getForId(observer['fpr'])]
    })).data
  }

  async encrypt (message) {
    return (await openpgp.encrypt({
      data: message,
      publicKeys: keyring.publicKeys.getForId(observer['fpr']),
      privateKeys: [keyring.privateKeys.getForId(observer['fpr'])]
    })).data
  }

  async signCommit (partial) {
    return git.sign({
      fs: fs,
      dir: `/BLOCKTREE/${observer['name']}/${partial}/`,
      gitdir: `/BLOCKTREE/${observer['name']}/${partial}/.git`,
      openpgp: openpgp,
      privateKeys: keyring.privateKeys.getForId(observer['fpr'])
    })
  }
}

module.exports = Keyring
