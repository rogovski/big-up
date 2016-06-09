var path = require('path');

var webpack = require('webpack');

var dir_js = path.resolve(__dirname, 'src/client');
var dir_build = path.resolve(__dirname, 'public');

module.exports = {
  entry: path.resolve(dir_js, 'index.js'),
  output: {
    path: dir_build,
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: dir_build,
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        test: dir_js,
        query: {
          presets: ['es2015'],
        }
      }
    ]
  },
  plugins: [
    // Avoid publishing files when compilation fails
    new webpack.NoErrorsPlugin()
  ],

  // Create Sourcemaps for the bundle
  devtool: 'source-map'
};