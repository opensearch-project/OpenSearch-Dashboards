/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/query_enhancements/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspace = getRandomizedWorkspaceName();

const queriesTestSuite = () => {
  describe('query enhancement queries', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspace, [INDEX_WITH_TIME_1]);
      // Create and select index pattern for ${INDEX_WITH_TIME_1}*
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspace,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      // Go to discover page
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspace,
        page: 'discover',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace, [INDEX_WITH_TIME_1]);
    });

    describe('send queries', () => {
      it('with DQL', () => {
        cy.setIndexPatternAsDataset(`${INDEX_WITH_TIME_1}*`, DATASOURCE_NAME);
        cy.setQueryLanguage('DQL');
        cy.osd.setTopNavDate(START_TIME, END_TIME);

        const query = `_id:N9srQ8opwBxGdIoQU3TW`;
        cy.setQueryEditor(query);
        cy.osd.waitForLoader(true);
        cy.waitForSearch();
        cy.osd.verifyResultsCount(1);
        cy.verifyHitCount(1);

        // Query should persist across refresh
        cy.reload();
        cy.osd.verifyResultsCount(1);
        cy.verifyHitCount(1);
      });

      it('with Lucene', () => {
        cy.setIndexPatternAsDataset(`${INDEX_WITH_TIME_1}*`, DATASOURCE_NAME);
        cy.setQueryLanguage('Lucene');
        cy.osd.setTopNavDate(START_TIME, END_TIME);

        const query = `_id:N9srQ8opwBxGdIoQU3TW`;
        cy.setQueryEditor(query);
        cy.osd.waitForLoader(true);
        cy.waitForSearch();
        cy.osd.verifyResultsCount(1);
        cy.verifyHitCount(1);

        // Query should persist across refresh
        cy.reload();
        cy.osd.verifyResultsCount(1);
        cy.verifyHitCount(1);
      });

      it('with SQL', () => {
        cy.setIndexPatternAsDataset(`${INDEX_WITH_TIME_1}*`, DATASOURCE_NAME);
        cy.setQueryLanguage('OpenSearch SQL');

        // Default SQL query should be set
        cy.osd.waitForLoader(true);
        cy.getElementByTestId(`osdQueryEditor__multiLine`).contains(
          `SELECT * FROM ${INDEX_WITH_TIME_1}* LIMIT 10`
        );
        cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');

        cy.osd.verifyResultsCount(10);
        cy.getElementByTestId('discoverQueryHits').should('not.exist');

        // Query should persist across refresh
        cy.reload();
        cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');

        cy.osd.verifyResultsCount(10);
        cy.getElementByTestId('discoverQueryHits').should('not.exist');

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

      it('with PPL', () => {
        cy.setIndexPatternAsDataset(`${INDEX_WITH_TIME_1}*`, DATASOURCE_NAME);
        cy.setQueryLanguage('PPL');
        cy.osd.setTopNavDate(START_TIME, END_TIME);

        // Default PPL query should be set
        cy.osd.waitForLoader(true);
        cy.getElementByTestId(`osdQueryEditor__multiLine`).contains(
          `source = ${INDEX_WITH_TIME_1}*`
        );
        cy.waitForSearch();
        cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');

        cy.osd.verifyResultsCount(10000);
        cy.verifyHitCount('10,000');

        // Query should persist across refresh
        cy.reload();
        cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');
        cy.osd.verifyResultsCount(10000);
        cy.verifyHitCount('10,000');
      });
    });
  });
};

prepareTestSuite('Queries', queriesTestSuite);
