/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  START_TIME,
  END_TIME,
  INVALID_INDEX,
} from '../../../../../../utils/apps/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/query_enhancements/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { verifyDiscoverPageState } from '../../../../../../utils/apps/query_enhancements/saved';

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
        page: 'explore',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace, [INDEX_WITH_TIME_1]);
    });

    describe('send queries', () => {
      it('with PPL', () => {
        cy.setIndexPatternAsDataset(`${INDEX_WITH_TIME_1}*`, DATASOURCE_NAME);
        cy.setQueryLanguage('PPL');
        cy.osd.setTopNavDate(START_TIME, END_TIME);

        // Default PPL query should be set
        cy.osd.waitForLoader(true);

        // Use the more robust verifyDiscoverPageState function to check editor content
        // This handles Monaco editor's special whitespace characters better
        verifyDiscoverPageState({
          dataset: `${INDEX_WITH_TIME_1}*`,
          queryString: `source = ${INDEX_WITH_TIME_1}*`,
          language: 'PPL',
          hitCount: '10,000',
        });
        cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');
        cy.osd.verifyResultsCount(10000);

        // Query should persist across refresh
        cy.reload();
        cy.getElementByTestId(`queryResultCompleteMsg`).should('be.visible');

        // Verify the state again after reload
        verifyDiscoverPageState({
          dataset: `${INDEX_WITH_TIME_1}*`,
          queryString: `source = ${INDEX_WITH_TIME_1}*`,
          language: 'PPL',
          hitCount: '10,000',
        });

        // Test none search PPL query
        const statsQuery = `describe ${INDEX_WITH_TIME_1} | stats count()`;
        cy.setQueryEditor(statsQuery);
        cy.osd.verifyResultsCount(1);

        // Test error message
        const invalidQuery = `source = ${INVALID_INDEX}`;
        const error = `no such index`;
        cy.setQueryEditor(invalidQuery);
        cy.osd.verifyResultsError(error);
      });
    });
  });
};

prepareTestSuite('Queries', queriesTestSuite);
