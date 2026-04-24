/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
  ],
  globals: {
    'ts-jest': {
      tsconfig: path.join(__dirname, 'tsconfig.json'),
    },
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: path.join(__dirname, 'tsconfig.json'),
      compiler: path.join(__dirname, 'node_modules', 'typescript'),
    }],
  },
};
