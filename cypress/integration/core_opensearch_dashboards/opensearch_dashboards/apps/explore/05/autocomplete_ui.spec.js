/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Autocomplete UI', () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  beforeEach(() => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.core.waitForDatasetsToLoad();
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.wait(2000);
    cy.explore.clearQueryEditor();
  });

  it('should show suggestion widget and hints', () => {
    cy.getElementByTestId('exploreQueryPanelEditor')
      .find('.monaco-editor')
      .should('be.visible')
      .within(() => {
        // Type to trigger suggestions
        cy.get('.inputarea').first().type('source');

        // Verify suggestions visible
        cy.get('.suggest-widget').should('be.visible');
        cy.get('.monaco-list-row').should('be.visible').should('have.length.at.least', 1);

        // Press Escape to hide
        cy.get('.inputarea').first().type('{esc}');
        cy.get('.suggest-widget').should('not.be.visible');
      });
  });

  it('should build query with mouse interactions', () => {
    // Click in editor
    cy.getElementByTestId('exploreQueryPanelEditor').find('.monaco-editor').click();

    // Type and use mouse to select suggestions
    cy.get('.inputarea').first().type('source = ');
    cy.get('.inputarea').first().type(INDEX_PATTERN_WITH_TIME);
    cy.get('.inputarea').first().type(' | where unique_category = ');

    // Wait for suggestions
    cy.wait(500);
    cy.get('.monaco-list-row').first().click();

    // Execute
    cy.getElementByTestId('exploreQueryExecutionButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('docTable').should('be.visible');
  });

  it('should build query with keyboard shortcuts', () => {
    cy.get('.inputarea').first().type('source = ');
    cy.get('.inputarea').first().type(INDEX_PATTERN_WITH_TIME);
    cy.get('.inputarea').first().type(' | where unique_category = ');

    // Use keyboard to select suggestion
    cy.wait(500);
    cy.get('.inputarea').first().type('{downarrow}{enter}');

    // Execute with button (Cmd+Enter not working in CI)
    cy.getElementByTestId('exploreQueryExecutionButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('docTable').should('be.visible');
  });

  it('should show error markers for invalid query', () => {
    // Type invalid query
    cy.get('.inputarea').first().type('source = invalid_index | invalid_command');

    // Wait for validation
    cy.wait(1000);

    // Check for error decorations
    cy.get('.monaco-editor').within(() => {
      cy.get('.squiggly-error').should('exist');
    });
  });

  it('should show documentation panel', () => {
    // Documentation panel should be open by default
    cy.getElementByTestId('queryAssistDocsPanel').should('be.visible');

    // Type to see context-sensitive help
    cy.get('.inputarea').first().type('source');
    cy.wait(500);

    cy.getElementByTestId('queryAssistDocsPanel').should('contain', 'source');
  });
});

// TODO: Ensure if any conflicts were new tests and to incorporate them here
// generateAutocompleteTestConfigurations(generateAutocompleteTestConfiguration).forEach((config) => {
//   describe(`${config.testName}`, () => {
//     it('should verify suggestion widget and its hint', () => {
//       // Setup
//       cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
//       setDatePickerDatesAndSearchIfRelevant(config.language);
//       cy.wait(2000);
//       cy.explore.clearQueryEditor();

//       const editorType = 'exploreQueryPanelEditor';

//       createQuery(config, false); // use mouse

//       cy.getElementByTestId(editorType)
//         .find('.monaco-editor')
//         .should('be.visible')
//         .within(() => {
//           // Show suggestion and hint with retry
//           showSuggestionAndHint();

//           // Verify suggestions are visible
//           cy.get('.monaco-list-row').should('be.visible').should('have.length.at.least', 1);

//           // Sends ESC and verifies widgets are hidden
//           hideWidgets();

//           // TODO: Add test for having another focused window after bug is fixed
//           // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/8973
//         });
//     });

//     it('should build query using mouse interactions', () => {
//       // Setup
//       cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
//       setDatePickerDatesAndSearchIfRelevant(config.language);
//       cy.wait(2000);
//       cy.explore.clearQueryEditor();

//       createQuery(config, false); // use mouse

//       // Run with mouse click
//       cy.getElementByTestId('exploreQueryExecutionButton').click();

//       cy.osd.waitForLoader(true);
//       cy.wait(1000);
//       validateQueryResults('unique_category', 'Development');
//     });

//     it('should build query using keyboard shortcuts', () => {
//       cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
//       setDatePickerDatesAndSearchIfRelevant(config.language);
//       cy.wait(2000);
//       cy.explore.clearQueryEditor();

//       createQuery(config, true); // use keyboard

//       // Run with keyboard shortcut
//       // SQL and PPL should use cy.get('.inputarea').type('{cmd+enter}')
//       // But it is not working in Remote CI
//       // TODO: investigate and fix
//       cy.getElementByTestId('exploreQueryExecutionButton').click();

//       cy.osd.waitForLoader(true);
//       cy.wait(2000);
//       validateQueryResults('unique_category', 'Development');
//     });

//     it('should validate that error markers are shown for invalide query', () => {
//       cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
//       setDatePickerDatesAndSearchIfRelevant(config.language);
//       cy.wait(2000);
//       cy.explore.clearQueryEditor();

//       createInvalidQuery(config); // use keyboard

//       validateEditorContainsError();
//     });

//     it('should validate that error markers are shown for invalid query', () => {
//       cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
//       setDatePickerDatesAndSearchIfRelevant(config.language);
//       cy.wait(2000);
//       cy.explore.clearQueryEditor();

//       createInvalidQuery(config);

//       validateEditorContainsError();
//     });

//     it('should support implicit ppl queries that dont start with source=', () => {
//       cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
//       setDatePickerDatesAndSearchIfRelevant(config.language);
//       cy.wait(2000);
//       cy.explore.clearQueryEditor();

//       validateImplicitPPLQuery(config);
//     });

//     it('should show open documentation panel by default', () => {
//       cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
//       setDatePickerDatesAndSearchIfRelevant(config.language);
//       cy.wait(2000);
//       cy.explore.clearQueryEditor();

//       validateDocumentationPanelIsOpen(config);
//     });
//   });
// });
