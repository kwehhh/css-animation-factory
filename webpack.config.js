const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  devServer: {
    contentBase: './dist',
  },
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$|\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader"
        ],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/data', to: 'data' },
      ],
    }),
    // HtmlWebpackPlugin doc: https://github.com/jantimon/html-webpack-plugin#options
    new HtmlWebpackPlugin({
      title: 'CSS Animation Factory',
    })
  ]
};