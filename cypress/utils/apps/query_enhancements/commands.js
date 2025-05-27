/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const forceFocusEditor = () => {
  return cy
    .get('.globalQueryEditor .react-monaco-editor-container')
    .click({ force: true })
    .wait(200) // Give editor time to register focus
    .get('.inputarea')
    .focus()
    .wait(200); // Wait for focus to take effect
};

const clearMonacoEditor = () => {
  return cy
    .get('.globalQueryEditor .react-monaco-editor-container')
    .should('exist')
    .should('be.visible')
    .then(() => {
      // First ensure we have focus
      return forceFocusEditor().then(() => {
        // Try different key combinations for selection
        return cy
          .get('.inputarea')
          .type('{ctrl}a', { force: true })
          .wait(100)
          .type('{backspace}', { force: true })
          .wait(100)
          .type('{meta}a', { force: true })
          .wait(100)
          .type('{backspace}', { force: true });
      });
    });
};

const isEditorEmpty = () => {
  return cy
    .get('.globalQueryEditor .react-monaco-editor-container')
    .find('.view-line')
    .invoke('text')
    .then((text) => text.trim() === '');
};

Cypress.Commands.add('clearQueryEditor', () => {
  const clearWithRetry = (attempt = 1) => {
    cy.log(`Attempt ${attempt} to clear editor`);

    return forceFocusEditor()
      .then(() => clearMonacoEditor())
      .then(() => {
        return isEditorEmpty().then((isEmpty) => {
          cy.log(`is editor empty: ${isEmpty}`);

          if (isEmpty) {
            return; // Editor is cleared, we're done
          }

          if (attempt < MAX_RETRIES) {
            cy.log(`Editor not cleared, retrying... (attempt ${attempt})`);
            cy.wait(RETRY_DELAY); // Wait before next attempt
            return clearWithRetry(attempt + 1);
          } else {
            cy.log('Failed to clear editor after all attempts');
            // Instead of throwing error, try one last time with extra waiting
            return cy.wait(2000).then(forceFocusEditor).then(clearMonacoEditor);
          }
        });
      });
  };

  return clearWithRetry();
});

Cypress.Commands.add('setQueryEditor', (value, options = {}) => {
  const defaults = {
    submit: true,
    escape: false,
  };

  const { submit = defaults.submit, escape = defaults.escape, ...typeOptions } = options;

  Cypress.log({
    name: 'setQueryEditor',
    displayName: 'set query',
    message: value,
  });

  // On a new session, a syntax helper popover appears, which obstructs the typing within the query
  // editor. Clicking on a random element removes the popover.
  cy.getElementByTestId('headerGlobalNav').should('be.visible').click();

  // clear the editor first and then set
  cy.clearQueryEditor().then(() => {
    return cy
      .get('.inputarea')
      .should('be.visible')
      .wait(200)
      .type(escape ? `${value}{esc}` : value, {
        delay: 40,
        force: true,
        ...typeOptions, // Pass through all other options to type command
      });
  });

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

  // adding wait here as sometimes the button clicks doesn't register
  cy.osd.wait();

  cy.getElementByTestId(`queryEditorLanguageSelector`).click();
  cy.get(`[class~="languageSelector__menuItem"]`).contains(value).click({
    force: true,
  });

  // Sometimes the syntax highlighter opens automatically. Closing it here if it does that
  cy.osd.wait();
  cy.get('body').then(($body) => {
    const popovers = $body.find('.euiPopoverTitle');

    for (const popover of popovers) {
      if (popover.textContent === 'Syntax options') {
        cy.getElementByTestId('languageReferenceButton').click();
      }
    }
  });
});

Cypress.Commands.add(
  'setIndexAsDataset',
  (index, dataSourceName, language, timeFieldName = 'timestamp', finalAction = 'submit') => {
    cy.getElementByTestId('datasetSelectorButton').should('be.visible').click();
    cy.getElementByTestId(`datasetSelectorAdvancedButton`).should('be.visible').click();
    cy.get(`[title="Indexes"]`).click();
    cy.get(`[title="${dataSourceName}"]`).click();
    // this element is sometimes dataSourceName masked by another element
    cy.get(`[title="${index}"]`).should('be.visible').click({ force: true });
    cy.getElementByTestId('datasetSelectorNext').should('be.visible').click();

    if (language) {
      cy.getElementByTestId('advancedSelectorLanguageSelect').should('be.visible').select(language);
    }

    cy.getElementByTestId('advancedSelectorTimeFieldSelect')
      .should('be.visible')
      .select(timeFieldName);

    if (finalAction === 'submit') {
      cy.getElementByTestId('advancedSelectorConfirmButton').should('be.visible').click();

      // verify that it has been selected
      cy.getElementByTestId('datasetSelectorButton').should(
        'contain.text',
        `${dataSourceName}::${index}`
      );
    } else {
      cy.get('[type="button"]').contains('Cancel').click();
    }
  }
);

Cypress.Commands.add('setIndexPatternAsDataset', (indexPattern, dataSourceName) => {
  cy.getElementByTestId('datasetSelectorButton').should('be.visible').click();
  cy.get(`[title="${dataSourceName}::${indexPattern}"]`).should('be.visible').click();

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

Cypress.Commands.add(
  'setIndexPatternFromAdvancedSelector',
  (indexPattern, dataSourceName, language, finalAction = 'submit') => {
    cy.getElementByTestId('datasetSelectorButton').should('be.visible').click();
    cy.getElementByTestId(`datasetSelectorAdvancedButton`).should('be.visible').click();
    cy.get(`[title="Index Patterns"]`).click();

    cy.getElementByTestId('datasetExplorerWindow')
      .find(`[title="${dataSourceName}::${indexPattern}"]`)
      .should('be.visible')
      .click({ force: true });
    cy.getElementByTestId('datasetSelectorNext').should('be.visible').click();

    if (language) {
      cy.getElementByTestId('advancedSelectorLanguageSelect').should('be.visible').select(language);
    }

    if (finalAction === 'submit') {
      cy.getElementByTestId('advancedSelectorConfirmButton').should('be.visible').click();

      // verify that it has been selected
      cy.getElementByTestId('datasetSelectorButton').should(
        'contain.text',
        `${dataSourceName}::${indexPattern}`
      );
    } else {
      cy.get('[type="button"]').contains('Cancel').click();
    }
  }
);

Cypress.Commands.add('setQuickSelectTime', (direction, time, timeUnit) => {
  cy.getElementByTestId('superDatePickerToggleQuickMenuButton').click();
  cy.get('[aria-label="Time tense"]').select(direction);
  cy.get('[aria-label="Time value"]').clear().type(time);
  cy.get('[aria-label="Time unit"]').select(timeUnit);
  cy.get('.euiButton').contains('Apply').click();
});
