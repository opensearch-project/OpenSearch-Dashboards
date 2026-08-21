/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME, INDEX_WITH_TIME_1 } from '../../../../../utils/apps/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();
const dashboardName = 'variables-test-dashboard';

const navigateToDashboardList = () => {
  cy.osd.navigateToWorkSpaceSpecificPage({
    workspaceName,
    page: 'dashboards',
    isEnhancement: true,
  });
};

const createAndSaveDashboard = () => {
  navigateToDashboardList();
  // Create a new dashboard (starts in edit mode)
  cy.getElementByTestId('newItemButton').click();
  cy.wait(2000);
  // Save the dashboard so variables can be added (dashboard needs an ID)
  cy.getElementByTestId('dashboardSaveMenuItem').click();
  cy.getElementByTestId('savedObjectTitle').clear().type(dashboardName);
  cy.getElementByTestId('confirmSaveSavedObjectButton').click();
  cy.wait(2000);
};

const enterEditMode = () => {
  cy.getElementByTestId('dashboardEditSwitch').click();
  cy.wait(1000);
};

const openVariableEditor = () => {
  cy.getElementByTestId('addVariableButton').click();
  cy.getElementByTestId('variableEditorPanel').should('be.visible');
};

const selectCustomType = () => {
  cy.getElementByTestId('variableEditorType').click();
  cy.get('[role="option"]').contains('Custom').click();
};

const addCustomOption = (index, value, label = '') => {
  cy.getElementByTestId('variableEditorAddCustomOption').click();
  cy.getElementByTestId(`variableEditorCustomValue-${index}`).clear().type(value);
  if (label) {
    cy.getElementByTestId(`variableEditorCustomLabel-${index}`).clear().type(label);
  }
};

const saveVariable = () => {
  cy.getElementByTestId('variableEditorSave').click();
  cy.wait(1000);
};

// --- Query editor modal helpers (query variables now edit through a modal) ---
const openQueryEditorModal = () => {
  cy.getElementByTestId('variableQueryPanelOpenEditor').click();
  cy.getElementByTestId('queryEditorModal').should('be.visible');
};

const selectDatasetInModal = (datasetName) => {
  cy.getElementByTestId('datasetSelectButton').click();
  cy.get('[role="option"]').contains(datasetName).click({ force: true });
  cy.wait(1000);
};

const typeInModalEditor = (query) => {
  cy.getElementByTestId('queryEditorModalEditor')
    .find('.react-monaco-editor-container')
    .should('be.visible')
    .click({ force: true });
  cy.get('.inputarea').first().should('be.visible');
  cy.wait(100);
  // Clear any existing content (cross-platform select-all + delete).
  cy.get('.inputarea')
    .first()
    .focus()
    .type('{ctrl}a', { force: true })
    .type('{backspace}', { force: true })
    .type('{meta}a', { force: true })
    .type('{backspace}', { force: true });
  cy.get('.inputarea')
    .first()
    .type(query, { force: true, delay: 30, parseSpecialCharSequences: false });
  cy.wait(300);
};

const previewInModal = () => {
  cy.getElementByTestId('queryEditorModalRunQuery').click();
  cy.wait(5000);
};

const applyModal = () => {
  cy.getElementByTestId('queryEditorModalApply').click();
  cy.wait(500);
};

