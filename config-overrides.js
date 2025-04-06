const webpack = require('webpack');
const { override } = require('customize-cra');

module.exports = override(
  (config) => {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "path": require.resolve("path-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "fs": false,
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "zlib": require.resolve("browserify-zlib"),
    });
    config.resolve.fallback = fallback;
    
    config.plugins = (config.plugins || []).concat([
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      })
    ]);
    
    return config;
  }
);