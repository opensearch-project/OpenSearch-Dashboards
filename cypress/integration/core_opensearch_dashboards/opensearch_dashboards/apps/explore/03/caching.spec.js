/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
} from '../../../../../../utils/apps/constants.js';
import { BASE_PATH, DATASOURCE_NAME } from '../../../../../../utils/constants.js';
import { DatasetTypes } from '../../../../../../utils/apps/explore/constants.js';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared.js';
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
        page: 'explore/logs',
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

      cy.explore.setDataset(
        INDEX_PATTERN_WITH_TIME,
        DATASOURCE_NAME,
        DatasetTypes.INDEX_PATTERN.name
      );
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
        page: 'explore/logs',
        isEnhancement: true,
      });

      cy.get('body').then(() => {
        cy.getElementByTestId('datasetSelectButton').should('be.visible').click();
      });

      cy.getElementByTestId('datasetSelectSelectable')
        .should('be.visible')
        .within(() => {
          cy.get(`[title="${alternativeIndexPattern}"]`).should('exist');
        });
    });
  });
};

prepareTestSuite('Caching', cachingTestSuite);
