/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**.test.ts'],
  coverageReporters: ['cobertura', 'html', 'text'],
};
