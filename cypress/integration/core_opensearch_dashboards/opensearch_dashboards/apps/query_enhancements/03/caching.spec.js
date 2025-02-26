/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
} from '../../../../../../utils/apps/constants.js';
import { PATHS, BASE_PATH, DATASOURCE_NAME } from '../../../../../../utils/constants.js';
import { DatasetTypes } from '../../../../../../utils/apps/query_enhancements/constants.js';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/query_enhancements/shared.js';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const cachingTestSuite = () => {
  describe('caching spec', () => {
    beforeEach(() => {
      // Load test data
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.mapping.json'],
        ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.data.ndjson']
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
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });

      cy.osd.navigateToWorkSpaceSpecificPage({
        url: BASE_PATH,
        workspaceName: workspaceName,
        page: 'discover',
        isEnhancement: true,
      });
      cy.getElementByTestId('discoverNewButton').click();
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.osd.deleteIndex(INDEX_WITH_TIME_1);
    });

    it('should validate index pattern refresh', () => {
      const alternativeIndexPatternName = 'data';
      const alternativeIndexPattern = alternativeIndexPatternName + '*';

      cy.setDataset(INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME, DatasetTypes.INDEX_PATTERN.name);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: alternativeIndexPatternName,
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      cy.osd.navigateToWorkSpaceSpecificPage({
        url: BASE_PATH,
        workspaceName: workspaceName,
        page: 'discover',
        isEnhancement: true,
      });

      cy.getElementByTestId('datasetSelectorButton').should('be.visible').click();
      cy.getElementByTestId('datasetSelectorAdvancedButton').click();
      cy.intercept('GET', '**/api/saved_objects/_find?fields*').as('getIndexPatternRequest');
      cy.get(`[title="Index Patterns"]`).click();

      cy.wait('@getIndexPatternRequest').then((interceptedResponse) => {
        let containsIndexPattern = false;

        for (const savedObject of interceptedResponse.response.body.saved_objects) {
          if (savedObject.attributes.title === alternativeIndexPattern) {
            containsIndexPattern = true;
          }
        }

        cy.wrap(containsIndexPattern).should('be.true');
      });
    });
  });
};

prepareTestSuite('Caching', cachingTestSuite);
