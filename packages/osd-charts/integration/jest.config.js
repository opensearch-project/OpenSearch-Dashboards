const tsPreset = require('ts-jest/jest-preset');
const jestPuppeteerDocker = require('jest-puppeteer-docker/jest-preset');

module.exports = Object.assign(
  {
    setupFilesAfterEnv: ['<rootDir>/jest_env_setup.ts'],
    globals: {
      'ts-jest': {
        tsConfig: '<rootDir>/tsconfig.json',
      },
    },
  },
  jestPuppeteerDocker,
  tsPreset,
);
