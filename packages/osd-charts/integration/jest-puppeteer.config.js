const getConfig = require('jest-puppeteer-docker/lib/config');
const baseConfig = getConfig();
const defaults = require('./defaults');

const port = process.env.PORT || defaults.PORT;
const host = process.env.HOST || defaults.HOST;

/**
 * combined config object
 *
 * https://github.com/smooth-code/jest-puppeteer/tree/master/packages/jest-environment-puppeteer#jest-puppeteerconfigjs
 */
const customConfig = Object.assign(
  {
    launch: {
      dumpio: false,
      headless: true,
      slowMo: 0,
      browserUrl: `http://${host}:${port}/iframe.html`,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    server: {
      command: `RNG_SEED='elastic-charts' yarn start --port=${port} --quiet`,
      port,
      usedPortAction: 'error',
      launchTimeout: 120000,
      debug: false,
    },
  },
  baseConfig,
);

module.exports = customConfig;
