/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  QueryLanguages,
  INDEX_WITH_TIME_1,
  INDEX_PATTERN_WITH_TIME_1,
  DatasetTypes,
} from './constants';

// =======================================
// Common Utilities (Used across multiple autocomplete specs)
// =======================================

/**
 * Gets the dataset name based on the dataset type
 * @param {string} baseName - Base name of the dataset
 * @param {string} datasetType - Type of dataset (INDEX_PATTERN or INDEXES)
 * @returns {string} Formatted dataset name
 */
export const getDatasetName = (baseName, datasetType) => {
  return datasetType === DatasetTypes.INDEX_PATTERN.name ? `${baseName}*` : baseName;
};

/**
 * Types input and verifies expected suggestion appears in suggestion list
 * @param {string} input - Text to type
 * @param {string} expectedSuggestion - Expected suggestion to verify
 */
export const typeAndVerifySuggestion = (input, expectedSuggestion) => {
  if (input) {
    cy.get('.inputarea').type(input, { force: true });
  }
  cy.get('.suggest-widget')
    .should('be.visible')
    .within(() => {
      cy.get('.monaco-list-row').should('exist').contains(expectedSuggestion);
    });
};

/**
 * Finds and selects a specific suggestion from the suggestion list
 * @param {string} suggestionText - Text of suggestion to select
 */
export const selectSpecificSuggestion = (suggestionText) => {
  cy.get('.suggest-widget')
    .should('be.visible')
    .within(() => {
      cy.get('.monaco-list-row.focused').then(() => {
        cy.get('.monaco-list-row').then(($rows) => {
          const exactMatch = $rows.filter((_, row) => {
            return Cypress.$(row).attr('aria-label') === suggestionText;
          });

          if (exactMatch.length > 0) {
            cy.wrap(exactMatch).first().click();
            return;
          }
        });
      });
    });
};

/**
 * Types input, verifies suggestion exists, and selects it
 * @param {string} input - Text to type
 * @param {string} expectedSuggestion - Expected suggestion to verify and select
 */
export const typeAndSelectSuggestion = (input, expectedSuggestion) => {
  typeAndVerifySuggestion(input, expectedSuggestion);
  selectSpecificSuggestion(expectedSuggestion);
};

/**
 * Shows suggestions by clicking in the editor
 */
export const showSuggestions = () => {
  cy.get('.inputarea').click();
  cy.get('.suggest-widget').should('be.visible');
};

/**
 * Verifies all expected values appear in suggestion list
 * @param {string[]} expectedValues - Array of values to verify
 */
export const verifyFieldValues = (expectedValues) => {
  cy.get('.suggest-widget')
    .should('be.visible')
    .within(() => {
      expectedValues.forEach((value) => {
        cy.get('.monaco-list-row').should('contain', value);
      });
    });
};

// =======================================
// Autocomplete Query Spec Utilities
// =======================================

/**
 * Handles category field suggestions flow for query building
 * Used in createOtherQueryUsingAutocomplete and createDQLQueryUsingAutocomplete
 */
const handleCategoryFieldSuggestions = () => {
  const expectedCategoryValues = ['Application', 'Database', 'Network', 'Security'];
  typeAndSelectSuggestion('c', 'category');
  typeAndVerifySuggestion('', '=');
  selectSpecificSuggestion('=');
  verifyFieldValues(expectedCategoryValues);
  typeAndSelectSuggestion('App', 'Application');
};

/**
 * Gets language-specific configuration for query building
 * @param {string} language - Query language
 * @param {Object} config - Configuration object
 * @returns {Object} Language-specific configuration
 */
