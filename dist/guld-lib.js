(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["guld-lib"] = factory();
	else
		root["guld-lib"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./lib/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./lib/blocktree.js":
/*!**************************!*\
  !*** ./lib/blocktree.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

throw new Error("Module parse failed: Can not use keyword 'await' outside an async function (128:20)\nYou may need an appropriate loader to handle this file type.\n|         return line.indexOf('/') >= 0\n|       }).forEach(pushName)\n|       var ledgers = await pify(self.fs.readdir)(`/BLOCKTREE/${self.observer}/ledger/GULD`)\n|       ledgers.forEach(pushName)\n|       return namelist");

/***/ }),

/***/ "./lib/db.js":
/*!*******************!*\
  !*** ./lib/db.js ***!
  \*******************/
/*! no static exports found */
/***/ (function(module, exports) {


function reInitDecimal (dec) {
  var val = new Decimal(0)
  val.d = dec.d
  val.e = dec.e
  val.s = dec.s
  return val
}

function reInitAmount (amt) {
  if (amt instanceof Amount) return amt
  else return new Amount(reInitDecimal(amt.value), amt.commodity)
}

function reInitBalance (bal) {
  if (bal instanceof Balance) return bal
  else {
	  var balance = new Balance({})
    Object.keys(bal).forEach(b => {
      if (b.indexOf('_') === -1) {
        balance = balance.add(reInitAmount(bal[b]))
      }
    })
    return balance
  }
}

function reInitAccount (acct) {
  if (acct instanceof Account) return acct
  else {
	  var account = new Account(new Balance({}))
	  Object.keys(acct).forEach(act => {
	    if (act === '__bal') {
        account.__bal = reInitBalance(acct[act])
	    } else if (act.indexOf('_') === -1) {
	      account[act] = reInitAccount(acct[act])
	    }
	  })
	  return account
  }
}

class DBError extends Error {
  constructor (message, code) {
    super(message)
    this.code = code
  }
}

class KeyValueDB {
  constructor () {
    this._db = {}
  }

  async get (key) {
    if (this._db.hasOwnProperty(key)) return Promise.resolve(db[key])
    else throw new DBError(`${key} not found`, 'ENOENT')
  }

  async _set (key, value) {
    this._db[key] = value
    return Promise.resolve()
  }

  async set (key, value, overwrite) {
    if (overwrite) return this._set(value)
    try {
      await this.get(key)
    } catch (e) {
      return this._set(key, value)
    }
    throw new DBError(`${key} already exists`, 'EEXIST')
  }

  async getMany (keys) {
    return Promise.all(keys.map(this.get))
  }

  async setMany (values, overwrite) {
    return Promise.all(Object.keys(values).map(k => {
      return this.set(k, values[k], overwrite)
    }))
  }

  // cache and helper functions
  async updateLedger (tx) {
    return new Promise((resolve, reject) => {
      getLedger().then(ledger => {
        var newJournal = `${ledger.options.raw}
  ${tx}
  `
        chrome.storage.local.set({'journal': newJournal}, () => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
          else {
            getBalance(self.guldname, false).then(bal => {
              balance = bal
              resolve()
            }).catch(reject)
          }
        })
      })
    })
  }

  async getThenSetLedger () {
    return new Promise((resolve, reject) => {
      blocktree.setLedger().then(() => {
        chrome.storage.local.set({'journal': blocktree.getLedger().options.raw}, () => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
          else resolve(blocktree.getLedger())
        })
      }).catch(reject)
    })
  }

  async getLedger (useCache) {
    if (typeof useCache === 'undefined') useCache = true

    if (useCache) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(['journal'], j => {
          if (j && j.journal) {
            blocktree._ledger = new Ledger({'file': '-', 'raw': j.journal, 'binary': 'chrome'})
            resolve(blocktree.getLedger())
            blocktree.emit('ledger-ready')
          } else {
            getThenSetLedger().then(resolve).catch(reject)
          }
        })
      })
    } else {
      return getThenSetLedger()
    }
  }

  async getBalance (gname, useCache) {
    gname = gname || self.guldname
    if (typeof useCache === 'undefined') useCache = true
    if (useCache) {
      return new Promise((resolve, reject) => {
        var cacheKey = `bal_${gname}`
        chrome.storage.local.get([cacheKey], bal => {
          if (bal && bal[cacheKey]) {
            resolve(reInitAccount(bal[cacheKey]))
          } else {
            getThenSetBalances(gname).then(resolve).catch(reject)
          }
        })
      })
    } else {
      return getThenSetBalances(gname)
    }
  }
}

class ChromeStorageDB extends KeyValueDB {
  async get (key) {
    return this.getMany([key])
  }

  async _set (key, value) {
    var o = {}
    o[key] = value
    return this.setMany([o])
  }

  async getMany (keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, vals => {
        if (typeof chrome.runtime.lastError !== 'undefined') { reject(chrome.runtime.lastError) } else resolve(vals)
      })
    })
  }

  async setMany (values, overwrite) {
    var keys = Object.keys(values)
    var got = await getMany(keys)
    Object.keys(got).forEach(k => {
      delete values[k]
    })
    await pify(chrome.storage.local.set)(values)
    if (typeof chrome.runtime.lastError !== 'undefined') throw new DBError(chrome.runtime.lastError, 'EIO')
  }
}


/***/ }),

/***/ "./lib/fs.js":
/*!*******************!*\
  !*** ./lib/fs.js ***!
  \*******************/
