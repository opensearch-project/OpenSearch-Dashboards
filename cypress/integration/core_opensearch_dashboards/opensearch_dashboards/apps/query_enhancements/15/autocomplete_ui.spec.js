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
  generateAutocompleteTestConfiguration,
  generateAutocompleteTestConfigurations,
  validateQueryResults,
  showSuggestionAndHint,
  hideWidgets,
  createQuery,
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
          it('should verify suggestion widget and its hint', () => {
            // Setup
            cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            cy.setQueryLanguage(config.language);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.clearQueryEditor();
            const editorType =
              config.language === QueryLanguages.DQL.name
                ? 'osdQueryEditor__singleLine'
                : 'osdQueryEditor__multiLine';

            cy.getElementByTestId(editorType)
              .find('.monaco-editor')
              .should('be.visible')
              .within(() => {
                // Show suggestion and hint with retry
                showSuggestionAndHint();

                // Verify suggestions are visible
                cy.get('.monaco-list-row').should('be.visible').should('have.length.at.least', 1);

                // Sends ESC and verifies widgets are hidden
                hideWidgets();

                // TODO: Add test for having another focused window after bug is fixed
                // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/8973
              });
          });

          it('should build query using mouse interactions', () => {
            // Setup
            cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            cy.setQueryLanguage(config.language);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.clearQueryEditor();

            createQuery(config, false); // use mouse

            // Run with mouse click
            cy.getElementByTestId('querySubmitButton').click();

            cy.osd.waitForLoader(true);
            cy.wait(1000);
            validateQueryResults('unique_category', 'Development');
          });

          it('should build query using keyboard shortcuts', () => {
            cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            cy.setQueryLanguage(config.language);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.clearQueryEditor();

            createQuery(config, true); // use keyboard

            // Run with keyboard shortcut
            if (config.language === QueryLanguages.DQL.name) {
              cy.get('.inputarea').type('{enter}');
            } else {
              // SQL and PPL should use cy.get('.inputarea').type('{cmd+enter}')
              // But it is not working in Remote CI
              // TODO: investigate and fix
              cy.getElementByTestId('querySubmitButton').click();
            }

            cy.osd.waitForLoader(true);
            cy.wait(2000);
            validateQueryResults('unique_category', 'Development');
          });
        });
      }
    );
  });
};

prepareTestSuite('Autocomplete UI', runAutocompleteTests);
