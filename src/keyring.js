const aggregation = require('aggregation/es6')
const o2c = require('object-to-class')
const GuldComponent = require('./component.js')
const pgpKeyring = require('keyring-pgp')

class GuldKeyring extends aggregation(
  GuldComponent,
  o2c(pgpKeyring, 'PGPKeyring')
) {
  async mapNamesToFPR (fpr) {
    if (typeof fpr === 'string') fpr = [fpr]
    var kn = {}
    var names = fs.readdir(`/BLOCKTREE/${this.observer.name}/keys/pgp/`)
    for (var i = 0; i < names.length; i++) {
      if (fpr.length === 0) return kn
      var p = `/BLOCKTREE/${this.observer.name}/keys/pgp/${names[i]}`
      var keys = await this.observer.fs.readdir(p)
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
}
console.log(GuldKeyring)
module.exports = GuldKeyring
