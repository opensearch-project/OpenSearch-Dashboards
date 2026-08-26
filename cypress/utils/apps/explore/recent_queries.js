/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryLanguages } from './constants';

export const RecentQueriesDataTypes = {
  INDEX_PATTERN: {
    name: 'INDEX_PATTERN',
    supportedLanguages: [QueryLanguages.PPL],
  },
  INDEXES: {
    name: 'INDEXES',
    supportedLanguages: [QueryLanguages.PPL],
  },
};

export const BaseQuery = {
  INDEX_PATTERN: {
    PPL: {
      query: `source = `,
      where: ' | where ',
    },
  },
  INDEXES: {
    PPL: {
      query: `source = `,
      where: ' | where ',
    },
  },
};

export const TestQueries = ['bytes_transferred >', 'bytes_transferred < 8000'];

/**
 * Recent queries are a second view of the saved queries popover, reached from its "Recent queries"
 * option — the standalone footer button was retired so that saved *searches* and saved *queries*
 * stop competing for the same spot in the footer.
 */
export const openRecentQueries = () => {
  cy.getElementByTestId('queryPanelFooterSaveQueryButton').click({ force: true });
  cy.getElementByTestId('saved-query-management-recent-queries-button').click({ force: true });
};

// Toggling the trigger closes the popover outright; the back arrow would only return to the options.
export const closeRecentQueries = () => {
  cy.getElementByTestId('queryPanelFooterSaveQueryButton').click({ force: true });
};

/**
 * The configurations needed for recent queries tests
 * @typedef {Object} RecentQueriesFilteringTestConfig
 * @property {string} dataset - the dataset name to use
 * @property {QueryEnhancementDataset} datasetType - the type of dataset
 * @property {QueryEnhancementLanguage} language - the name of query language as it appears in the dashboard app
 * @property {string} testName - the phrase to add to the test case's title
 */
export const generateRecentQueriesTestConfiguration = (dataset, datasetType, language) => {
  const defaultQuery = '';
  const customDatasetType = RecentQueriesDataTypes[datasetType].name;
  return {
    dataset,
    datasetType: customDatasetType,
    language,
    alternativeDataset: '.kibana',
    defaultQuery: defaultQuery,
    testName: `dataset: ${datasetType} and language: ${language.name}`,
  };
};
