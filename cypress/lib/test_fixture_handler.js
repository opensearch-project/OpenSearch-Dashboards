/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PATHS } from '../utils/constants';

export class TestFixtureHandler {
  constructor(inputTestRunner) {
    this.testRunner = inputTestRunner;
  }

  // TODO: Migrate legacy methods from test library
  importMapping(filename, options = { url: PATHS.ENGINE }) {
    return cy.readFile(filename).then((body) => {
      const targetIndex = this._extractIndexNameFromPath(filename);

      return cy.request({
        method: 'PUT',
        url: `${options.url}/${targetIndex}`,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        failOnStatusCode: false,
      });
    });
  }

  importData(filename, options = { url: PATHS.ENGINE }) {
    return cy.readFile(filename, 'utf8').then((body) => {
      return cy
        .request({
          method: 'POST',
          url: `${options.url}/_bulk`,
          headers: {
            'Content-Type': 'application/x-ndjson',
          },
          body,
          failOnStatusCode: false,
        })
        .then(() => {
          return cy.request({
            method: 'POST',
            url: `${options.url}/_all/_refresh`,
            failOnStatusCode: false,
          });
        });
    });
  }

  _extractIndexNameFromPath(filepath) {
    const filename = filepath.split('/').pop();
    const indexName = filename.split('.')[0];
    return indexName;
  }
}
