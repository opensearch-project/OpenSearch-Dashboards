/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import initCommandNamespace from './command_namespace';

initCommandNamespace(cy, 'coreQe');

cy.coreQe.add('selectDataset', (title) => {
  cy.log(`Selecting dataset: ${title}`);

  cy.intercept('GET', '**/api/assistant/agent_config*', (req) => {
    req.continue((res) => {
      if (res.statusCode === 404) {
        res.send(200, { status: 'ok', data: {} });
      }
    });
  }).as('agentConfigRequest');

  cy.getElementByTestId('datasetSelectorButton').should('be.visible').click();
  cy.get('[data-test-subj^="datasetSelectorOption-"]').contains(title).click();
  cy.getElementByTestId('datasetSelectorButton').should('contain.text', title);
  cy.wait(1000);
});

cy.coreQe.add('selectDatasetAdvanced', (type, path, language, options = {}) => {
  const { shouldSubmit } = { ...{ shouldSubmit: true }, ...options };

  cy.getElementByTestId('datasetSelectorButton').should('be.visible').click();
  cy.getElementByTestId('datasetSelectorAdvancedButton').should('be.visible').click();
  cy.get(`[title="${type}"]`).should('be.visible').click();

  path.forEach((title) => {
    cy.getElementByTestId('datasetExplorerWindow')
      .find(`[title^="${title}"]`)
      .should('be.visible')
      .click({ force: true });
  });

  cy.getElementByTestId('datasetSelectorNext').should('be.visible').click({ force: true });
  cy.getElementByTestId('advancedSelectorLanguageSelect').should('be.visible').select(language);

  if (shouldSubmit) {
    cy.getElementByTestId('advancedSelectorConfirmButton').should('be.visible').click();
    return;
  }

  cy.getElementByTestId('advancedSelectorCancelButton')
    .should('be.visible')
    .contains('Cancel')
    .click();
});
