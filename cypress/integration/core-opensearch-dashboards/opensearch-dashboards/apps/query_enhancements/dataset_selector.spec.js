/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  MiscUtils,
  TestFixtureHandler,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { PATHS, SECONDARY_ENGINE } from '../../../../../utils/constants';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(cy, PATHS.ENGINE);

describe('dataset selector', { scrollBehavior: false }, () => {
  describe('empty state', () => {
    it('no index pattern', function () {
      // Go to the Discover page
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );

      cy.waitForLoaderNewHeader();
      cy.getElementByTestId('discoverNoIndexPatterns');
    });
  });

  describe('select indices', () => {
    before(() => {
      testFixtureHandler.importJSONMapping('cypress/fixtures/timestamp/mappings.json.txt');

      testFixtureHandler.importJSONDoc('cypress/fixtures/timestamp/data.json.txt');

      // Since default cluster is removed, need to create a data source connection if needed
      miscUtils.visitPage('app/management/opensearch-dashboards/dataSources/create');
      cy.intercept('POST', '/api/saved_objects/data-source').as('createDataSourceRequest');
      cy.getElementByTestId(`datasource_card_opensearch`).click();
      cy.get('[name="dataSourceTitle"]').type(SECONDARY_ENGINE.name);
      cy.get('[name="endpoint"]').type(SECONDARY_ENGINE.url);
      cy.getElementByTestId('createDataSourceFormAuthTypeSelect').click();
      cy.get(`button[id="no_auth"]`).click();

      cy.getElementByTestId('createDataSourceButton').click();

      cy.wait('@createDataSourceRequest').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
      });
      cy.location('pathname', { timeout: 6000 }).should(
        'include',
        'app/management/opensearch-dashboards/dataSources'
      );

      // Go to the Discover page
      miscUtils.visitPage(`app/data-explorer/discover#/`);

      cy.waitForLoaderNewHeader();
    });

    it('with SQL as default language', function () {
      cy.getElementByTestId(`datasetSelectorButton`).click();
      cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
      cy.get(`[title="Indexes"]`).click();
      cy.get(`[title=${SECONDARY_ENGINE.name}]`).click();
      cy.get(`[title="timestamp-nanos"]`).click();
      cy.getElementByTestId('datasetSelectorNext').click();

      cy.get(`[class="euiModalHeader__title"]`).should('contain', 'Step 2: Configure data');

      //select SQL
      cy.getElementByTestId('advancedSelectorLanguageSelect').select('OpenSearch SQL');
      cy.getElementByTestId(`advancedSelectorTimeFieldSelect`).select('timestamp');
      cy.getElementByTestId('advancedSelectorConfirmButton').click();

      cy.waitForLoaderNewHeader();

      // SQL should already be selected
      cy.getElementByTestId('queryEditorLanguageSelector').should('contain', 'OpenSearch SQL');
      cy.waitForLoaderNewHeader();

      // SQL query should be executed and sending back result
      cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');

      // Switch language to PPL
      cy.setQueryLanguage('PPL');
      const fromTime = 'Sep 19, 2018 @ 00:00:00.000';
      const toTime = 'Sep 21, 2019 @ 00:00:00.000';
      cy.setTopNavDate(fromTime, toTime);

      cy.waitForLoaderNewHeader();
      cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');
    });

    it('with PPL as default language', function () {
      cy.getElementByTestId(`datasetSelectorButton`).click();
      cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
      cy.get(`[title="Indexes"]`).click();
      cy.get(`[title=${SECONDARY_ENGINE.name}]`).click();
      cy.get(`[title="timestamp-nanos"]`).click();
      cy.getElementByTestId('datasetSelectorNext').click();

      cy.get(`[class="euiModalHeader__title"]`).should('contain', 'Step 2: Configure data');

      //select PPL
      cy.getElementByTestId('advancedSelectorLanguageSelect').select('PPL');

      cy.getElementByTestId(`advancedSelectorTimeFieldSelect`).select('timestamp');
      cy.getElementByTestId('advancedSelectorConfirmButton').click();

      cy.waitForLoaderNewHeader();

      // PPL should already be selected
      cy.getElementByTestId('queryEditorLanguageSelector').should('contain', 'PPL');

      const fromTime = 'Sep 19, 2018 @ 00:00:00.000';
      const toTime = 'Sep 21, 2019 @ 00:00:00.000';
      cy.setTopNavDate(fromTime, toTime);

      cy.waitForLoaderNewHeader();

      // Query should finish running with timestamp and finish time in the footer
      cy.getElementByTestId('queryResultCompleteMsg').should('be.visible');
      cy.getElementByTestId('queryEditorFooterTimestamp').should('contain', 'timestamp');

      // Switch language to SQL
      cy.setQueryLanguage('OpenSearch SQL');

      cy.waitForLoaderNewHeader();
      cy.getElementByTestId('queryResultCompleteMsg').should('be.visible');
      cy.getElementByTestId('queryEditorFooterTimestamp').should('contain', 'timestamp');
    });
  });

  describe('index pattern', () => {
    it('create index pattern and select it', function () {
      testFixtureHandler.importJSONMapping('cypress/fixtures/logstash/mappings.json.txt');
      testFixtureHandler.importJSONDoc('cypress/fixtures/logstash/data.json.txt');

      testFixtureHandler.importJSONMapping('cypress/fixtures/discover/mappings.json.txt');
      testFixtureHandler.importJSONDoc('cypress/fixtures/discover/data.json.txt');

      // Go to the Discover page
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );

      cy.getElementByTestId(`datasetSelectorButton`).click();
      cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
      cy.get(`[title="Index Patterns"]`).click();
      cy.get(`[title="logstash-*"]`).click();
      cy.getElementByTestId('datasetSelectorNext').click();

      cy.waitForLoaderNewHeader();
      cy.waitForSearch();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');
    });
  });

  after(() => {
    cy.deleteIndex('timestamp-nanos');
  });
});
