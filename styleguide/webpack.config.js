const path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    filename: './main.js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};