export const runDashboardVariableTests = () => {
  describe('Dashboard variables', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        `${INDEX_WITH_TIME_1}*`,
        'timestamp',
        'logs',
        ['use-case-observability']
      );
      createAndSaveDashboard();
      // Dashboard switches to view mode after save, enter edit mode
      enterEditMode();
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    describe('Create custom variable', () => {
      it('should create a custom variable with multiple options', () => {
        openVariableEditor();

        // Fill in variable name first before changing type
        cy.getElementByTestId('variableEditorName').type('env');

        selectCustomType();

        // Add custom options
        addCustomOption(0, 'production', 'Production');
        addCustomOption(1, 'staging', 'Staging');
        addCustomOption(2, 'development', 'Development');

        saveVariable();

        // Verify variable appears in the variables bar
        cy.getElementByTestId('dashboardVariablesBar').should('be.visible');
        cy.getElementByTestId('variable-env').should('be.visible');
      });

      it('should display the variable selector with correct default value', () => {
        // The first custom option should be auto-selected
        cy.getElementByTestId('variable-env').within(() => {
          cy.getElementByTestId('variable-selector-current').should('contain.text', 'Production');
        });
      });

      it('should allow selecting a different value', () => {
        // Click to open the popover
        cy.getElementByTestId('variable-env')
          .find('[data-test-subj="variable-selector-button"]')
          .click();

        // Select a different option
        cy.get('[role="option"]').contains('Staging').click();

        // Verify the selected value changed
        cy.getElementByTestId('variable-env').within(() => {
          cy.getElementByTestId('variable-selector-current').should('contain.text', 'Staging');
        });
      });
    });

    describe('Edit variable', () => {
      it('should open the management panel and edit an existing variable', () => {
        // Open management panel
        cy.getElementByTestId('manageVariablesButton').click();
        cy.getElementByTestId('variableManagementPanel').should('be.visible');

        // Click edit on the variable
        cy.getElementByTestId('variableManagementPanel')
          .find('[aria-label="Edit variable"]')
          .first()
          .click();

        // Verify editor opens with existing values
        cy.getElementByTestId('variableEditorPanel').should('be.visible');
        cy.getElementByTestId('variableEditorName').should('have.value', 'env');

        // Update the label
        cy.getElementByTestId('variableEditorLabel').clear().type('Environment');

        // Add another custom option
        cy.getElementByTestId('variableEditorAddCustomOption').click();
        cy.getElementByTestId('variableEditorCustomValue-3').clear().type('testing');
        cy.getElementByTestId('variableEditorCustomLabel-3').clear().type('Testing');

        // Save changes
        cy.getElementByTestId('variableEditorSave').click();
        cy.wait(1000);

        // Verify the variable is still visible in the bar
        cy.getElementByTestId('variable-env').should('be.visible');
      });
    });

    describe('Delete variable', () => {
      it('should create a second variable to test deletion', () => {
        openVariableEditor();
        cy.getElementByTestId('variableEditorName').type('region');
        selectCustomType();

        addCustomOption(0, 'us_east', 'US East');
        addCustomOption(1, 'us_west', 'US West');

        saveVariable();

        // Verify both variables exist
        cy.getElementByTestId('variable-env').should('be.visible');
        cy.getElementByTestId('variable-region').should('be.visible');
      });

      it('should delete a variable from the management panel', () => {
        // Open management panel
        cy.getElementByTestId('manageVariablesButton').click();
        cy.getElementByTestId('variableManagementPanel').should('be.visible');

        // Click delete on the second variable (region)
        cy.getElementByTestId('variableManagementPanel')
          .find('[aria-label="Delete variable"]')
          .last()
          .click();

        // Confirm deletion in the modal
        cy.getElementByTestId('confirmModalConfirmButton').click();
        cy.wait(1000);

        // Close management panel
        cy.getElementByTestId('variableManagementPanel').find('button').contains('Close').click();

        // Verify the variable is removed from the bar
        cy.getElementByTestId('variable-region').should('not.exist');
        // First variable should still exist
        cy.getElementByTestId('variable-env').should('be.visible');
      });
    });

    describe('Variable bar interactions', () => {
      it('should collapse and expand the variables bar', () => {
        cy.getElementByTestId('toggleVariablesBarButton').click();

        // Variables should be hidden
        cy.getElementByTestId('variable-env').should('not.exist');

        // Expand again
        cy.getElementByTestId('toggleVariablesBarButton').click();
        cy.getElementByTestId('variable-env').should('be.visible');
      });

      it('should hide a variable using the management panel', () => {
        cy.getElementByTestId('manageVariablesButton').click();
        cy.getElementByTestId('variableManagementPanel').should('be.visible');

        // Click hide on the variable
        cy.getElementByTestId('variableManagementPanel')
          .find('[aria-label="Hide variable"]')
          .first()
          .click();

        // Close the management panel
        cy.getElementByTestId('variableManagementPanel').find('button').contains('Close').click();

        // Verify variable is hidden from the bar
        cy.getElementByTestId('variable-env').should('not.exist');

        // Re-show the variable for subsequent tests
        cy.getElementByTestId('manageVariablesButton').click();
        cy.getElementByTestId('variableManagementPanel')
          .find('[aria-label="Show variable"]')
          .first()
          .click();
        cy.getElementByTestId('variableManagementPanel').find('button').contains('Close').click();
        cy.getElementByTestId('variable-env').should('be.visible');
      });
    });

    describe('Variable editor validation', () => {
      it('should show error when saving without a name', () => {
        openVariableEditor();
        selectCustomType();

        // Try to save without name but with an option
        addCustomOption(0, 'value1');
        saveVariable();

        // Should show error
        cy.getElementByTestId('variableEditorPanel').should(
          'contain.text',
          'Variable name is required'
        );

        cy.getElementByTestId('variableEditorCancel').click();
      });

      it('should show error for invalid variable name', () => {
        openVariableEditor();
        // Type an invalid name (starts with number)
        cy.getElementByTestId('variableEditorName').type('123invalid');
        selectCustomType();
        addCustomOption(0, 'value1');
        saveVariable();

        // Should show error about name format
        cy.getElementByTestId('variableEditorPanel').should(
          'contain.text',
          'must start with a letter or underscore'
        );

        cy.getElementByTestId('variableEditorCancel').click();
      });

      it('should show error for duplicate variable name', () => {
        openVariableEditor();
        // Type existing variable name
        cy.getElementByTestId('variableEditorName').type('env');
        selectCustomType();
        addCustomOption(0, 'value1');
        saveVariable();

        // Should show conflict error
        cy.getElementByTestId('variableEditorPanel').should('contain.text', 'conflicts');

        cy.getElementByTestId('variableEditorCancel').click();
      });

      it('should show error when custom type has no options', () => {
        openVariableEditor();
        cy.getElementByTestId('variableEditorName').type('empty_var');
        selectCustomType();
        // Don't add any options
        saveVariable();

        // Should show error about custom values
        cy.getElementByTestId('variableEditorPanel').should(
          'contain.text',
          'Custom values are required'
        );

        cy.getElementByTestId('variableEditorCancel').click();
      });
    });

    describe('Create query variable', () => {
      it('should create a query variable with value field and label field', () => {
        openVariableEditor();
        cy.getElementByTestId('variableEditorName').type('user');

        // Query is the default type — open the query editor modal.
        openQueryEditorModal();

        // Select the test dataset (default language is PPL).
        selectDatasetInModal(INDEX_WITH_TIME_1);

        // Type a PPL query in the modal's Monaco editor.
        typeInModalEditor(`SOURCE = ${INDEX_WITH_TIME_1} | fields personal.name, personal.user_id`);

        // Preview to load available fields.
        previewInModal();

        // Value/label fields are EuiComboBox now (not native <select>).
        selectModalComboBoxOption('variableEditorValueField', 'personal.user_id');
        selectModalComboBoxOption('variableEditorLabelField', 'personal.name');

        // Preview again with the selected fields, then verify results appear.
        previewInModal();
        cy.getElementByTestId('queryEditorModalPreviewPanel').should(
          'contain.text',
          'Preview of values'
        );

        // Apply the query (closes the modal and returns to the variable editor).
        applyModal();

        // Save the variable.
        saveVariable();

        // Wait for query execution to load options.
        cy.wait(5000);

        // Verify variable appears in the bar.
        cy.getElementByTestId('variable-user').should('be.visible');
      });

      it('should display label field values (names) in the selector', () => {
        // Open the selector
        cy.getElementByTestId('variable-user')
          .find('[data-test-subj="variable-selector-button"]')
          .click();
        cy.wait(1000);

        // Verify options exist (labels should be personal.name values)
        cy.get('[role="option"]').should('have.length.at.least', 3);

        // Select an option
        cy.get('[role="option"]').first().click();
        cy.wait(500);

        // Verify a value is selected (displayed text should be a name)
        cy.getElementByTestId('variable-user').within(() => {
          cy.getElementByTestId('variable-selector-current').invoke('text').should('not.be.empty');
        });
      });
    });

    describe('Multi-select variable', () => {
      it('should create a multi-select custom variable with include all', () => {
        openVariableEditor();
        cy.getElementByTestId('variableEditorName').type('tags');
        selectCustomType();
        addCustomOption(0, 'critical', 'Critical');
        addCustomOption(1, 'warning', 'Warning');
        addCustomOption(2, 'info', 'Info');

        // Enable multi-select
        cy.getElementByTestId('variableEditorMulti').click();
        // Enable include all
        cy.getElementByTestId('variableEditorIncludeAll').click();

        saveVariable();

        // Verify variable appears
        cy.getElementByTestId('variable-tags').should('be.visible');
      });

      it('should allow selecting multiple values', () => {
        // Open the selector
        cy.getElementByTestId('variable-tags')
          .find('[data-test-subj="variable-selector-button"]')
          .click();

        // Select multiple options
        cy.get('[role="option"]').contains('Critical').click();
        cy.get('[role="option"]').contains('Warning').click();

        // Close popover by clicking outside
        cy.get('body').click(0, 0);

        // Verify badge shows count
        cy.getElementByTestId('variable-tags').find('.euiBadge').should('exist');
      });
    });
  });
};

prepareTestSuite('Dashboard Variables', runDashboardVariableTests);
