/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '../utils/commands';
import '../utils/apps/commands';
import '../utils/dashboards/workspace-plugin/commands';
import '../utils/dashboards/commands';

import { TestFixtureHandler } from '../lib/test-fixture-handler';

Cypress.Commands.add('setupTestData', (mappingFiles, dataFiles) => {
  if (!Array.isArray(mappingFiles) || !Array.isArray(dataFiles)) {
    throw new Error('Both mappingFiles and dataFiles must be arrays');
  }

  if (mappingFiles.length !== dataFiles.length) {
    throw new Error('The number of mapping files must match the number of data files');
  }

  const handler = new TestFixtureHandler(cy, 'http://localhost:9200');

  let chain = cy.wrap(null);
  mappingFiles.forEach((mappingFile, index) => {
    chain = chain
      .then(() => handler.importMapping(mappingFile))
      .then(() => handler.importData(dataFiles[index]));
  });

  return chain;
});
