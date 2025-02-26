/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  QueryLanguages,
  PATHS,
  DATASOURCE_NAME,
  DatasetTypes,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/query_enhancements/shared';
import {
  validateQueryResults,
  generateAutocompleteTestConfiguration,
  generateAutocompleteTestConfigurations,
  createOtherQueryUsingAutocomplete,
  createDQLQueryUsingAutocomplete,
} from '../../../../../../utils/apps/query_enhancements/autocomplete';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

export const runAutocompleteTests = () => {
  describe('discover autocomplete tests', () => {
    beforeEach(() => {
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        [`cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`],
        [`cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`]
      );
      cy.osd.addDataSource({
        name: DATASOURCE_NAME,
        url: PATHS.SECONDARY_ENGINE,
        authType: 'no_auth',
      });
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteAllOldWorkspaces();
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      cy.osd.deleteIndex(INDEX_WITH_TIME_1);
    });

    generateAutocompleteTestConfigurations(generateAutocompleteTestConfiguration).forEach(
      (config) => {
        describe(`${config.testName}`, () => {
          beforeEach(() => {
            if (config.datasetType === DatasetTypes.INDEX_PATTERN.name) {
              cy.createWorkspaceIndexPatterns({
                workspaceName: workspaceName,
                indexPattern: INDEX_WITH_TIME_1,
                timefieldName: 'timestamp',
                dataSource: DATASOURCE_NAME,
                isEnhancement: true,
              });
            }
            cy.osd.navigateToWorkSpaceSpecificPage({
              workspaceName: workspaceName,
              page: 'discover',
              isEnhancement: true,
            });
          });

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
