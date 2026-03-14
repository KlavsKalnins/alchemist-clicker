const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Alchemist Clicker',
      template: './src/index.html',
    }),
  ],
  devServer: {
    static: './dist',
    port: 8080,
    hot: true,
  },
  resolve: {
    extensions: ['.js'],
  },
};
