/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WORKSPACE_NAME, DATASOURCE_NAME, START_TIME, END_TIME } from './constants';
import { BASE_PATH, SECONDARY_ENGINE } from '../../../../../utils/constants';

describe('dataset selector', { scrollBehavior: false }, () => {
  before(() => {
    cy.setupTestData(
      SECONDARY_ENGINE.url,
      ['cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.mapping.json'],
      ['cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.data.ndjson']
    );

    // Add data source
    cy.addDataSource({
      name: `${DATASOURCE_NAME}`,
      url: `${SECONDARY_ENGINE.url}`,
      authType: 'no_auth',
    });
  });
  after(() => {
    cy.deleteDataSourceByName(`${DATASOURCE_NAME}`);
    cy.deleteIndex('data_logs_small_time_1');
  });
  beforeEach(() => {
    // Create workspace
    cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
    cy.visit('/app/home');
    cy.createInitialWorkspaceWithDataSource(`${DATASOURCE_NAME}`, `${WORKSPACE_NAME}`);
  });

  afterEach(() => {
    cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
  });

  describe('select indices', () => {
    it('with SQL as default language', function () {
      cy.getElementByTestId(`datasetSelectorButton`).click();
      cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
      cy.get(`[title="Indexes"]`).click();
      cy.get(`[title=${DATASOURCE_NAME}]`).click();
      cy.get(`[title="data_logs_small_time_1"]`).click(); // Updated to match loaded data
      cy.getElementByTestId('datasetSelectorNext').click();

      cy.get(`[class="euiModalHeader__title"]`).should('contain', 'Step 2: Configure data');

      //select SQL
      cy.getElementByTestId('advancedSelectorLanguageSelect').select('OpenSearch SQL');
      cy.getElementByTestId(`advancedSelectorTimeFieldSelect`).select('timestamp');
      cy.getElementByTestId('advancedSelectorConfirmButton').click();

      cy.waitForLoader(true);

      // SQL should already be selected
      cy.getElementByTestId('queryEditorLanguageSelector').should('contain', 'OpenSearch SQL');
      cy.waitForLoader(true);

      // SQL query should be executed and sending back result
      cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');

      // Switch language to PPL
      cy.setQueryLanguage('PPL');
      cy.setTopNavDate(START_TIME, END_TIME);

      cy.waitForLoader(true);
      cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');
    });

    it('with PPL as default language', function () {
      cy.getElementByTestId(`datasetSelectorButton`).click();
      cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
      cy.get(`[title="Indexes"]`).click();
      cy.get(`[title=${DATASOURCE_NAME}]`).click();
      cy.get(`[title="data_logs_small_time_1"]`).click(); // Updated to match loaded data
      cy.getElementByTestId('datasetSelectorNext').click();

      cy.get(`[class="euiModalHeader__title"]`).should('contain', 'Step 2: Configure data');

      //select PPL
      cy.getElementByTestId('advancedSelectorLanguageSelect').select('PPL');

      cy.getElementByTestId(`advancedSelectorTimeFieldSelect`).select('timestamp');
      cy.getElementByTestId('advancedSelectorConfirmButton').click();

      cy.waitForLoader(true);

      // PPL should already be selected
      cy.getElementByTestId('queryEditorLanguageSelector').should('contain', 'PPL');

      cy.setTopNavDate(START_TIME, END_TIME);

      cy.waitForLoader(true);

      // Query should finish running with timestamp and finish time in the footer
      cy.getElementByTestId('queryResultCompleteMsg').should('be.visible');
      cy.getElementByTestId('queryEditorFooterTimestamp').should('contain', 'timestamp');

      // Switch language to SQL
      cy.setQueryLanguage('OpenSearch SQL');

      cy.waitForLoader(true);
      cy.getElementByTestId('queryResultCompleteMsg').should('be.visible');
      cy.getElementByTestId('queryEditorFooterTimestamp').should('contain', 'timestamp');
    });
  });

  describe('index pattern', () => {
    it('create index pattern and select it', function () {
      // Create and select index pattern for data_logs_small_time_1*
      cy.createWorkspaceIndexPatterns({
        url: `${BASE_PATH}`,
        workspaceName: `${WORKSPACE_NAME}`,
        indexPattern: 'data_logs_small_time_1',
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });

      cy.navigateToWorkSpaceHomePage(`${BASE_PATH}`, `${WORKSPACE_NAME}`);

      cy.waitForLoader(true);
      cy.getElementByTestId(`datasetSelectorButton`).click();
      cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
      cy.get(`[title="Index Patterns"]`).click();
      cy.get(`[title="${DATASOURCE_NAME}::data_logs_small_time_1*"]`).should('exist');

      cy.waitForLoader(true);
      cy.waitForSearch();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');
    });
  });
});
