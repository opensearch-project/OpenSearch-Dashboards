/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  QueryLanguages,
} from '../../../../../../utils/constants';

import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/query_enhancements/shared';

import {
  validateQueryResults,
  generateAutocompleteTestConfiguration,
  generateAutocompleteTestConfigurations,
  createOtherQueryUsingAutocomplete,
  createDQLQueryUsingAutocomplete,
} from '../../../../../../utils/apps/query_enhancements/autocomplete';
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

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        `${INDEX_WITH_TIME_1}*`,
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
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    generateAutocompleteTestConfigurations(generateAutocompleteTestConfiguration).forEach(
      (config) => {
        describe(`${config.testName}`, () => {
          it('should show and select suggestions progressively', () => {
            // Setup
            cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            cy.setQueryLanguage(config.language);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.clearQueryEditor();

            if (config.language === QueryLanguages.DQL.name) {
              createDQLQueryUsingAutocomplete();
            } else {
              createOtherQueryUsingAutocomplete(config);
            }

            // Run the query
            cy.getElementByTestId('querySubmitButton').click();
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
