/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  MiscUtils,
  TestFixtureHandler,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../../../utils/commands';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(cy, Cypress.env('openSearchUrl'));

describe('query enhancement queries', { scrollBehavior: false }, () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();

    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/query_enhancement/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/query_enhancement/data_with_index_pattern.json.txt'
    );

    // Go to the Discover page
    miscUtils.visitPage(`app/data-explorer/discover#/`);

    cy.setAdvancedSetting({
      defaultIndex: 'timestamp-*',
    });

    // Go to the Discover page
    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2018-09-19T13:31:44.000Z',to:'2019-09-24T01:31:44.000Z'))`
    );

    cy.get(`[class~="datasetSelector__button"]`).click();
    cy.get(`[data-test-subj="datasetOption-timestamp-*"]`).click();

    cy.waitForLoaderNewHeader();
    cy.waitForSearch();
  });

  describe('send queries', () => {
    it('with DQL', function () {
      const query = `_id:1`;
      cy.setSingleLineQueryEditor(query);
      cy.waitForLoaderNewHeader();
      cy.waitForSearch();
      cy.verifyHitCount(1);

      //query should persist across refresh
      cy.reload();
      cy.verifyHitCount(1);
    });

    it('with Lucene', function () {
      cy.setQueryLanguage('Lucene');

      const query = `_id:1`;
      cy.setSingleLineQueryEditor(query);
      cy.waitForLoaderNewHeader();
      cy.waitForSearch();
      cy.verifyHitCount(1);

      //query should persist across refresh
      cy.reload();
      cy.verifyHitCount(1);
    });

    it('with SQL', function () {
      cy.setQueryLanguage('OpenSearch SQL');

      // default SQL query should be set
      cy.waitForLoaderNewHeader();
      cy.getElementByTestId(`osdQueryEditor__multiLine`).contains(
        `SELECT * FROM timestamp-* LIMIT 10`
      );
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');

      //query should persist across refresh
      cy.reload();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');

      cy.getElementByTestId(`osdQueryEditor__multiLine`).type(`{backspace}`);
      cy.getElementByTestId(`querySubmitButton`).click();
      cy.waitForSearch();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');
    });

    it('with PPL', function () {
      cy.setQueryLanguage('PPL');

      // default PPL query should be set
      cy.waitForLoaderNewHeader();
      cy.getElementByTestId(`osdQueryEditor__multiLine`).contains(`source = timestamp-*`);
      cy.waitForSearch();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');
      cy.get('[class="euiText euiText--small"]').then((text) => cy.log(text));
      cy.verifyHitCount(4);

      //query should persist across refresh
      cy.reload();
      cy.verifyHitCount(4);
    });

    after(() => {
      cy.deleteIndex('timestamp-nanos');
      cy.deleteIndex('timestamp-milis');
      cy.deleteSavedObject('index-pattern', 'index-pattern:timestamp-*');
    });
  });
});
