const fs = require('fs')

module.exports = {
  devServer: {
    disableHostCheck: true,
    https: {
      https: true,
      hotOnly: false
    }
  }
}