const getLanguageSpecificConfig = (language, config) => {
  const datasetName = getDatasetName('data_logs_small_time_1', config.datasetType);
  cy.log(`Dataset name for ${language} with type ${config.datasetType}: ${datasetName}`);

  switch (language) {
    case QueryLanguages.PPL.name:
      return {
        initialCommands: [
          { value: 'source', input: 's' },
          { value: '=' },
          { value: getDatasetName('data_logs_small_time_1', config.datasetType) },
          { value: '|' },
          { value: 'where', input: 'w' },
        ],
        editorType: 'osdQueryEditor__multiLine',
        andOperator: 'and',
      };
    case QueryLanguages.SQL.name:
      return {
        initialCommands: [
          { value: 'SELECT', input: 's' },
          { value: '*' },
          { value: 'FROM', input: 'f' },
          { value: getDatasetName('data_logs_small_time_1', config.datasetType) },
          { value: 'WHERE', input: 'w' },
        ],
        editorType: 'osdQueryEditor__multiLine',
        andOperator: 'AND',
      };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

/**
 * Creates a query using autocomplete for SQL/PPL languages
 * @param {Object} config - Query configuration object
 */
export const createOtherQueryUsingAutocomplete = (config) => {
  const langConfig = getLanguageSpecificConfig(config.language, config);

  cy.getElementByTestId(langConfig.editorType)
    .find('.monaco-editor')
    .should('be.visible')
    .should('have.class', 'vs')
    .wait(1000)
    .within(() => {
      // Handle initial language-specific setup
      langConfig.initialCommands.forEach((command) => {
        if (command.input) {
          typeAndSelectSuggestion(command.input, command.value);
        } else {
          typeAndVerifySuggestion('', command.value);
          selectSpecificSuggestion(command.value);
        }
      });

      handleCategoryFieldSuggestions();

      // Handle common ending pattern
      typeAndSelectSuggestion('a', langConfig.andOperator);
      typeAndVerifySuggestion('', 'bytes_transferred');
      selectSpecificSuggestion('bytes_transferred');

      if (config.language === QueryLanguages.SQL.name) {
        // Handle operator (different for SQL vs PPL)
        // TODO: SQL doesn't support operator suggestions yet except for '='
        cy.get('.inputarea').type('> ', { force: true });
      } else {
        typeAndVerifySuggestion('', '>');
        selectSpecificSuggestion('>');
      }

      cy.get('.inputarea').type('9500', { force: true });
    });
};

/**
 * Creates a DQL query using autocomplete
 */
export const createDQLQueryUsingAutocomplete = () => {
  cy.getElementByTestId('osdQueryEditor__singleLine')
    .find('.monaco-editor')
    .should('be.visible')
    .should('have.class', 'vs')
    .wait(1000)
    .within(() => {
      typeAndSelectSuggestion('c', 'category');
      const expectedCategoryValues = ['Application', 'Database', 'Network', 'Security'];
      verifyFieldValues(expectedCategoryValues);
      typeAndSelectSuggestion('App', 'Application');
      typeAndSelectSuggestion('a', 'and');
      typeAndVerifySuggestion('', 'bytes_transferred');
      selectSpecificSuggestion('bytes_transferred');
      typeAndVerifySuggestion('', '>');
      selectSpecificSuggestion('>');
      cy.get('.inputarea').type('9500', { force: true });
    });
};

// =======================================
// Autocomplete UI Spec Utilities
// =======================================

/**
 * Selects a suggestion using keyboard or mouse with retry logic
 * @param {string} suggestionText - Text of suggestion to select
 * @param {boolean} useKeyboard - Whether to use keyboard instead of mouse
 */
export const selectSuggestion = (suggestionText, useKeyboard = false) => {
  cy.log(`Selecting suggestion "${suggestionText}"`);
  const maxAttempts = 30;

  const findAndSelectSuggestion = (attempt = 0) => {
    if (attempt >= maxAttempts) {
      throw new Error(
        `Could not find suggestion "${suggestionText}" after ${maxAttempts} attempts`
      );
    }

    return cy.get('.monaco-list-row').then(($rows) => {
      const isVisible = $rows
        .toArray()
        .some((row) => Cypress.$(row).text().includes(suggestionText));

      if (isVisible) {
        if (useKeyboard) {
          const highlightedRow = $rows.filter('.focused').text();
          if (highlightedRow.includes(suggestionText)) {
            return cy.get('.inputarea').trigger('keydown', {
              key: 'Tab',
              keyCode: 9,
              which: 9,
              force: true,
            });
          }
        } else {
          return cy.get('.monaco-list-row').contains(suggestionText).click({ force: true });
        }
      }

      return cy
        .get('.inputarea')
        .type('{downarrow}', { force: true })
        .wait(50)
        .then(() => findAndSelectSuggestion(attempt + 1));
    });
  };

  cy.get('.suggest-widget')
    .should('exist')
    .should('be.visible')
    .should('have.class', 'visible')
    .then(() => {
      findAndSelectSuggestion(0);
    });
};

/**
 * Shows suggestion widget and waits for hint to appear with retry logic
 * @param {number} maxAttempts - Maximum number of retry attempts
 * @returns {Cypress.Chainable}
 */
export const showSuggestionAndHint = (maxAttempts = 3) => {
  let attempts = 0;

  const attemptShow = () => {
    attempts++;
    cy.get('.inputarea').type(' ', { force: true });

    return cy.get('.suggest-widget.visible').then(($widget) => {
      const isVisible = $widget.is(':visible');

      // Check for the default Monaco status bar
      let hasHint = false;

      // Look for the default Monaco status bar
      const statusBar = $widget.find('.suggest-status-bar');
      if (statusBar.length > 0) {
        hasHint = true;
      }

      if (!isVisible || !hasHint) {
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to show suggestion and hint after ${maxAttempts} attempts`);
        }
        return cy.wait(200).then(attemptShow);
      }
    });
  };

  return attemptShow();
};

/**
 * Hides suggestion widgets with retry logic
 * @param {number} maxAttempts - Maximum number of retry attempts
 * @returns {Cypress.Chainable}
 */
export const hideWidgets = (maxAttempts = 3) => {
  let attempts = 0;

  const attemptHide = () => {
    attempts++;
    cy.get('.inputarea').type('{esc}', { force: true });

    return cy.get('.suggest-widget').then(($widget) => {
      // sometimes when cypress interacts with editor, the visible class does not go away but the height is 0
      // that is sufficient
      if ($widget.height() === 0) {
        // The default Monaco status bar will be hidden automatically
        return;
      }

      if ($widget.hasClass('visible')) {
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to hide widgets after ${maxAttempts} attempts`);
        }
        return cy.wait(200).then(attemptHide);
      } else {
        // The default Monaco status bar will be hidden automatically
      }
    });
  };

  return attemptHide();
};

