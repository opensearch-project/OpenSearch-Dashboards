/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

// Minimal jest config to run the compression test without the broken default jsdom env.
// Usage: npx jest --config src/core/server/saved_objects/routes/jest.config.compression.js --no-coverage
const path = require('path');
module.exports = {
  rootDir: path.resolve(__dirname, '../../../../..'),
  testEnvironment: 'node',
  transform: { '^.+\\.(js|tsx?)$': '<rootDir>/src/dev/jest/babel_transform.js' },
  moduleFileExtensions: ['ts', 'js', 'json'],
};
