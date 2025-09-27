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

  if (options.timeFieldName) {
    cy.getElementByTestId('advancedSelectorTimeFieldSelect')
      .should('be.visible')
      .select(options.timeFieldName);
  }

  if (shouldSubmit) {
    cy.getElementByTestId('advancedSelectorConfirmButton').should('be.visible').click();
    return;
  }

  cy.getElementByTestId('advancedSelectorCancelButton')
    .should('be.visible')
    .contains('Cancel')
    .click();
});

cy.coreQe.add('setQueryEditor', (query, options = {}) => {
  const { shouldSubmit, shouldEscape } = {
    ...{ shouldSubmit: true, shouldEscape: false },
    ...options,
  };

  Cypress.log({
    name: 'setQueryEditor',
    displayName: 'set query',
    message: query,
  });

  cy.get('.inputarea').should('be.visible').clear({ force: true });

  cy.get('.inputarea')
    .should('be.visible')
    .wait(200)
    .type(`${query}${shouldEscape ? '{esc}' : ''}`, {
      delay: 50,
      force: true,
      ...options,
    });

  if (shouldSubmit) {
    cy.updateTopNav({ log: false });
  }
});