/**
 * Creates a query using either mouse or keyboard interactions
 * @param {Object} config - Query configuration
 * @param {boolean} useKeyboard - Whether to use keyboard instead of mouse
 */
export const createQuery = (config, useKeyboard = false) => {
  const editorType =
    config.language === QueryLanguages.DQL.name
      ? 'osdQueryEditor__singleLine'
      : 'osdQueryEditor__multiLine';

  cy.getElementByTestId(editorType)
    .find('.monaco-editor')
    .should('be.visible')
    .should('have.class', 'vs')
    .wait(1000)
    .within(() => {
      cy.get('.inputarea').type(' ', { force: true });
      if (config.language === QueryLanguages.PPL.name) {
        selectSuggestion('source', useKeyboard);
        selectSuggestion('=', useKeyboard);
        const dataset = getDatasetName('data_logs_small_time_1', config.datasetType);
        selectSuggestion(dataset, useKeyboard);
        selectSuggestion('|', useKeyboard);
        selectSuggestion('where', useKeyboard);
        selectSuggestion('unique_category', useKeyboard);
        selectSuggestion('=', useKeyboard);
        selectSuggestion('Configuration', useKeyboard);
      } else if (config.language === QueryLanguages.SQL.name) {
        selectSuggestion('SELECT', useKeyboard);
        selectSuggestion('*', useKeyboard);
        selectSuggestion('FROM', useKeyboard);
        selectSuggestion('data_logs_small_time_1', useKeyboard);
        selectSuggestion('WHERE', useKeyboard);
        selectSuggestion('unique_category', useKeyboard);
        selectSuggestion('=', useKeyboard);
        selectSuggestion('Configuration', useKeyboard);
      } else if (config.language === QueryLanguages.DQL.name) {
        selectSuggestion('unique_category', useKeyboard);
        selectSuggestion('Configuration', useKeyboard);
      }
    });
};

// =======================================
// Monaco Editor Parsing Utilities
// =======================================

/**
 * Verifies the query string in Monaco editor
 * The Monaco editor renders spaces using various Unicode whitespace characters and middle dot characters
 * This function handles all possible whitespace representations that might appear in the editor
 * @param {string} queryString - The query string to verify
 * @param {string} editorType - The editor type selector (e.g., 'osdQueryEditor__multiLine' or 'osdQueryEditor__singleLine')
 */
export const verifyMonacoEditorContent = (queryString, editorType) => {
  if (!queryString) return;

  // Escape special regex characters in the query string
  const escapedQueryString = queryString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // This comprehensive pattern handles all possible whitespace representations that might appear in the editor
  // including regular spaces, non-breaking spaces, middle dots, and other special characters used for spacing
  const pattern = new RegExp(
    escapedQueryString.replace(
      /\s+/g,
      '[\\s\\u00A0\\u00B7\\u2022\\u2023\\u25E6\\u2043\\u2219\\u22C5\\u30FB\\u00B7.·]+'
    )
  );

  // Check the editor content against our pattern
  cy.getElementByTestId(editorType)
    .find('.view-line')
    .first()
    .invoke('text')
    .then((text) => {
      expect(pattern.test(text)).to.be.true;
    });
};

// =======================================
// Test Configuration Generators
// =======================================

/**
 * Language configurations for different test scenarios
 */
export const LanguageConfigs = {
  SQL_PPL: {
    INDEX_PATTERN: [QueryLanguages.SQL, QueryLanguages.PPL],
    INDEXES: [QueryLanguages.SQL, QueryLanguages.PPL],
  },
  SQL_PPL_DQL: {
    INDEX_PATTERN: [QueryLanguages.DQL, QueryLanguages.SQL, QueryLanguages.PPL],
    INDEXES: [QueryLanguages.SQL, QueryLanguages.PPL],
  },
};