/*! no static exports found */
/***/ (function(module, exports) {

throw new Error("Module parse failed: Unexpected token (24:2)\nYou may need an appropriate loader to handle this file type.\n|   try {\n|     var stats = await global.fs.stat(`/BLOCKTREE/${guldname}`\n|   } catch (e) {\n|     await global.fs.rename('/BLOCKTREE/guld', `/BLOCKTREE/${guldname}`)\n|   }");

/***/ }),

/***/ "./lib/git.js":
/*!********************!*\
  !*** ./lib/git.js ***!
  \********************/
/*! no static exports found */
/***/ (function(module, exports) {

throw new Error("Module parse failed: Unexpected token (83:27)\nYou may need an appropriate loader to handle this file type.\n|   }\n| \n|   async redirectAllRemotes = () => {\n|     return Promise.all(['ledger/GULD', 'ledger/GG', 'keys/pgp'].map(partial => {\n|       return redirectRemote(`/BLOCKTREE/${this.guldname}/${partial}/.git/config`)");

/***/ }),

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @module guld-lib
 * @license MIT
 * @author zimmi
 */

module.exports = {
  blocktree: __webpack_require__(/*! ./blocktree.js */ "./lib/blocktree.js"),
  transaction: __webpack_require__(/*! ./transaction.js */ "./lib/transaction.js"),
  pgp: __webpack_require__(/*! ./pgp.js */ "./lib/pgp.js"),
  git: __webpack_require__(/*! ./git.js */ "./lib/git.js"),
  fs: __webpack_require__(/*! ./fs.js */ "./lib/fs.js"),
  db: __webpack_require__(/*! ./db.js */ "./lib/db.js")
}


/***/ }),

/***/ "./lib/pgp.js":
/*!********************!*\
  !*** ./lib/pgp.js ***!
  \********************/
/*! no static exports found */
/***/ (function(module, exports) {

throw new Error("Module parse failed: Unexpected token (21:0)\nYou may need an appropriate loader to handle this file type.\n|     privateKeys: [self.keyring.privateKeys.getForId(self.guldfpr)]\n|   }).data\n| }\n| \n| module.exports.simpleEncrypt = async (message) => {");

/***/ }),

/***/ "./lib/transaction.js":
/*!****************************!*\
  !*** ./lib/transaction.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

class Transaction {
  constructor (text) {
    this.raw = text
  }

  static getType (tx) {
    var re = /^[0-9]{4}\/[0-9]{2}\/[0-9]{2} \* [ a-zA-Z0-9]*$/m
    var txheader = re.exec(tx)
    if (txheader && txheader.length > 0 && txheader[0].length > 0) {
      return txheader[0].split('*')[1].trim()
    } else {
      throw new TypeError('expected a ledger transaction, but found unknown type')
    }
  }

  static getTimestamp (tx) {
    var re = /^ {4}; timestamp: [0-9]+$/m
    var txheader = re.exec(tx)
    if (txheader && txheader.length > 0 && txheader[0].length > 0) {
      return txheader[0].split(':')[1].trim()
    } else {
      throw new TypeError('expected a ledger transaction, but found unknown type')
    }
  }

  static getAmount (tx) {
    var re = /^ +[:a-zA-Z-]+ +[0-9a-zA-Z,. ]+$/m
    var txheader = re.exec(tx)
    if (txheader && txheader.length > 0 && txheader[0].length > 0) {
      var posting = txheader[0].replace(',', '')
      re = /[0-9.]+/
      txheader = re.exec(posting)
      if (txheader && txheader.length > 0 && txheader[0].length > 0) {
        return txheader[0]
      } else {
        throw new TypeError('expected a ledger transaction, but found unknown type')
      }
    } else {
      throw new TypeError('expected a ledger transaction, but found unknown type')
    }
  }
}

class Transfer extends Transaction {
  static create (sender, receipient, amount, commodity, time) {
    time = time || Math.trunc(Date.now() / 1000)
    var date = new Date(time * 1000)
    var datestr = `${date.toISOString().split('T')[0].replace(/-/g, '/')}`
    return new Transfer(`${datestr} * transfer
    ; timestamp: ${time}
    ${sender}:Assets   -${amount} ${commodity}
    ${sender}:Expenses   ${amount} ${commodity}
    ${receipient}:Assets   ${amount} ${commodity}
    ${receipient}:Income   -${amount} ${commodity}
`)
  }
}

class Grant extends Transaction {
  static create (contributor, amount, commodity, time) {
    time = time || Math.trunc(Date.now() / 1000)
    var date = new Date(time * 1000)
    var datestr = `${date.toISOString().split('T')[0].replace(/-/g, '/')}`
    return new Grant(`${datestr} * grant
    ; timestamp: ${time}
    ${contributor}:Assets   ${amount} ${commodity}
    ${contributor}:Income   -${amount} ${commodity}
    guld:Liabilities   -${amount} ${commodity}
    guld:Equity:${contributor}   ${amount} ${commodity}
`)
  }
}

class Register extends Transaction {
  static create (rname, rtype, qty, commodity, payee, time) {
    var amount = qty * 0.1
    if (payee) {
      payee = `:${payee}`
    } else payee = ''
    time = time || Math.trunc(Date.now() / 1000)
    var date = new Date(time * 1000)
    var datestr = `${date.toISOString().split('T')[0].replace(/-/g, '/')}`
    return new Register(`${datestr} * register ${rtype}
    ; timestamp: ${time}
    ${rname}:Assets   -${amount} ${commodity}
    ${rname}:Expenses   ${amount} ${commodity}
    guld:Liabilities   ${amount} ${commodity}
    guld:Income:register:${rtype}:${rname}${payee}   -${amount} ${commodity}
`)
  }
}


/***/ })

/******/ });
});
//# sourceMappingURL=guld-lib.js.map