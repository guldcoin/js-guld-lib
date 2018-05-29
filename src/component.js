class GuldComponent extends Object {
  constructor (config) {
    super(config)
    if (config.observer) this.observer = config.observer
  }

  async isInitialized () {
    return true
  }

  async init () {
  }
}

module.exports = GuldComponent
