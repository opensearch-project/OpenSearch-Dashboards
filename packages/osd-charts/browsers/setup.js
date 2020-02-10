const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const path = require('path');
const config = require(path.join(__dirname, '..', '.playground', 'webpack.config.js'));

module.exports = async () => {
  return new Promise((resolve, reject) => {
    const compiler = webpack(config);
    const server = new WebpackDevServer(compiler);
    compiler.hooks.done.tap('done', () => {
      resolve();
      global.__WP_SERVER__ = server;
    });

    server.listen(8080, 'localhost', function(err) {
      if (err) {
        reject(err);
      }
    });
  });
};
