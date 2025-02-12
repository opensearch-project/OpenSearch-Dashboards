/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  PATHS,
} from '../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../utils/apps/query_enhancements/shared';

import { prepareTestSuite } from '../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

export const runSavedSearchTests = () => {
  describe('Performance testing', () => {
    beforeEach(() => {
      // Load test data
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_2}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_2}.data.ndjson`,
        ]
      );
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      // Add data source
      cy.osd.addDataSource({
        name: DATASOURCE_NAME,
        url: PATHS.SECONDARY_ENGINE,
        authType: 'no_auth',
      });
      cy.visit('/app/home');
    });

    afterEach(() => {
      // No need to explicitly delete all saved queries as deleting the workspace will delete associated saved queries
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
    });

    it('should test discover page compoonent performance', () => {
      cy.visit('/app/discover');
      cy.measureComponentPerformance('discover', 'sidebarPanel');
      cy.getElementByTestId('sidebarPanel').should('be.visible');
    });
  });
};

prepareTestSuite('Performance testing', runSavedSearchTests);
