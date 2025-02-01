/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { TestFixtureHandler } from '../lib/test_fixture_handler';
import initCommandNamespace from './command_namespace';

initCommandNamespace(cy, 'osd');

// --- Typed commands --

Cypress.Commands.add('getElementByTestId', (testId, options = {}) => {
  return cy.get(`[data-test-subj="${testId}"]`, options);
});

Cypress.Commands.add('getElementByTestIdLike', (testId, options = {}) => {
  return cy.get(`[data-test-subj*="${testId}"]`, options);
});

Cypress.Commands.add('getElementsByTestIds', (testIds, options = {}) => {
  const selectors = [testIds].flat(Infinity).map((testId) => `[data-test-subj="${testId}"]`);
  return cy.get(selectors.join(','), options);
});

Cypress.Commands.add(
  'findElementByTestIdLike',
  { prevSubject: true },
  (subject, partialTestId, options = {}) => {
    return cy.wrap(subject).find(`[data-test-subj*="${partialTestId}"]`, options);
  }
);

Cypress.Commands.add(
  'findElementByTestId',
  { prevSubject: true },
  (subject, testId, options = {}) => {
    return cy.wrap(subject).find(`[data-test-subj="${testId}"]`, options);
  }
);

Cypress.Commands.add('whenTestIdNotFound', (testIds, callbackFn, options = {}) => {
  const selectors = [testIds].flat(Infinity).map((testId) => `[data-test-subj="${testId}"]`);
  cy.get('body', options).then(($body) => {
    if ($body.find(selectors.join(',')).length === 0) callbackFn();
  });
});

Cypress.Commands.add('deleteWorkspace', (workspaceName) => {
  cy.wait(3000);
  cy.getElementByTestId('workspace-detail-delete-button').should('be.visible').click();
  cy.getElementByTestId('delete-workspace-modal-body').should('be.visible');
  cy.getElementByTestId('delete-workspace-modal-input').type(workspaceName);
  cy.getElementByTestId('delete-workspace-modal-confirm').click();
  cy.contains(/successfully/);
});

// OSD-specific commands

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

cy.osd.add('openWorkspaceDashboard', (workspaceName) => {
  cy.getElementByTestId('workspace-select-button').should('exist').click();
  cy.getElementByTestId('workspace-menu-manage-button').should('exist').click();
  cy.get('.euiBasicTable')
    .find('tr')
    .filter((index, row) => {
      return Cypress.$(row).find('td').text().includes(workspaceName);
    })
    .find('a.euiLink')
    .click();
});

cy.osd.add('deleteIndex', (indexName, options = {}) => {
  // This function should only run in OSD environment
  if (Cypress.env('SOURCE_CODE') !== 'osd') {
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
  if (Cypress.env('SOURCE_CODE') !== 'osd') {
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
