const tsPreset = require('ts-jest/jest-preset');
const jestPuppeteerDocker = require('jest-puppeteer-docker/jest-preset');

module.exports = Object.assign(
  {
    setupFilesAfterEnv: ['<rootDir>/jest_env_setup.ts'],
    globals: {
      'ts-jest': {
        tsConfig: '<rootDir>/tsconfig.json',
      },
      /*
       * The window and HTMLElement globals are required to use @elastic/eui with VRT
       *
       * The jest-puppeteer-docker env extends a node test environment and not jsdom test environment.
       * Some EUI components that are included in the bundle, but not used, require the jsdom setup.
       * To bypass these errors we are just mocking both as empty objects.
       */
      window: {},
      HTMLElement: {},
    },
  },
  jestPuppeteerDocker,
  tsPreset,
);
