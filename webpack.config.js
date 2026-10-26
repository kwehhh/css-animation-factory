const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  devServer: {
    contentBase: './dist',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    // `@nurvus/design-system` is consumed from the npm registry (prebuilt `dist/`),
    // so no local-src alias is needed. Keep React pinned to this app's copy so a
    // single React instance is used (guards against "Invalid hook call").
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
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
          "style-loader",
          "css-loader",
          "sass-loader"
        ],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader'
        ]
      },
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/data', to: 'data' }
      ],
    }),
    new HtmlWebpackPlugin({
      // `data-theme="dark"` lives on <html> in the template so @nurvus/ui's
      // runtime tokens (light by default) render dark from the first paint.
      template: 'src/index.html',
      title: 'CSS Animation Factory'
    }),
    new CleanWebpackPlugin()
  ]
};