/**
 * Creates dataset types configuration for autocomplete tests
 * @param {Object} languageConfig - Language configuration object
 * @returns {Object} Dataset types configuration
 */
const createAutocompleteDatasetTypes = (languageConfig = LanguageConfigs.SQL_PPL) => ({
  INDEX_PATTERN: {
    name: 'INDEX_PATTERN',
    supportedLanguages: languageConfig.INDEX_PATTERN,
  },
  INDEXES: {
    name: 'INDEXES',
    supportedLanguages: languageConfig.INDEXES,
  },
});

export const AutocompleteDatasetTypes = createAutocompleteDatasetTypes();

// =======================================
// Test Configuration Generators and other common utilities
// =======================================

/**
 * Generates base test configuration for autocomplete tests
 * Used by: autocomplete_query.spec.js, autocomplete_switch.spec.js, autocomplete_ui.spec.js
 * @param {string} dataset - Dataset name
 * @param {string} datasetType - Type of dataset
 * @param {Object} language - Language configuration
 * @returns {Object} Test configuration object
 */
export const generateAutocompleteTestConfiguration = (dataset, datasetType, language) => {
  const baseConfig = {
    dataset,
    datasetType,
    language: language.name,
    testName: `${language.name}-${datasetType}`,
  };

  return {
    ...baseConfig,
  };
};

/**
 * Generates test configurations for autocomplete tests across different dataset types
 * Used by: autocomplete_query.spec.js, autocomplete_switch.spec.js, autocomplete_ui.spec.js
 * @param {Function} generateTestConfigurationCallback - Callback function to generate test config
 * @param {Object} options - Configuration options
 * @param {string} [options.indexPattern] - Custom index pattern name
 * @param {string} [options.index] - Custom index name
 * @param {Object} [options.languageConfig] - Custom language configuration
 * @returns {Array<Object>} Array of test configurations
 */
export const generateAutocompleteTestConfigurations = (
  generateTestConfigurationCallback,
  options = {}
) => {
  const {
    indexPattern = INDEX_PATTERN_WITH_TIME_1,
    index = INDEX_WITH_TIME_1,
    languageConfig = LanguageConfigs.SQL_PPL_DQL,
  } = options;

  const datasetTypes = createAutocompleteDatasetTypes(languageConfig);

  return Object.values(datasetTypes).flatMap((dataset) =>
    dataset.supportedLanguages.map((language) => {
      let datasetToUse;
      switch (dataset.name) {
        case datasetTypes.INDEX_PATTERN.name:
          datasetToUse = indexPattern;
          break;
        case datasetTypes.INDEXES.name:
          datasetToUse = index;
          break;
        default:
          throw new Error(
            `generateAutocompleteTestConfigurations encountered unsupported dataset: ${dataset.name}`
          );
      }
      return generateTestConfigurationCallback(datasetToUse, dataset.name, language);
    })
  );
};

/**
 * Validates query results by comparing field values with expected values using specified operator
 * Used by: autocomplete_query.spec.js, autocomplete_ui.spec.js
 * @param {string} field - The field name to validate
 * @param {number|string} expectedValue - The value to compare against
 * @param {string} [operator] - The operator to use for comparison ('>', '<', '=', or undefined for equality)
 */
export const validateQueryResults = (field, expectedValue, operator) => {
  // Expand the first row to view the field value
  cy.get('tbody tr').first().find('[data-test-subj="docTableExpandToggleColumn"] button').click();
  cy.getElementByTestId(`tableDocViewRow-${field}-value`).within(() => {
    cy.get('span')
      .invoke('text')
      .then((text) => {
        // For numeric comparisons (>, <, >=, <=)
        if (['>', '<', '>=', '<=', '='].includes(operator)) {
          const actualValue = parseFloat(text.replace(/,/g, ''));
          const numericExpectedValue = parseFloat(expectedValue.toString().replace(/,/g, ''));

          switch (operator) {
            case '>':
              expect(actualValue).to.be.greaterThan(numericExpectedValue);
              break;
            case '<':
              expect(actualValue).to.be.lessThan(numericExpectedValue);
              break;
            case '>=':
              expect(actualValue).to.be.at.least(numericExpectedValue);
              break;
            case '<=':
              expect(actualValue).to.be.at.most(numericExpectedValue);
              break;
            case '=':
              expect(actualValue).to.equal(numericExpectedValue);
              break;
          }
        } else {
          // For undefined, keep original string comparison
          expect(text).to.equal(expectedValue.toString());
        }
      });
  });
  // Close the expanded row
  cy.get('tbody tr').first().find('[data-test-subj="docTableExpandToggleColumn"] button').click();
};
