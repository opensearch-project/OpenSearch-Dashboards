/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
} from '../../../../../utils/apps/constants';
import { PATHS } from '../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../utils/apps/query_enhancements/shared';
import { prepareTestSuite } from '../../../../../utils/helpers';

const workspace = getRandomizedWorkspaceName();

const noIndexPatternTestSuite = () => {
  describe('No Index Pattern Check Test', () => {
    beforeEach(() => {
      // Load test data
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_2/${INDEX_WITH_TIME_2}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_2/${INDEX_WITH_TIME_2}.data.ndjson`,
        ]
      );

      // Add data source
      cy.osd.addDataSource({
        name: `${DATASOURCE_NAME}`,
        url: `${PATHS.SECONDARY_ENGINE}`,
        authType: 'no_auth',
      });
      // Create workspace
      cy.deleteAllWorkspaces();
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspace);
      cy.wait(2000);
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(`${workspace}`);
      cy.osd.deleteDataSourceByName(`${DATASOURCE_NAME}`);
      cy.osd.deleteIndex(INDEX_WITH_TIME_1);
      cy.osd.deleteIndex(INDEX_WITH_TIME_2);
    });

    describe('empty state', () => {
      it('no index pattern', function () {
        // Go to the Discover page
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName: workspace,
          page: 'discover',
          isEnhancement: true,
        });
        cy.waitForLoader(true);
        cy.getElementByTestId('discoverNoIndexPatterns').should('be.visible');
      });
    });
  });
};

prepareTestSuite('a_check', noIndexPatternTestSuite);
