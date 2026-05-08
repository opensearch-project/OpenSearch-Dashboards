/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1, DATASOURCE_NAME } from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import {
  validateQueryResults,
  generateAutocompleteTestConfiguration,
  generateAutocompleteTestConfigurations,
  createOtherQueryUsingAutocomplete,
} from '../../../../../../utils/apps/explore/autocomplete';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

export const runAutocompleteTests = () => {
  describe('discover autocomplete tests', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      // Create workspace and dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        `${INDEX_WITH_TIME_1}*`, // Uses index pattern
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    beforeEach(() => {
      // mock AI mode disablement
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    generateAutocompleteTestConfigurations(generateAutocompleteTestConfiguration).forEach(
      (config) => {
        describe(`${config.testName}`, () => {
          it('should show and select suggestions progressively', () => {
            // Setup
            cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.wait(2000);
            cy.explore.clearQueryEditor();

            createOtherQueryUsingAutocomplete(config);

            // Run the query
            cy.getElementByTestId('exploreQueryExecutionButton').click();
            cy.osd.waitForLoader(true);
            cy.wait(1000);
            // Validate results meet our conditions
            validateQueryResults('bytes_transferred', 9500, '>');
            validateQueryResults('category', 'Application');
          });
        });
      }
    );
  });
};

prepareTestSuite('Autocomplete Query', runAutocompleteTests);
