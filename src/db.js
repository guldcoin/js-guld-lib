const aggregation = require('aggregation/es6')
const o2c = require('object-to-class')
const GuldComponent = require('./component.js')
const {defaultDB} = require('keyvaluedb')

class GuldDB extends aggregation(
  GuldComponent,
  o2c(defaultDB(), 'KeyValueDB')
) {
  constructor (config) {
    super(config)
  }

  async isInitialized () {
    var inited = false
    try {
      inited = await this.get('guld-initialized')
    } catch (e) {}
    return inited
  }

  async init () {
    await this.set('guld-initialized', true, true)
  }
}

module.exports = GuldDB
