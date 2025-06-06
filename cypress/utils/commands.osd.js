/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { TestFixtureHandler } from '../lib/test_fixture_handler';
import initCommandNamespace from './command_namespace';
import { DATASOURCE_NAME, PATHS } from './constants';

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
  cy.contains('h1', 'Data sources', { timeout: 20000 }).should('be.visible');
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
  cy.osd.waitForLoader(true);
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

// Navigates to the workspace HomePage of a given workspace
cy.osd.add('navigateToWorkSpaceHomePage', (workspaceName) => {
  // Selecting the correct workspace
  cy.visit('/app/workspace_list#');
  cy.openWorkspaceDashboard(workspaceName);
  // wait until page loads
  if (Cypress.env('CYPRESS_RUNTIME_ENV') === 'osd') {
    cy.getElementByTestId('headerAppActionMenu').should('be.visible');
  } else {
    cy.getElementByTestId('breadcrumbs').should('be.visible');
  }
});

cy.osd.add(
  //navigate to workspace specific pages
  'navigateToWorkSpaceSpecificPage',
  (opts) => {
    const { workspaceName, page, isEnhancement = false } = opts;
    // Navigating to the WorkSpace Home Page
    cy.osd.navigateToWorkSpaceHomePage(workspaceName);

    // Check for toggleNavButton and handle accordingly
    // If collapsibleNavShrinkButton is shown which means toggleNavButton is already clicked, try clicking the app link directly
    // Using collapsibleNavShrinkButton is more robust than using toggleNavButton due to another toggleNavButton item on discover page
    cy.get('body').then(($body) => {
      const shrinkButton = $body.find('[data-test-subj="collapsibleNavShrinkButton"]');

      if (shrinkButton.length === 0) {
        cy.get('[data-test-subj="toggleNavButton"]').filter(':visible').first().click();
      }

      cy.getElementByTestId(`collapsibleNavAppLink-${page}`).should('exist').click();
    });

    cy.osd.waitForLoader(isEnhancement);
  }
);

cy.osd.add('wait', () => {
  cy.wait(Cypress.env('WAIT_MS'));
});

cy.osd.add('waitForLoader', (isEnhancement = false) => {
  const opts = { log: false };

  Cypress.log({
    name: 'waitForPageLoad',
    displayName: 'wait',
    message: 'page load',
  });

  // Use recentItemsSectionButton for query enhancement, otherwise use homeIcon
  cy.getElementByTestId(isEnhancement ? 'recentItemsSectionButton' : 'homeIcon', opts).should(
    'be.visible'
  );
});

cy.osd.add('grabDataSourceId', (workspaceName, dataSourceName) => {
  // IN OSD environment, we are grabbing the DATASOURCE_ID in addDataSource command.
  // In other environments, we need to grab it manually
  if (Cypress.env('CYPRESS_RUNTIME_ENV') !== 'osd') {
    cy.osd.navigateToWorkSpaceSpecificPage({
      workspaceName,
      page: 'dataSources',
      isEnhancement: true,
    });
    cy.get('span').contains(dataSourceName).click();
    cy.url().then(($url) => {
      const urlParts = $url.split('/');
      const dataSourceId = urlParts[urlParts.length - 1];
      cy.wrap(dataSourceId).as('DATASOURCE_ID');
    });
  }
});

