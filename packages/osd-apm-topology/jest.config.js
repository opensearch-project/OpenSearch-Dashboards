/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');

module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/src/test-utils/__mocks__/svg.ts',
    '\\.module\\.css$': 'identity-obj-proxy',
    '\\.s?css$': '<rootDir>/src/test-utils/__mocks__/styles.ts',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^vitest$': '<rootDir>/src/test-utils/vitest-compat.ts',
    '^@testing-library/jest-dom/vitest$': '<rootDir>/src/test-utils/__mocks__/empty.ts',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': path.resolve(__dirname, '../../src/dev/jest/babel_transform.js'),
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules(?![\\/\\\\](@xyflow|@dagrejs|d3-color|ramda))[/\\\\].+\\.js$',
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['js', 'mjs', 'json', 'ts', 'tsx', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/jest.setup.ts'],
  globals: {
    Uint8Array: Uint8Array,
  },
};
