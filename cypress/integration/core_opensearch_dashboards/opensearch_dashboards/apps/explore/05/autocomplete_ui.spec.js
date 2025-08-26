/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1, DATASOURCE_NAME } from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import {
  generateAutocompleteTestConfiguration,
  generateAutocompleteTestConfigurations,
  validateQueryResults,
  showSuggestionAndHint,
  hideWidgets,
  createQuery,
  createInvalidQuery,
  validateEditorContainsError,
  validateImplicitPPLQuery,
  validateDocumentationPanelIsOpen,
} from '../../../../../../utils/apps/explore/autocomplete';
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
        page: 'explore/logs',
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
            cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.wait(2000);
            cy.explore.clearQueryEditor();

            const editorType = 'exploreQueryPanelEditor';

            createQuery(config, false); // use mouse

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
            cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.wait(2000);
            cy.explore.clearQueryEditor();

            createQuery(config, false); // use mouse

            // Run with mouse click
            cy.getElementByTestId('exploreQueryExecutionButton').click();

            cy.osd.waitForLoader(true);
            cy.wait(1000);
            validateQueryResults('unique_category', 'Development');
          });

          it('should build query using keyboard shortcuts', () => {
            cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.wait(2000);
            cy.explore.clearQueryEditor();

            createQuery(config, true); // use keyboard

            // Run with keyboard shortcut
            // SQL and PPL should use cy.get('.inputarea').type('{cmd+enter}')
            // But it is not working in Remote CI
            // TODO: investigate and fix
            cy.getElementByTestId('exploreQueryExecutionButton').click();

            cy.osd.waitForLoader(true);
            cy.wait(2000);
            validateQueryResults('unique_category', 'Development');
          });

          it('should validate that error markers are shown for invalide query', () => {
            cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.wait(2000);
            cy.explore.clearQueryEditor();

            createInvalidQuery(config); // use keyboard

            validateEditorContainsError();
          });

          it('should validate that error markers are shown for invalid query', () => {
            cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.wait(2000);
            cy.explore.clearQueryEditor();

            createInvalidQuery(config);

            validateEditorContainsError();
          });

          it('should support implicit ppl queries that dont start with source=', () => {
            cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.wait(2000);
            cy.explore.clearQueryEditor();

            validateImplicitPPLQuery(config);
          });

          it('should show open documentation panel by default', () => {
            cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            cy.wait(2000);
            cy.explore.clearQueryEditor();

            validateDocumentationPanelIsOpen(config);
          });
        });
      }
    );
  });
};

prepareTestSuite('Autocomplete UI', runAutocompleteTests);
