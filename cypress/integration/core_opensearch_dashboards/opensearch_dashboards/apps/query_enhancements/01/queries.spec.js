/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  DATASOURCE_NAME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/constants';
import { PATHS } from '../../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/query_enhancements/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspace = getRandomizedWorkspaceName();

const queriesTestSuite = () => {
  describe('query enhancement queries', { scrollBehavior: false }, () => {
    beforeEach(() => {
      // Load test data
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        [`cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`],
        [`cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`]
      );
      // Add data source
      cy.osd.addDataSource({
        name: DATASOURCE_NAME,
        url: PATHS.SECONDARY_ENGINE,
        authType: 'no_auth',
      });
      // Create workspace and set up index pattern
      cy.deleteWorkspaceByName(workspace);
      cy.osd.deleteAllOldWorkspaces();
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspace);
      // Create and select index pattern for ${INDEX_WITH_TIME_1}*
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspace,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      // Go to discover page
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspace,
        page: 'discover',
        isEnhancement: true,
      });
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspace);
      cy.osd.deleteDataSourceByName(`${DATASOURCE_NAME}`);
      cy.osd.deleteIndex(INDEX_WITH_TIME_1);
    });

    describe('send queries', () => {
      it('with DQL', function () {
        cy.setQueryLanguage('DQL');
        cy.setTopNavDate(START_TIME, END_TIME);

        const query = `_id:N9srQ8opwBxGdIoQU3TW`;
        cy.setQueryEditor(query);
        cy.osd.waitForLoader(true);
        cy.waitForSearch();
        cy.verifyHitCount(1);

        // Query should persist across refresh
        cy.reload();
        cy.verifyHitCount(1);
      });

      it('with Lucene', function () {
        cy.setQueryLanguage('Lucene');
        cy.setTopNavDate(START_TIME, END_TIME);

        const query = `_id:N9srQ8opwBxGdIoQU3TW`;
        cy.setQueryEditor(query);
        cy.osd.waitForLoader(true);
        cy.waitForSearch();
        cy.verifyHitCount(1);

        // Query should persist across refresh
        cy.reload();
        cy.verifyHitCount(1);
      });

      it('with SQL', function () {
        cy.setQueryLanguage('OpenSearch SQL');

        // Default SQL query should be set
        cy.osd.waitForLoader(true);
        cy.getElementByTestId(`osdQueryEditor__multiLine`).contains(
          `SELECT * FROM ${INDEX_WITH_TIME_1}* LIMIT 10`
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
        cy.setTopNavDate(START_TIME, END_TIME);

        // Default PPL query should be set
        cy.osd.waitForLoader(true);
        cy.getElementByTestId(`osdQueryEditor__multiLine`).contains(
          `source = ${INDEX_WITH_TIME_1}*`
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
};

prepareTestSuite('Queries', queriesTestSuite);
