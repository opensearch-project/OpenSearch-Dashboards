/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTypes, QueryLanguages } from './constants';

import {
  APPLIED_FILTERS,
  verifyDiscoverPageState as verifyDiscoverPageStateFromSaved,
} from './saved';

import { setDatePickerDatesAndSearchIfRelevant } from './shared';

/**
 * Error text when there is a name conflict when saving a query.
 * @constant
 * @type {string}
 * @default
 */
const SAVE_QUERY_CONFLICT_NAME_ERROR_TEXT = 'Name conflicts with an existing saved query';

/**
 * Suffix when saving as new query.
 * @constant
 * @type {string}
 * @default
 */
export const SAVE_AS_NEW_QUERY_SUFFIX = '-1';

/**
 * The Alternate Absolute Start Time to use for saved query
 * @constant
 * @type {string}
 * @default
 */
const ALTERNATE_START_TIME = 'Mar 21, 2021 @ 15:23:04.251';

/**
 * The Alternate Absolute End Time to use for saved query
 * @constant
 * @type {string}
 * @default
 */
const ALTERNATE_END_TIME = 'Aug 28, 2021 @ 15:38:14.646';

/**
 * The alternate filter configuration to use for saved query
 * @constant
 * @type {string}
 * @default
 */
export const ALTERNATE_APPLIED_FILTERS = {
  field: 'category',
  operator: 'is not one of',
  value: 'Database',
};

/**
 * Returns the query string to use for a given dataset+language that is different from the output of getQueryString function
 * @param {string} dataset - the dataset name to use
 * @param {QueryEnhancementLanguage} language - the name of query language
 * @returns {string}
 */
const getAlternateQueryString = (dataset, language) => {
  switch (language) {
    case QueryLanguages.PPL.name:
      return `source = ${dataset} | where bytes_transferred < 200`;
    default:
      throw new Error(`getQueryString encountered unsupported language: ${language}`);
  }
};

/**
 * Returns the expected hit count, if relevant, for the provided datasetType + language that is different from the output of getExpectedHitCount function
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguage} language - the query language name
 * @returns {number|undefined}
 */
