/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WORKSPACE_NAME, DATASOURCE_NAME, START_TIME, END_TIME } from './constants';
import { BASE_PATH, SECONDARY_ENGINE } from '../../../../../utils/constants';

describe('query enhancement queries', { scrollBehavior: false }, () => {
  before(() => {
    // Load test data
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

    // Create workspace and set up index pattern
    cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
    cy.visit('/app/home');
    cy.createInitialWorkspaceWithDataSource(`${DATASOURCE_NAME}`, `${WORKSPACE_NAME}`);

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

    // Go to workspace home
    cy.navigateToWorkSpaceHomePage(`${BASE_PATH}`, `${WORKSPACE_NAME}`);
    cy.setTopNavDate(START_TIME, END_TIME);
    cy.waitForLoader(true);
  });

  after(() => {
    cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
    cy.deleteDataSourceByName(`${DATASOURCE_NAME}`);
    cy.deleteIndex('data_logs_small_time_1');
  });

  describe('send queries', () => {
    it('with DQL', function () {
      cy.setQueryLanguage('DQL');

      const query = `_id:1`;
      cy.setSingleLineQueryEditor(query);
      cy.waitForLoader(true);
      cy.waitForSearch();
      cy.verifyHitCount(1);

      // query should persist across refresh
      cy.reload();
      cy.verifyHitCount(1);
    });

    it('with Lucene', function () {
      cy.setQueryLanguage('Lucene');

      const query = `_id:1`;
      cy.setSingleLineQueryEditor(query);
      cy.waitForLoader(true);
      cy.waitForSearch();
      cy.verifyHitCount(1);

      //query should persist across refresh
      cy.reload();
      cy.verifyHitCount(1);
    });

    it('with SQL', function () {
      cy.setQueryLanguage('OpenSearch SQL');

      // default SQL query should be set
      cy.waitForLoader(true);
      cy.getElementByTestId(`osdQueryEditor__multiLine`).contains(
        `SELECT * FROM data_logs_small_time_1* LIMIT 10`
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
      cy.waitForLoader(true);
      cy.getElementByTestId(`osdQueryEditor__multiLine`).contains(
        `source = data_logs_small_time_1*`
      );
      cy.waitForSearch();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');

      //query should persist across refresh
      cy.reload();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');
      cy.verifyHitCount('10,000');
    });
  });
});
