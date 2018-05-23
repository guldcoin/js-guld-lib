const nodefs = require('fs')
const Buffer = require('buffer/').Buffer
module.exports.zipdata = Buffer(nodefs.readFileSync('fixtures/guld.zip'))
