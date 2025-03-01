/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
} from '../../../../../../utils/apps/constants.js';
import { BASE_PATH, DATASOURCE_NAME } from '../../../../../../utils/constants.js';
import { DatasetTypes } from '../../../../../../utils/apps/query_enhancements/constants.js';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/query_enhancements/shared.js';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const cachingTestSuite = () => {
  describe('caching spec', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'discover',
        isEnhancement: true,
      });
      cy.getElementByTestId('discoverNewButton').click();
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
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
