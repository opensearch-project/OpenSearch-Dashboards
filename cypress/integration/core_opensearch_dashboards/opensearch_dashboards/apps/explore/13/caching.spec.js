/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_PATTERN_WITH_TIME } from '../../../../../../utils/apps/constants.js';
import { BASE_PATH, DATASOURCE_NAME } from '../../../../../../utils/constants.js';
import { DatasetTypes } from '../../../../../../utils/apps/explore/constants.js';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared.js';
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

      // Create workspace and dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME, // Uses 'data_logs_small_time_*'
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
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
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    it('should validate index pattern refresh', () => {
      const alternativeIndexPatternName = 'data';
      const alternativeIndexPattern = alternativeIndexPatternName + '*';

      cy.explore.setDataset(
        INDEX_PATTERN_WITH_TIME,
        DATASOURCE_NAME,
        DatasetTypes.INDEX_PATTERN.name
      );

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
        page: 'explore/logs',
        isEnhancement: true,
      });

      cy.getElementByTestId('datasetSelectButton')
        .should('be.visible')
        .should('not.be.disabled')
        .click();

      cy.getElementByTestId('datasetSelectSelectable')
        .should('be.visible')
        .within(() => {
          cy.getElementByTestId(`datasetSelectOption-${alternativeIndexPattern}`).should('exist');
        });
    });
  });
};

prepareTestSuite('Caching', cachingTestSuite);
