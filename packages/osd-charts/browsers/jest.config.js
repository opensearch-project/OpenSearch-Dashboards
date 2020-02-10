module.exports = {
  roots: ['<rootDir>'],
  preset: 'ts-jest',
  clearMocks: true,
  globalSetup: './setup.js',
  globalTeardown: './teardown.js',
  globals: {
    'ts-jest': {
      tsConfig: '../tsconfig.jest.json',
    },
  },
};
