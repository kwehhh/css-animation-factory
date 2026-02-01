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
    // The upstream git dependency `@unfocused/nurvus-ui` can install without built `dist/`
    // on modern Node versions. Alias to a local clone's `src/` so the app can compile.
    alias: {
      '@unfocused/nurvus-ui': path.resolve(__dirname, '../nurvus-design-system/src'),
      // Prevent "Invalid hook call" by forcing a single React instance.
      // Without this, Webpack may pull React from ../nurvus-design-system/node_modules.
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
      title: 'CSS Animation Factory'
    }),
    new CleanWebpackPlugin()
  ]
};