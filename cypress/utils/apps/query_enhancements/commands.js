/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('setSingleLineQueryEditor', (value, submit = true) => {
  const opts = { log: false };

  Cypress.log({
    name: 'setSingleLineQueryEditor',
    displayName: 'set query',
    message: value,
  });

  cy.getElementByTestId('osdQueryEditor__singleLine', opts).type(value, opts);

  if (submit) {
    cy.updateTopNav(opts);
  }
});

Cypress.Commands.add('setQueryLanguage', (value) => {
  Cypress.log({
    name: 'setQueryLanguage',
    displayName: 'set language',
    message: value,
  });

  cy.getElementByTestId(`queryEditorLanguageSelector`).click();
  cy.get(`[class~="languageSelector__menuItem"]`).contains(value).click({
    force: true,
  });
});

/**
 * Creates a new data source connection with basic auth
 * @param {Object} options Configuration options for the data source
 * @param {string} options.name The name/title for the data source
 * @param {string} options.url The endpoint URL for the data source
 * @param {string} options.authType The authentication type (e.g. 'no_auth', 'basic_auth', etc.)
 * @param {Object} [options.credentials] Optional credentials for auth types that require them
 * @param {string} [options.credentials.username] Username for basic auth
 * @param {string} [options.credentials.password] Password for basic auth
 */
Cypress.Commands.add('addDataSource', (options) => {
  const { name, url, authType = 'no_auth', credentials = {} } = options;

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
  });

  // Verify redirect to data sources list page
  cy.location('pathname', { timeout: 6000 }).should(
    'include',
    'app/management/opensearch-dashboards/dataSources'
  );
});

Cypress.Commands.add('deleteDataSourceByName', (dataSourceName) => {
  // Navigate to the dataSource Management page
  cy.visit('app/dataSources');

  // Find the anchor text correpsonding to specified dataSource
  cy.get('a').contains(dataSourceName).click();

  // Delete the dataSource connection
  cy.getElementByTestId('editDatasourceDeleteIcon').click();
  cy.getElementByTestId('confirmModalConfirmButton').click();
});
