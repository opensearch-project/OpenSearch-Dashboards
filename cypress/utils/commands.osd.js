/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestFixtureHandler } from '../lib/test_fixture_handler';
import initCommandNamespace from './command_namespace';

/**
 * This file houses all the commands specific to OSD. For commands that are used across the project please move it to the general commands file
 */

initCommandNamespace(cy, 'osd');

cy.osd.add('createInitialWorkspaceWithDataSource', (dataSourceTitle, workspaceName) => {
  cy.intercept('POST', '/api/workspaces').as('createWorkspaceInterception');
  cy.getElementByTestId('workspace-initial-card-createWorkspace-button')
    .should('be.visible')
    .click();
  cy.getElementByTestId('workspace-initial-button-create-observability-workspace')
    .should('be.visible')
    .click();
  cy.getElementByTestId('workspaceForm-workspaceDetails-nameInputText')
    .should('be.visible')
    .type(workspaceName);
  cy.getElementByTestId('workspace-creator-dataSources-assign-button')
    .scrollIntoView()
    .should('be.visible')
    .click();
  cy.get(`.euiSelectableListItem[title="${dataSourceTitle}"]`)
    .should('be.visible')
    .trigger('click');
  cy.getElementByTestId('workspace-detail-dataSources-associateModal-save-button').click();
  cy.getElementByTestId('workspaceForm-bottomBar-createButton').should('be.visible').click();

  cy.wait('@createWorkspaceInterception').then((interception) => {
    // save the created workspace ID as an alias
    cy.wrap(interception.response.body.result.id).as('WORKSPACE_ID');
  });
  cy.contains(/successfully/);
});

cy.osd.add('deleteIndex', (indexName, options = {}) => {
  // This function should only run in OSD environment
  if (Cypress.env('CYPRESS_RUNTIME_ENV') !== 'osd') {
    return;
  }

  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('openSearchUrl')}/${indexName}`,
    failOnStatusCode: false,
    ...options,
  });
});

cy.osd.add('setupTestData', (endpoint, mappingFiles, dataFiles) => {
  // This function should only run in OSD environment
  if (Cypress.env('CYPRESS_RUNTIME_ENV') !== 'osd') {
    return;
  }

  if (!Array.isArray(mappingFiles) || !Array.isArray(dataFiles)) {
    throw new Error('Both mappingFiles and dataFiles must be arrays');
  }

  if (mappingFiles.length !== dataFiles.length) {
    throw new Error('The number of mapping files must match the number of data files');
  }

  const handler = new TestFixtureHandler(cy, endpoint);

  let chain = cy.wrap(null);
  mappingFiles.forEach((mappingFile, index) => {
    chain = chain
      .then(() => handler.importMapping(mappingFile))
      .then(() => handler.importData(dataFiles[index]));
  });

  return chain;
});

/**
 * Creates a new data source connection with basic auth
 * It also saves the created data source's id to the alias @DATASOURCE_ID
 * @param {Object} options Configuration options for the data source
 * @param {string} options.name The name/title for the data source
 * @param {string} options.url The endpoint URL for the data source
 * @param {string} options.authType The authentication type (e.g. 'no_auth', 'basic_auth', etc.)
 * @param {Object} [options.credentials] Optional credentials for auth types that require them
 * @param {string} [options.credentials.username] Username for basic auth
 * @param {string} [options.credentials.password] Password for basic auth
 */
cy.osd.add('addDataSource', (options) => {
  // This function should only run in OSD environment
  if (Cypress.env('CYPRESS_RUNTIME_ENV') !== 'osd') {
    return;
  }

  const { name, url, authType = 'no_auth', credentials = {} } = options;

  // in case the data source already exists, delete it first
  cy.osd.deleteDataSourceByName(name);

  // Visit the create data source page
  cy.visit('app/management/opensearch-dashboards/dataSources/create');

  // Intercept the create request to verify success
  cy.intercept('POST', '/api/saved_objects/data-source').as('createDataSourceRequest');

  // Select OpenSearch card
  cy.getElementByTestId('datasource_card_opensearch').click();

  // Fill in basic info
  cy.get('[name="dataSourceTitle"]').type(name);
  cy.get('[name="endpoint"]').type(url);

  // Select auth type
  cy.getElementByTestId('createDataSourceFormAuthTypeSelect').click();
  cy.get(`button[id="${authType}"]`).click();

  // Handle credentials if provided and required
  if (authType === 'basic_auth' && credentials.username && credentials.password) {
    cy.get('[name="username"]').type(credentials.username);
    cy.get('[name="password"]').type(credentials.password);
  }

  // Submit form. Adding 'force' as sometimes a popover hides the button
  cy.getElementByTestId('createDataSourceButton').click({ force: true });

  // Wait for successful creation
  cy.wait('@createDataSourceRequest').then((interception) => {
    expect(interception.response.statusCode).to.equal(200);
    // save the created data source ID as an alias
    cy.wrap(interception.response.body.id).as('DATASOURCE_ID');
  });

  // Verify redirect to data sources list page
  cy.location('pathname', { timeout: 6000 }).should(
    'include',
    'app/management/opensearch-dashboards/dataSources'
  );
});

cy.osd.add('deleteDataSourceByName', (dataSourceName) => {
  // This function should only run in OSD environment
  if (Cypress.env('CYPRESS_RUNTIME_ENV') !== 'osd') {
    return;
  }

  // Navigate to the dataSource Management page
  cy.visit('app/dataSources');
  cy.waitForLoader(true);
  cy.wait(2000);

  // Check if data source exists before trying to delete
  cy.get('body').then(($body) => {
    // First check if we're in empty state
    const hasEmptyState = $body.find('[data-test-subj="datasourceTableEmptyState"]').length > 0;

    if (hasEmptyState) {
      cy.log(`No data sources exist - skipping deletion of ${dataSourceName}`);
      return;
    }

    // Then check if our specific data source exists
    const dataSourceExists = $body.find(`a:contains("${dataSourceName}")`).length > 0;

    if (!dataSourceExists) {
      cy.log(`Data source ${dataSourceName} not found - skipping deletion`);
      return;
    }

    // If we get here, the data source exists and we can delete it
    cy.get('a').contains(dataSourceName).click();
    cy.getElementByTestId('editDatasourceDeleteIcon').should('be.visible').click();
    cy.getElementByTestId('confirmModalConfirmButton').should('be.visible').click();
  });
});

// Deletes all data sources. This command should only be used for convenience during development
// and should never be used in production
cy.osd.add('deleteAllDataSources', () => {
  // This function should only run in OSD environment
  if (Cypress.env('CYPRESS_RUNTIME_ENV') !== 'osd') {
    return;
  }

  cy.visit('app/dataSources');
  cy.waitForLoader(true);
  cy.wait(2000);

  cy.get('body').then(($body) => {
    const hasEmptyState = $body.find('[data-test-subj="datasourceTableEmptyState"]').length > 0;
    const hasDataSources = $body.find('[data-test-subj="checkboxSelectAll"]').length > 0;
    cy.log('hasEmptyState');
    cy.log(hasEmptyState);
    cy.log('hasDataSources');
    cy.log(hasDataSources);

    if (hasEmptyState) {
      cy.log('No data sources to delete');
    } else if (hasDataSources) {
      cy.log('Need to clean out data sources');
      cy.getElementByTestId('checkboxSelectAll')
        .should('exist')
        .should('not.be.disabled')
        .check({ force: true });

      cy.getElementByTestId('deleteDataSourceConnections').should('be.visible').click();

      cy.getElementByTestId('confirmModalConfirmButton').should('be.visible').click();
    }
  });
});