cy.osd.add('grabIdsFromDiscoverPageUrl', () => {
  cy.url().then(($url) => {
    const workspaceIdMatch = $url.match(/\/w\/([^\/]+)\//);
    const datasourceIdMatch = $url.match(/dataSource:\(id:'?([0-9a-f-]+)'?,/);
    const indexPatternIdMatch = $url.match(/\),id:'?([0-9A-Za-z:_-]+)'?,/);

    if (workspaceIdMatch && workspaceIdMatch[1]) {
      cy.wrap(workspaceIdMatch[1]).as('WORKSPACE_ID');
    }
    if (datasourceIdMatch && datasourceIdMatch[1]) {
      cy.wrap(datasourceIdMatch[1]).as('DATASOURCE_ID');
    }
    if (indexPatternIdMatch && indexPatternIdMatch[1]) {
      cy.wrap(indexPatternIdMatch[1]).as('INDEX_PATTERN_ID');
    }
  });
});

cy.osd.add('deleteSavedObject', (type, id, options = {}) => {
  const url = `/api/saved_objects/${type}/${id}?force=true`;

  cy.request({
    method: 'DELETE',
    url,
    headers: {
      'osd-xsrf': true,
    },
    failOnStatusCode: false,
    ...options,
  });
});

cy.osd.add('deleteSavedObjectsByType', (workspaceId, type, search) => {
  const searchParams = new URLSearchParams({
    fields: 'id',
    type,
    workspaces: workspaceId,
  });
  if (search) {
    searchParams.set('search', search);
  }

  const url = `/api/opensearch-dashboards/management/saved_objects/_find?${searchParams.toString()}`;

  return cy.request(url).then((response) => {
    response.body.saved_objects.map(({ id }) => {
      cy.osd.deleteSavedObject(type, id);
    });
  });
});

cy.osd.add('deleteAllOldWorkspaces', () => {
  cy.visit('/app/workspace_list#/');
  cy.get('h1').contains('Workspaces').should('be.visible');

  cy.get('.application')
    .find('a')
    .then(($links) => {
      for (let i = 0; i < $links.length; i++) {
        const link = $links[i];
        const wsName = link.textContent;

        // If we have multiple pages of ws, then we do not want to select the links for the paginated results
        if (!wsName.includes('-')) {
          continue;
        }

        // the first portion of the ws name is the epoch time it was created in seconds,
        // see: getRandomizedWorkspaceName() util
        const epochTimeCreated = Number(wsName.split('-')[0]);

        if (!Number.isNaN(epochTimeCreated)) {
          const currentEpoch = moment().unix();
          const timeDiff = currentEpoch - epochTimeCreated;

          // if ws was created more than 1 hr ago, then delete it
          if (timeDiff > 3600) {
            cy.get('.application')
              .find('table input')
              // ignore first element as that is select all checkbox
              .eq(1 + i)
              .click();
          }
        }
      }
    });

  cy.get('.application').then(($application) => {
    const deleteButton = $application.find('[data-test-subj="multi-deletion-button"]');
    if (deleteButton.length) {
      cy.getElementByTestId('multi-deletion-button').click();
      cy.getElementByTestId('delete-workspace-modal-input').type('delete');
      cy.getElementByTestId('delete-workspace-modal-confirm').click();

      // wait until modal is gone
      cy.getElementByTestId('delete-workspace-modal-input').should('not.exist');
    }
  });
});

// this currently only works with data-logs-1. If we ever need data from data-logs-2, we should update this.
cy.osd.add('setupWorkspaceAndDataSourceWithIndices', (workspaceName, indices) => {
  // Load test data
  cy.osd.setupTestData(
    PATHS.SECONDARY_ENGINE,
    indices.map((index) => `cypress/fixtures/query_enhancements/data_logs_1/${index}.mapping.json`),
    indices.map((index) => `cypress/fixtures/query_enhancements/data_logs_1/${index}.data.ndjson`)
  );

  // Add data source
  cy.osd.addDataSource({
    name: DATASOURCE_NAME,
    url: PATHS.SECONDARY_ENGINE,
    authType: 'no_auth',
  });

  // delete any old workspaces and potentially conflicting one
  cy.deleteWorkspaceByName(workspaceName);
  cy.osd.deleteAllOldWorkspaces();

  // create workspace
  cy.visit('/app/home');
  cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);
});

// this currently only works with data-logs-1.
cy.osd.add('cleanupWorkspaceAndDataSourceAndIndices', (workspaceName, indices) => {
  cy.deleteWorkspaceByName(workspaceName);
  cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
  for (const index of indices) {
    cy.osd.deleteIndex(index);
  }
});

cy.osd.add('ensureTopNavExists', () => {
  const MAX_RETRY = 3;

  const getTopNavOrRetry = (attempt = 1) => {
    const opts = { log: false };

    cy.get('body', opts).then(($body) => {
      const superDatePickerstartDatePopoverButtonEl = $body.find(
        '[data-test-subj="superDatePickerstartDatePopoverButton"]'
      );
      const superDatePickerShowDatesButton = $body.find(
        '[data-test-subj="superDatePickerShowDatesButton"]'
      );

      if (
        !superDatePickerstartDatePopoverButtonEl.length &&
        !superDatePickerShowDatesButton.length
      ) {
        if (attempt < MAX_RETRY) {
          cy.log(`Top Nav not found, reloading and retrying... (attempt ${attempt})`);
          cy.reload();
          cy.wait(2000, opts);
          return getTopNavOrRetry(attempt + 1);
        } else {
          cy.log(`Failed to find Top Nav after attempting ${MAX_RETRY} times`);
        }
      }
    });
  };

  return getTopNavOrRetry();
});

cy.osd.add('setTopNavDate', (start, end, submit = true) => {
  cy.osd.ensureTopNavExists();

  const opts = { log: false };

  Cypress.log({
    name: 'setTopNavDate',
    displayName: 'set date',
    message: `Start: ${start} :: End: ${end}`,
  });

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
  cy.getElementByTestId('superDatePickerAbsoluteTab', opts).click(opts);

  // Type absolute start date
  cy.getElementByTestId('superDatePickerAbsoluteDateInput', opts)
    .click(opts)
    .clear(opts)
    .type(start, {
      ...opts,
      delay: 0, // add a delay here, cypress sometimes fails to type all the content into the input.
    });

  // Click end date
  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts).last(opts).click(opts);

  // Click absolute tab
  cy.getElementByTestId('superDatePickerAbsoluteTab', opts).last(opts).click(opts);

  // Type absolute end date
  cy.getElementByTestId('superDatePickerAbsoluteDateInput', opts)
    .last(opts)
    .click(opts)
    .clear(opts)
    .type(end, {
      ...opts,
      delay: 0, // add a delay here, cypress sometimes fails to type all the content into the input.
    });

  // Close popup
  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts).click(opts);

  if (submit) {
    cy.updateTopNav(opts);
  }
});

cy.osd.add('setRelativeTopNavDate', (time, timeUnit) => {
  cy.osd.ensureTopNavExists();

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

cy.osd.add('verifyResultsCount', (count) => {
  cy.getElementByTestId('discoverQueryRowsCount')
    .scrollIntoView()
    .should('be.visible')
    .should('have.text', count.toLocaleString());
});

cy.osd.add('verifyResultsError', (error) => {
  cy.getElementByTestId('queryResultError').click();
  cy.getElementByTestId('textBreakWord').contains(error);
});