const getAlternateExpectedHitCount = (datasetType, language) => {
  switch (datasetType) {
    case DatasetTypes.INDEX_PATTERN.name:
      switch (language) {
        case QueryLanguages.PPL.name:
          // TODO: Update this to 45 once Histogram is supported on 2.17
          return undefined;
        default:
          throw new Error(
            `getExpectedHitCount encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    case DatasetTypes.INDEXES.name:
      switch (language) {
        case QueryLanguages.PPL.name:
          // TODO: Update this to 50 once Histogram is supported on 2.17
          return undefined;
        default:
          throw new Error(
            `getExpectedHitCount encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    default:
      throw new Error(`getExpectedHitCount encountered unsupported datasetType: ${datasetType}`);
  }
};

/**
 * Returns an alternate SavedTestConfig
 * @param {SavedTestConfig} config - initial config that will be modified.
 * @returns {SavedTestConfig}
 */
const generateAlternateTestConfiguration = (config) => {
  const baseConfig = {
    dataset: config.dataset,
    datasetType: config.datasetType,
    language: config.language,
    apiLanguage: config.apiLanguage,
    saveName: config.saveName,
    testName: config.testName,
    startTime: ALTERNATE_START_TIME,
    endTime: ALTERNATE_END_TIME,
    filters: config.filters,
    histogram: config.histogram,
    selectFields: config.selectFields,
    sort: config.sort,
  };

  return {
    ...baseConfig,
    queryString: getAlternateQueryString(config.dataset, config.language),
    hitCount: getAlternateExpectedHitCount(config.datasetType, config.language),
  };
};

/**
 * Wrapper for verifyDiscoverPageState from saved.js that omits parameters not needed for saved queries
 * @param {Object} config - The configuration object
 */
export const verifyDiscoverPageState = (config) => {
  // Extract only the parameters needed for saved queries
  const { queryString, language, hitCount, filters, histogram, startTime, endTime } = config;

  // Call the imported function with only the parameters needed for saved queries
  // This ensures we don't pass dataset, selectFields, or sampleTableData
  verifyDiscoverPageStateFromSaved({
    queryString,
    language,
    hitCount,
    filters,
    histogram,
    startTime,
    endTime,
  });
};

/**
 * Verify that the discover page is in the correct state after loading a saved query have been run
 * @param {SavedTestConfig} testConfig - the relevant config for the test case
 */
export const verifyAlternateDiscoverPageState = ({
  queryString,
  language,
  hitCount,
  filters,
  histogram,
  startTime,
  endTime,
}) => {
  verifyDiscoverPageStateFromSaved({
    queryString,
    language,
    hitCount,
    histogram,
    startTime,
    endTime,
  });

  if (filters) {
    cy.getElementByTestId(
      `filter filter-enabled filter-key-${ALTERNATE_APPLIED_FILTERS.field} filter-value-${ALTERNATE_APPLIED_FILTERS.value} filter-unpinned filter-negated`
    ).should('exist');
  }

  if (startTime && endTime) {
    cy.getElementByTestId('discoverIntervalDateRange').contains(startTime).should('exist');
    cy.getElementByTestId('discoverIntervalDateRange').contains(endTime).should('exist');
  }
};

/**
 * Set the query configurations for the saved query
 * @param {SavedTestConfig} testConfig - the relevant config for the test case
 */
export const setQueryConfigurations = ({ filters, queryString, histogram }) => {
  if (filters) {
    cy.submitFilterFromDropDown(
      APPLIED_FILTERS.field,
      APPLIED_FILTERS.operator,
      APPLIED_FILTERS.value,
      true
    );
  }

  cy.explore.setQueryEditor(queryString, { parseSpecialCharSequences: false });

  if (histogram) {
    cy.getElementByTestId('discoverIntervalSelect').select('w');
  }
};

/**
 * Set the query configurations for the saved query
 * @param {SavedTestConfig} testConfig - the relevant config for the test case
 */
export const setAlternateQueryConfigurations = ({ filters, queryString, histogram }) => {
  if (filters) {
    cy.submitFilterFromDropDown(
      ALTERNATE_APPLIED_FILTERS.field,
      ALTERNATE_APPLIED_FILTERS.operator,
      ALTERNATE_APPLIED_FILTERS.value,
      true
    );
  }

  cy.explore.setQueryEditor(queryString, { parseSpecialCharSequences: false });

  if (histogram) {
    cy.getElementByTestId('discoverIntervalSelect').select('w');
  }
};

/**
 * Verify query does not exist in saved queries.
 * @param {string} deletedQueryName - Name of the query that should not exist.
 */
export const verifyQueryDoesNotExistInSavedQueries = (deletedQueryName) => {
  cy.reload();
  cy.wait(5000);
  cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
  cy.getElementByTestId('saved-query-management-open-button').click();
  cy.getElementByTestId('savedQueriesFlyoutBody').contains(deletedQueryName).should('not.exist');
  // Two references to two buttons layered over each other.
  cy.getElementByTestId('euiFlyoutCloseButton').first().click({ force: true });
};

/**
 * Update and save the saved query with alternate config, then verify has been updated correctly.
 *  @param {SavedTestConfig} config - the config for the test case to be updated
 */
export const updateAndVerifySavedQuery = (config) => {
  // Create alternate config
  const alternateConfig = generateAlternateTestConfiguration(config);
  cy.explore.loadSavedQuery(config.saveName);

  // wait for saved query to load
  cy.getElementByTestId('docTable').should('be.visible');

  if (alternateConfig.filters) {
    cy.deleteAllFilters();
  }

  setDatePickerDatesAndSearchIfRelevant(config.language, ALTERNATE_START_TIME, ALTERNATE_END_TIME);

  setAlternateQueryConfigurations(alternateConfig);
  verifyAlternateDiscoverPageState(alternateConfig);
  cy.explore.updateSavedQuery('', false, true, true);

  cy.reload();
  cy.wait(5000);
  cy.explore.loadSavedQuery(config.saveName);
  // wait for saved query to load
  cy.getElementByTestId('docTable').should('be.visible');
  verifyAlternateDiscoverPageState(alternateConfig);
};

/**
 * Save as new query, and validate that saving as an existing name leads to the correct error message.
 *  @param {string} matchingName - the name of an existing saved query
 */
export const validateSaveAsNewQueryMatchingNameHasError = (matchingName) => {
  cy.whenTestIdNotFound('saved-query-management-popover', () => {
    cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
  });
  cy.getElementByTestId('saved-query-management-save-button').click();

  cy.getElementByTestId('saveAsNewQueryCheckbox')
    .parent()
    .find('[class="euiCheckbox__label"]')
    .click();
  cy.getElementByTestId('saveQueryFormTitle').should('not.be.disabled').type(matchingName);

  // The force is necessary as there is occasionally a popover that covers the button
  cy.getElementByTestId('savedQueryFormSaveButton').click({ force: true });

  cy.contains(SAVE_QUERY_CONFLICT_NAME_ERROR_TEXT).should('be.visible');
  // Two references to two buttons layered over each other.
  cy.getElementByTestId('euiFlyoutCloseButton').first().click({ force: true });
};
