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
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/query_enhancements/shared.js';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const cachingTestSuite = () => {
  describe('caching spec', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-search'] // features
      );
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'data-explorer/discover',
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

      const alternativeDatasetId = getRandomizedDatasetId();
      const workspaceId = Cypress.env(`${workspaceName}:WORKSPACE_ID`);

      cy.osd.getDataSourceId(DATASOURCE_NAME);
      cy.get('@DATASOURCE_ID').then((datasourceId) => {
        cy.osd.createDatasetByEndpoint(
          alternativeDatasetId,
          workspaceId,
          datasourceId,
          {
            title: alternativeIndexPattern,
            signalType: 'logs',
            timestamp: 'timestamp',
          },
          `${alternativeDatasetId}:DATASET_ID`
        );
        cy.wait(2000);
      });

      cy.osd.navigateToWorkSpaceSpecificPage({
        url: BASE_PATH,
        workspaceName: workspaceName,
        page: 'data-explorer/discover',
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
