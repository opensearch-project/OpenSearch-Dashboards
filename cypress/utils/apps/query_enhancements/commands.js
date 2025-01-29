/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('setQueryEditor', (value, opts = {}, submit = true) => {
  Cypress.log({
    name: 'setQueryEditor',
    displayName: 'set query',
    message: value,
  });

  // On a new session, a syntax helper popover appears, which obstructs the typing within the query
  // editor. Clicking on a random element removes the popover.
  cy.getElementByTestId('headerGlobalNav').click();

  // clear the editor first and then set
  cy.get('.globalQueryEditor .react-monaco-editor-container')
    .click()
    .focused()
    .type('{ctrl}a')
    .type('{backspace}')
    .type('{meta}a')
    .type('{backspace}')
    .type(value, opts);

  if (submit) {
    cy.updateTopNav({ log: false });
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
 * It also saves the created data source's id to the alias @DATASOURCE_ID
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
    // save the created data source ID as an alias
    cy.wrap(interception.response.body.id).as('DATASOURCE_ID');
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

  // Find the anchor text corresponding to specified dataSource
  cy.get('a').contains(dataSourceName).click();

  // Delete the dataSource connection
  cy.getElementByTestId('editDatasourceDeleteIcon').click();
  cy.getElementByTestId('confirmModalConfirmButton').click();
});

// Deletes all data sources. This command should only be used for convenience during development
// and should never be used in production
Cypress.Commands.add('deleteAllDataSources', () => {
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

Cypress.Commands.add('setIndexAsDataset', (index, dataSourceName, language) => {
  cy.getElementByTestId('datasetSelectorButton').should('be.visible').click();
  cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
  cy.get(`[title="Indexes"]`).click();
  cy.get(`[title="${dataSourceName}"]`).click();
  // this element is sometimes dataSourceName masked by another element
  cy.get(`[title="${index}"]`).should('be.visible').click({ force: true });
  cy.getElementByTestId('datasetSelectorNext').click();

  if (language) {
    cy.getElementByTestId('advancedSelectorLanguageSelect').select(language);
  }

  cy.getElementByTestId('advancedSelectorTimeFieldSelect').select('timestamp');
  cy.getElementByTestId('advancedSelectorConfirmButton').click();

  // verify that it has been selected
  cy.getElementByTestId('datasetSelectorButton').should(
    'contain.text',
    `${dataSourceName}::${index}`
  );
});

Cypress.Commands.add('setIndexPatternAsDataset', (indexPattern, dataSourceName) => {
  cy.getElementByTestId('datasetSelectorButton').should('be.visible').click();
  cy.get(`[title="${dataSourceName}::${indexPattern}"]`).click();

  // verify that it has been selected
  cy.getElementByTestId('datasetSelectorButton').should(
    'contain.text',
    `${dataSourceName}::${indexPattern}`
  );
});

Cypress.Commands.add('setDataset', (dataset, dataSourceName, type) => {
  switch (type) {
    case 'INDEX_PATTERN':
      cy.setIndexPatternAsDataset(dataset, dataSourceName);
      break;
    case 'INDEXES':
      cy.setIndexAsDataset(dataset, dataSourceName);
      break;
    default:
      throw new Error(`setIndexPatternAsDataset encountered unknown type: ${type}`);
  }
});

Cypress.Commands.add('setQuickSelectTime', (direction, time, timeUnit) => {
  cy.getElementByTestId('superDatePickerToggleQuickMenuButton').click();
  cy.get('[aria-label="Time tense"]').select(direction);
  cy.get('[aria-label="Time value"]').clear().type(time);
  cy.get('[aria-label="Time unit"]').select(timeUnit);
  cy.get('.euiButton').contains('Apply').click();
});

Cypress.Commands.add('setRelativeTopNavDate', (time, timeUnit) => {
  const opts = { log: false };

  /* Find any one of the two buttons that change/open the date picker:
   *   * if `superDatePickerShowDatesButton` is found, it will switch the mode to dates
   *      * in some versions of OUI, the switch will open the date selection dialog as well
   *   * if `superDatePickerstartDatePopoverButton` is found, it will open the date selection dialog
   */
  cy.getElementsByTestIds(
    ['superDatePickerstartDatePopoverButton', 'superDatePickerShowDatesButton'],
    opts
  )
    .should('be.visible')
    .invoke('attr', 'data-test-subj')
    .then((testId) => {
      cy.getElementByTestId(testId, opts).should('be.visible').click(opts);
    });

  /* While we surely are in the date selection mode, we don't know if the date selection dialog
   * is open or not. Looking for a tab and if it is missing, click on the dialog opener.
   */
  cy.whenTestIdNotFound('superDatePickerAbsoluteTab', () => {
    cy.getElementByTestId('superDatePickerstartDatePopoverButton', opts)
      .should('be.visible')
      .click(opts);
  });

  // Click absolute tab
  cy.getElementByTestId('superDatePickerRelativeTab', opts).click(opts);

  cy.getElementByTestId('superDatePickerRelativeDateInputNumber').clear().type(time);
  cy.getElementByTestId('superDatePickerRelativeDateInputUnitSelector').select(timeUnit);
  cy.getElementByTestId('querySubmitButton').click();
});
