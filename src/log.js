module.exports = function (s = {}) {
  return this._log || s || console.log
}
