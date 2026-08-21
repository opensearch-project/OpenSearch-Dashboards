/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME, INDEX_WITH_TIME_1 } from '../../../../../utils/apps/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../utils/apps/explore/shared';
import { PROMETHEUS_CLUSTER } from '../../../../../utils/apps/explore/constants';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../utils/helpers';

const navigateToDashboardList = (workspaceName) => {
  cy.osd.navigateToWorkSpaceSpecificPage({
    workspaceName: workspaceName,
    page: 'dashboards',
    isEnhancement: true,
  });
};

const createAndSaveDashboard = (workspaceName, dashboardName) => {
  navigateToDashboardList(workspaceName);
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

  cy.wait(100);
  // Clear any existing content (cross-platform select-all + delete).
  cy.get('.inputarea')
    .first()
    .type('{esc}', { force: true })
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
  cy.getElementByTestId('queryEditorModalPreviewPanel', { timeout: 20000 }).should(
    'contain.text',
    'Preview of values'
  );
  cy.wait(300);
};

const applyModal = () => {
  cy.getElementByTestId('queryEditorModalApply').click();
  cy.getElementByTestId('queryEditorModal').should('not.exist');
};

// Value/label fields are EuiComboBox (single-select) — open and pick an option.
const selectModalComboBoxOption = (testId, optionText) => {
  cy.getElementByTestId(testId).click();
  cy.get('[role="option"]').contains(optionText).click({ force: true });
  cy.wait(300);
};

// --- PromQL query-type helpers (query editor modal) ---
const toggleModalLanguageToPromQL = () => {
  cy.getElementByTestId('variableQueryPanelLanguageToggle').click();
  // Options are keyed by language title: variableQueryPanelLanguageToggle-<title>.
  cy.getElementByTestId('variableQueryPanelLanguageToggle-PromQL').click({ force: true });
  cy.wait(500);
};

// PromQL query type is an EuiSuperSelect; pick by its display label
// (e.g. 'Label names', 'Label values', 'Metrics', 'Series query').
const selectPromqlQueryType = (displayLabel) => {
  cy.getElementByTestId('variableEditorPromqlQueryType').click();
  cy.get('[role="option"]').contains(displayLabel).click({ force: true });
  cy.wait(300);
};

// --- Prometheus data-connection + workspace setup (mirrors prometheus_dataset.spec.js) ---
const setupPrometheusConnection = (connectionName, prometheusUrl) => {
  const endpoint = Cypress.env('endpoint') || '';
  return cy
    .request({
      method: 'POST',
      url: `${endpoint}/api/directquery/dataconnections`,
      headers: { 'osd-xsrf': true, 'content-type': 'application/json' },
      body: {
        name: connectionName,
        allowedRoles: [],
        connector: 'prometheus',
        properties: { 'prometheus.uri': prometheusUrl },
      },
      failOnStatusCode: false,
    })
    .then((resp) => {
      if (resp.status !== 200 && resp.status !== 409) {
        cy.log(`Create data connection response: ${JSON.stringify(resp.body)}`);
      }
    });
};

const waitForPrometheusReady = (prometheusUrl, retries = 10, delay = 3000) => {
  const checkReady = (attempt) => {
    cy.request({
      method: 'GET',
      url: `${prometheusUrl}/api/v1/query`,
      qs: { query: 'prometheus_build_info' },
      failOnStatusCode: false,
    }).then((resp) => {
      if (resp.status === 200 && resp.body?.data?.result?.length > 0) {
        cy.log('Prometheus is ready');
      } else if (attempt < retries) {
        cy.wait(delay).then(() => checkReady(attempt + 1));
      } else {
        cy.log('Warning: Prometheus may not be fully ready, proceeding anyway');
      }
    });
  };
  checkReady(0);
};

const getPrometheusConnectionId = (connectionName) => {
  const endpoint = Cypress.env('endpoint') || '';
  return cy
    .request({
      method: 'GET',
      url: `${endpoint}/api/saved_objects/_find`,
      headers: { 'osd-xsrf': true },
      qs: { per_page: 10000, type: 'data-connection' },
    })
    .then((resp) => {
      const connection = resp.body?.saved_objects?.find(
        (savedObject) => savedObject.attributes.connectionId === connectionName
      );
      expect(connection).to.exist;
      return connection.id;
    });
};

const createPrometheusWorkspace = (name, dataConnectionId) => {
  const baseUrl = Cypress.env('endpoint') || Cypress.config('baseUrl') || '';
  // Reuse the shared workspace-creation command (the same one the PPL prep uses via
  // cy.osd.createWorkspaceWithDataSourceId) — just attach a data connection instead of a
  // data source, and store the id under the env key the osd navigate/delete commands read.
  return cy
    .createWorkspaceWithEndpoint(baseUrl, {
      name,
      features: ['use-case-observability'],
      settings: {
        permissions: {
          library_write: { users: ['%me%'] },
          write: { users: ['%me%'] },
        },
        dataSources: [],
        dataConnections: [dataConnectionId],
      },
    })
    .then((result) => {
      Cypress.env(`${name}:WORKSPACE_ID`, result.id);
      return result.id;
    });
};

