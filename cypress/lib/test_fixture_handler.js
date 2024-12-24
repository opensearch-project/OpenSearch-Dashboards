/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_ENGINE } from '../utils/constants';

export class TestFixtureHandler {
  constructor(inputTestRunner, openSearchUrl = BASE_ENGINE.url) {
    this.testRunner = inputTestRunner;
    this.openSearchUrl = openSearchUrl;
  }

  // TODO: Migrate legacy methods from test library

  importMapping(filename) {
    return cy.readFile(filename).then((mappingData) => {
      const targetIndex = this._extractIndexNameFromPath(filename);

      return cy.request({
        method: 'PUT',
        url: `${this.openSearchUrl}/${targetIndex}`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: mappingData,
        failOnStatusCode: false,
      });
    });
  }

  importData(filename) {
    return cy.readFile(filename, 'utf8').then((content) => {
      return cy
        .request({
          method: 'POST',
          url: `${this.openSearchUrl}/_bulk`,
          headers: {
            'Content-Type': 'application/x-ndjson',
          },
          body: content,
          failOnStatusCode: false,
        })
        .then(() => {
          return cy.request({
            method: 'POST',
            url: `${this.openSearchUrl}/_all/_refresh`,
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
