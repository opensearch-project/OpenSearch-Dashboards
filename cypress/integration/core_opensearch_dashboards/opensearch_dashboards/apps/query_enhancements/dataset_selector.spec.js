/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME, START_TIME, END_TIME } from '../../../../../utils/apps/constants';
import { SECONDARY_ENGINE } from '../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../utils/apps/query_enhancements/shared';

const workspace = getRandomizedWorkspaceName();

describe('dataset selector', { scrollBehavior: false }, () => {
  before(() => {
    cy.setupTestData(
      SECONDARY_ENGINE.url,
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.mapping.json'],
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.data.ndjson']
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
    cy.deleteWorkspaceByName(workspace);
    cy.visit('/app/home');
    cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspace);
    cy.navigateToWorkSpaceSpecificPage({
      workspaceName: workspace,
      page: 'discover',
      isEnhancement: true,
    });
  });

  afterEach(() => {
    cy.deleteWorkspaceByName(`${workspace}`);
  });

  describe('select indices', () => {
    it('with SQL as default language', function () {
      cy.setIndexAsDataset('data_logs_small_time_1', DATASOURCE_NAME, 'OpenSearch SQL');

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
      cy.setIndexAsDataset('data_logs_small_time_1', DATASOURCE_NAME, 'PPL');

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
        workspaceName: workspace,
        indexPattern: 'data_logs_small_time_1',
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });

      cy.navigateToWorkSpaceHomePage(workspace);

      cy.waitForLoader(true);
      cy.setIndexPatternAsDataset('data_logs_small_time_1*', DATASOURCE_NAME);
      // setting OpenSearch SQL as the code following it does not work if this test is isolated
      cy.setQueryLanguage('OpenSearch SQL');

      cy.waitForLoader(true);
      cy.waitForSearch();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');
    });
  });
});
