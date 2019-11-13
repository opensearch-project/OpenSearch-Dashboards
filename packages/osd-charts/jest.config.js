module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom-fourteen',
  setupFilesAfterEnv: ['jest-extended', '<rootDir>/scripts/setup_enzyme.ts', '<rootDir>/scripts/custom_matchers.ts'],
  coveragePathIgnorePatterns: ['<rootDir>/src/mocks/', '<rootDir>/node_modules/'],
  clearMocks: true,
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.jest.json',
    },
  },
};
