/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME, PATHS, INDEX_WITH_TIME_1 } from '../../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/query_enhancements/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const noIndexPatternTestSuite = () => {
  describe('No Index Pattern Check Test', () => {
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
      // Create workspace
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteAllOldWorkspaces();
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);
      cy.wait(2000);
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      cy.osd.deleteIndex(INDEX_WITH_TIME_1);
    });

    describe('empty state', () => {
      it('no index pattern', function () {
        // Go to the Discover page
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName: workspaceName,
          page: 'discover',
          isEnhancement: true,
        });
        cy.osd.waitForLoader(true);
        cy.getElementByTestId('discoverNoIndexPatterns').should('be.visible');
      });
    });
  });
};

prepareTestSuite('a_check', noIndexPatternTestSuite);
