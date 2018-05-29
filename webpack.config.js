var path = require('path')

module.exports = [
  {
    target: 'web',
    entry: {
      index: './lib/index.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'guld-lib.js',
      library: 'guld-lib',
      libraryTarget: 'umd'
    },
    mode: 'development',
    devtool: 'source-map',
    watch: false,
    watchOptions: {
      aggregateTimeout: 1000,
      poll: 1000
    },
    node: {
      fs: "empty"
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              forceEnv: 'browser'
            }
          }
        }
      ]
    }
  }
]
