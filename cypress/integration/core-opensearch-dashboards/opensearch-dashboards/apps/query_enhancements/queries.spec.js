/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WORKSPACE_NAME,
  DATASOURCE_NAME,
  START_TIME,
  END_TIME,
} from '../../../../../utils/apps/constants';
import { BASE_PATH, SECONDARY_ENGINE } from '../../../../../utils/constants';

const randomString = Math.random().toString(36).substring(7);
const workspace = `${WORKSPACE_NAME}-${randomString}`;

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
    cy.deleteWorkspaceByName(`${workspace}`);
    cy.visit('/app/home');
    cy.createInitialWorkspaceWithDataSource(`${DATASOURCE_NAME}`, `${workspace}`);

    // Create and select index pattern for data_logs_small_time_1*
    cy.createWorkspaceIndexPatterns({
      url: `${BASE_PATH}`,
      workspaceName: `${workspace}`,
      indexPattern: 'data_logs_small_time_1',
      timefieldName: 'timestamp',
      indexPatternHasTimefield: true,
      dataSource: DATASOURCE_NAME,
      isEnhancement: true,
    });

    // Go to workspace home
    cy.navigateToWorkSpaceHomePage(`${BASE_PATH}`, `${workspace}`);
    cy.waitForLoader(true);
  });

  after(() => {
    cy.deleteWorkspaceByName(`${workspace}`);
    cy.deleteDataSourceByName(`${DATASOURCE_NAME}`);
    cy.deleteIndex('data_logs_small_time_1');
  });

  describe('send queries', () => {
    it('with DQL', function () {
      cy.setQueryLanguage('DQL');
      cy.setTopNavDate(START_TIME, END_TIME);

      const query = `_id:1`;
      cy.setSingleLineQueryEditor(query);
      cy.waitForLoader(true);
      cy.waitForSearch();
      cy.verifyHitCount(1);

      // Query should persist across refresh
      cy.reload();
      cy.verifyHitCount(1);
    });

    it('with Lucene', function () {
      cy.setQueryLanguage('Lucene');
      cy.setTopNavDate(START_TIME, END_TIME);

      const query = `_id:1`;
      cy.setSingleLineQueryEditor(query);
      cy.waitForLoader(true);
      cy.waitForSearch();
      cy.verifyHitCount(1);

      // Query should persist across refresh
      cy.reload();
      cy.verifyHitCount(1);
    });

    it('with SQL', function () {
      cy.setQueryLanguage('OpenSearch SQL');

      // Default SQL query should be set
      cy.waitForLoader(true);
      cy.getElementByTestId(`osdQueryEditor__multiLine`).contains(
        `SELECT * FROM data_logs_small_time_1* LIMIT 10`
      );
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');

      // Query should persist across refresh
      cy.reload();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');

      cy.getElementByTestId('osdQueryEditor__multiLine')
        .find('.monaco-editor')
        .should('be.visible')
        // Ensure editor is in the correct visual state ('vs' is Monaco's default theme)
        // This helps verify the editor is fully initialized and ready
        .should('have.class', 'vs')
        .click()
        .find('textarea.inputarea')
        .focus()
        .type('{backspace}', { force: true });

      cy.getElementByTestId(`querySubmitButton`).click();
      cy.waitForSearch();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');
    });

    it('with PPL', function () {
      cy.setQueryLanguage('PPL');

      // Default PPL query should be set
      cy.waitForLoader(true);
      cy.getElementByTestId(`osdQueryEditor__multiLine`).contains(
        `source = data_logs_small_time_1*`
      );
      cy.waitForSearch();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');

      // Query should persist across refresh
      cy.reload();
      cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');
      cy.verifyHitCount('10,000');
    });
  });
});
