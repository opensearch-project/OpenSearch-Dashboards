/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  QueryLanguages,
  DATASOURCE_NAME,
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
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
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
