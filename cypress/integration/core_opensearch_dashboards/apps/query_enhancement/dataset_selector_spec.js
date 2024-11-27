/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  MiscUtils,
  TestFixtureHandler,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../../../utils/commands';
import { clusterName, clusterConnection } from '../../../../../utils/constants';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(cy, Cypress.env('openSearchUrl'));

const indexSet = ['logstash-2015.09.22', 'logstash-2015.09.21', 'logstash-2015.09.20'];

describe('dataset navigator', { scrollBehavior: false }, () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
  });

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
      testFixtureHandler.importJSONMapping(
        'cypress/fixtures/dashboard/opensearch_dashboards/query_enhancement/mappings.json.txt'
      );

      testFixtureHandler.importJSONDoc(
        'cypress/fixtures/dashboard/opensearch_dashboards/query_enhancement/data.json.txt'
      );

      // Since default cluster is removed, need to create a data source connection
      miscUtils.visitPage('app/management/opensearch-dashboards/dataSources/create');
      cy.intercept('POST', '/api/saved_objects/data-source').as('createDataSourceRequest');
      cy.getElementByTestId(`datasource_card_opensearch`).click();
      cy.get('[name="dataSourceTitle"]').type(clusterName);
      cy.get('[name="endpoint"]').type(clusterConnection);
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
      cy.get(`[title=${clusterName}]`).click();
      cy.get(`[title="timestamp-nanos"]`).click();
      cy.getElementByTestId('datasetSelectorNext').click();

      cy.get(`[class="euiModalHeader__title"]`).should('contain', 'Step 2: Configure data');
      // should have two options: SQL and PPL
      cy.getElementByTestId('advancedSelectorLanguageSelect')
        .get('option')
        .should('have.length', 2);

      //select SQL
      cy.getElementByTestId('advancedSelectorLanguageSelect').select('OpenSearch SQL');
      cy.getElementByTestId('advancedSelectorConfirmButton').click();

      cy.waitForLoaderNewHeader();

      // SQL should already be selected
      cy.getElementByTestId('queryEditorLanguageSelector').should('contain', 'OpenSearch SQL');
      cy.waitForLoaderNewHeader();

      // SQL query should be executed and sending back result
      cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');

      // Switch language to PPL
      cy.setQueryLanguage('PPL');
      cy.waitForLoaderNewHeader();
      cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');
    });

    it('with PPL as default language', function () {
      cy.getElementByTestId(`datasetSelectorButton`).click();
      cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
      cy.get(`[title="Indexes"]`).click();
      cy.get(`[title=${clusterName}]`).click();
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
      // import logstash functional
      testFixtureHandler.importJSONDocIfNeeded(
        indexSet,
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt',
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
      );
      testFixtureHandler.importJSONMapping(
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.mappings.json.txt'
      );

      testFixtureHandler.importJSONDoc(
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.json.txt'
      );

      // Go to the Discover page
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );

      cy.get(`[class~="datasetSelector__button"]`).click();
      cy.getElementByTestId(`datasetOption-logstash-*`).click();

      cy.waitForLoaderNewHeader();
      cy.waitForSearch();
      cy.verifyHitCount('14,004');
    });
  });

  after(() => {
    cy.deleteIndex('timestamp-nanos');
    // delete the data source connection
    miscUtils.visitPage('app/management/opensearch-dashboards/dataSources/');
    cy.get(`[class="euiTableRowCell"]`).contains(clusterName).click();
    cy.getElementByTestId('editDatasourceDeleteIcon').click();
    cy.getElementByTestId('confirmModalConfirmButton').click();
  });
});