export const runDashboardVariableTests = () => {
  const datasetId = getRandomizedDatasetId();
  const workspaceName = getRandomizedWorkspaceName();
  const dashboardName = 'variables-test-dashboard';

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
      createAndSaveDashboard(workspaceName, dashboardName);
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

  // PromQL query-type variables require a Prometheus data connection.
  const prometheusConfig = PROMETHEUS_CLUSTER;
  (!prometheusConfig.url ? describe.skip : describe)(
    'PromQL query type variables',
    { defaultCommandTimeout: 120000 },
    () => {
      const promqlWorkspaceName = getRandomizedWorkspaceName();
      const promqlDashboardName = 'promql-variables-test-dashboard';

      before(() => {
        setupPrometheusConnection(prometheusConfig.name, prometheusConfig.url);
        waitForPrometheusReady(prometheusConfig.url);
        getPrometheusConnectionId(prometheusConfig.name).then((id) =>
          createPrometheusWorkspace(promqlWorkspaceName, id)
        );

        createAndSaveDashboard(promqlWorkspaceName, promqlDashboardName);
        enterEditMode();
      });

      after(() => {
        cy.osd.deleteWorkspaceByNameUsingEndpoint(promqlWorkspaceName);
      });

      it('creates a "Label values" PromQL variable end-to-end', () => {
        openVariableEditor();
        cy.getElementByTestId('variableEditorName').type('promql_job');

        // Query is the default type — open the query editor modal.
        openQueryEditorModal();

        // Switch the modal language from PPL to PromQL.
        toggleModalLanguageToPromQL();

        // Select the Prometheus dataset in the modal's dataset picker.
        selectDatasetInModal(prometheusConfig.name);

        // Choose the "Label values" fill-in-the-blank query type.
        selectPromqlQueryType('Label values');

        // Pick a label every Prometheus target exposes. 'job'/'instance' always exist
        cy.getElementByTestId('variableEditorPromqlLabelValuesLabel')
          .find('input')
          .type('job', { force: true });
        cy.wait(300);
        cy.get('[role="option"]').contains('job').click({ force: true });
        cy.wait(300);

        // Preview loads the label values, then Apply + Save.
        previewInModal();
        cy.getElementByTestId('queryEditorModalPreviewPanel').should('be.visible');
        applyModal();
        saveVariable();
        cy.wait(3000);

        cy.getElementByTestId('variable-promql_job').should('be.visible');
      });

      it('creates a "Metrics" PromQL variable filtered by regex', () => {
        openVariableEditor();
        cy.getElementByTestId('variableEditorName').type('promql_metric');

        openQueryEditorModal();
        toggleModalLanguageToPromQL();
        selectDatasetInModal(prometheusConfig.name);
        selectPromqlQueryType('Metrics');

        // Metrics query type: optional RE2 regex on __name__ (anchored).
        cy.getElementByTestId('variableEditorPromqlMetricsRegex').type('prometheus_.*');
        cy.wait(300);

        previewInModal();
        cy.getElementByTestId('queryEditorModalPreviewPanel').should('be.visible');
        applyModal();
        saveVariable();
        cy.wait(3000);

        cy.getElementByTestId('variable-promql_metric').should('be.visible');
      });

      it('creates a "Label names" PromQL variable scoped by a metric regex', () => {
        openVariableEditor();
        cy.getElementByTestId('variableEditorName').type('promql_labelname');

        openQueryEditorModal();
        toggleModalLanguageToPromQL();
        selectDatasetInModal(prometheusConfig.name);
        selectPromqlQueryType('Label names');

        // Optional metric regex (anchored RE2 on __name__) to scope which metrics'
        // label names are returned. Match prometheus_* (CI fixture scrapes Prometheus itself).
        cy.getElementByTestId('variableEditorPromqlLabelNamesMetric').type('prometheus_.*');
        cy.wait(300);

        previewInModal();
        cy.getElementByTestId('queryEditorModalPreviewPanel').should('be.visible');
        applyModal();
        saveVariable();
        cy.wait(3000);

        cy.getElementByTestId('variable-promql_labelname').should('be.visible');
      });

      it('creates a "Series query" PromQL variable', () => {
        openVariableEditor();
        cy.getElementByTestId('variableEditorName').type('promql_series');

        openQueryEditorModal();
        toggleModalLanguageToPromQL();
        selectDatasetInModal(prometheusConfig.name);
        selectPromqlQueryType('Series query');

        // Series selector is required. 'up' is present on every Prometheus.
        cy.getElementByTestId('variableEditorPromqlSeriesMatcher').type('up');
        cy.wait(300);

        previewInModal();
        cy.getElementByTestId('queryEditorModalPreviewPanel').should('be.visible');
        applyModal();
        saveVariable();
        cy.wait(3000);

        cy.getElementByTestId('variable-promql_series').should('be.visible');
      });

      it('creates a "Query result (PromQL)" variable from a raw expression', () => {
        openVariableEditor();
        cy.getElementByTestId('variableEditorName').type('promql_result');

        openQueryEditorModal();
        toggleModalLanguageToPromQL();
        selectDatasetInModal(prometheusConfig.name);
        selectPromqlQueryType('Query result (PromQL)');

        // Raw PromQL expression; 'up' yields one series per scrape target.
        typeInModalEditor('up');

        previewInModal();
        // if the preview reports a value-field error, select one via variableEditorValueField.
        cy.getElementByTestId('queryEditorModalPreviewPanel').should('be.visible');
        applyModal();
        saveVariable();
        cy.wait(3000);

        cy.getElementByTestId('variable-promql_result').should('be.visible');
      });
    }
  );
};

prepareTestSuite('Dashboard Variables', runDashboardVariableTests);
