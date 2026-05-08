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
        // Use simpler clearing methods to avoid trigger timeouts
        return cy
          .get('.inputarea')
          .clear({ force: true })
          .wait(100)
          .type('{selectAll}{del}', { force: true })
          .wait(100)
          .type('{ctrl+a}{backspace}', { force: true })
          .wait(100);
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
            // Instead of throwing error, try one last simple clear
            return cy
              .get('.inputarea')
              .clear({ force: true })
              .type('{selectAll}{del}', { force: true });
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

  cy.clearQueryEditor().then(() => {
    cy.get('.inputarea')
      .should('be.visible')
      .focus() // Ensure focus is set
      .wait(300) // Wait for clearing to settle
      .then(($editor) => {
        // Verify editor is truly empty before typing
        const content = $editor.val() || $editor.text() || '';
        cy.log(`Editor content before typing new query: "${content}"`);

        // If there's still content, do one final clear right before typing
        if (content.trim() !== '') {
          cy.log('Found residual content, doing final clear before typing');
          cy.get('.inputarea')
            .focus()
            .type('{selectAll}{del}', { force: true })
            .wait(100)
            .clear({ force: true })
            .wait(100);
        }
      });

    // Get the inputarea again and continue with typing
    cy.get('.inputarea')
      .focus() // Re-focus before typing
      .wait(200) // Give editor time to be ready
      .type(escape ? `${value}{esc}` : value, {
        delay: 50, // Slightly slower typing to ensure each character registers
        force: true,
        ...typeOptions,
      })
      .then(($editor) => {
        // Log what was actually typed for debugging
        const finalContent = $editor.val() || $editor.text() || '';
        cy.log(`Final editor content after typing: "${finalContent}"`);
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

    // Use the unified index selector - type to search and click from results
    cy.getElementByTestId('unified-index-selector-search')
      .should('be.visible')
      .click({ force: true })
      .clear()
      .type(index);

    // Wait for the dropdown to appear with results
    cy.getElementByTestId('unified-index-selector-dropdown').should('be.visible');

    // Click the matching index from the dropdown list
    cy.getElementByTestId('unified-index-selector-list')
      .should('be.visible')
      .within(() => {
        // Find and click the index by its label in the EuiSelectable
        cy.get(`[title="${index}"]`).should('be.visible').click({ force: true });
      });
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

Cypress.Commands.add(
  'setIndexPatternAsDataset',
  (indexPattern, dataSourceName, datasetEnabled = false) => {
    const title = datasetEnabled ? indexPattern : `${dataSourceName}::${indexPattern}`;
    cy.getElementByTestId('datasetSelectorButton').should('be.visible').click();

    // Wait for dropdown list to appear
    cy.get('.euiSelectableList').should('be.visible');

    cy.get(`[title="${title}"]`).should('be.visible').click();

    // verify that it has been selected
    cy.getElementByTestId('datasetSelectorButton').should('contain.text', `${title}`);
  }
);

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
    // Note: If only Index Patterns exist, the type selection will be hidden
    // Try to click Index Patterns if it exists, otherwise continue
    cy.get('body').then(($body) => {
      if ($body.find(`[title="Index Patterns"]`).length > 0) {
        cy.get(`[title="Index Patterns"]`).click();
      }
    });

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
