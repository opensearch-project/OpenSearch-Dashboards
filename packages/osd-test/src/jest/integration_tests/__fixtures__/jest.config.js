/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { resolve } = require('path');
const { REPO_ROOT } = require('@osd/utils');

module.exports = {
  reporters: [
    'default',
    [
      `${REPO_ROOT}/packages/osd-test/target/jest/junit_reporter`,
      {
        reportName: 'JUnit Reporter Integration Test',
        rootDirectory: resolve(
          REPO_ROOT,
          'packages/osd-test/src/jest/integration_tests/__fixtures__'
        ),
      },
    ],
  ],
};
