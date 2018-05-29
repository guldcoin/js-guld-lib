/**
 * @module guld-lib
 * @license MIT
 * @author zimmi
 */

module.exports = {
  Observer: require('./observer.js'),
  GitGuld: require('./git.js'),
  GuldFS: require('./fs.js'),
  GuldDB: require('./db.js'),
  GuldKeyring: require('./keyring.js'),
  GuldLedger: require('./ledger.js'),
  transaction: {
    Transaction: require('./transaction/transaction.js'),
    Grant: require('./transaction/grant.js'),
    Transfer: require('./transaction/transfer.js'),
    Register: require('./transaction/register.js')
  }
}
