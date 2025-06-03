/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  APPLIED_FILTERS,
  APPLIED_SORT_API,
  generateSavedTestConfiguration,
  SELECTED_FIELD_COLUMNS,
  setSearchConfigurations,
  verifyDiscoverPageState,
} from '../query_enhancements/saved';
import {
  DatasetTypes,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  QueryLanguages,
} from '../query_enhancements/constants';
import { setDatePickerDatesAndSearchIfRelevant } from '../query_enhancements/shared';
import { openShareMenuWithRetry } from '../query_enhancements/shared_links';

/**
 * Returns the API body that is needed when creating a saved explore directly through an API call
 * @param {SavedTestConfig} config - language + dataset permutation configuration
 * @param {string} workspaceId - workspace ID
 * @param {string} datasourceId - datasource ID
 * @param {string} indexPatternId - index pattern ID
 * @returns {object}
 */
const getSavedObjectPostBody = (config, workspaceId, datasourceId, indexPatternId) => {
  return {
    attributes: {
      title: config.saveName,
      description: '',
      hits: 0,
      columns: config.selectFields ? SELECTED_FIELD_COLUMNS : undefined,
      sort: config.sort ? APPLIED_SORT_API : undefined,
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: `{"query":{"query":"${config.queryString}","language":"${
          config.apiLanguage
        }","dataset":${`{"id":"${
          config.datasetType === DatasetTypes.INDEX_PATTERN.name
            ? indexPatternId
            : `${datasourceId}::${config.dataset}`
        }","timeFieldName":"timestamp","title":"${config.dataset}","type":"${
          config.datasetType
        }"}`}},"highlightAll":true,"version":true,"aggs":{"2":{"date_histogram":{"field":"timestamp","calendar_interval":"1w","time_zone":"America/Los_Angeles","min_doc_count":1}}},"filter":[{"$state":{"store":"appState"},"meta":{"alias":null,"disabled":false,"key":"${
          APPLIED_FILTERS.field
        }","negate":false,"params":["${APPLIED_FILTERS.value}"],"type":"phrases","value":"${
          APPLIED_FILTERS.value
        }","indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.filter[0].meta.index"},"query":{"bool":{"minimum_should_match":1,"should":[{"match_phrase":{"${
          APPLIED_FILTERS.field
        }":"${
          APPLIED_FILTERS.value
        }"}}]}}}],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}`,
      },
    },
    references: [
      {
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
        id: indexPatternId,
      },
      {
        name: 'kibanaSavedObjectMeta.searchSourceJSON.filter[0].meta.index',
        type: 'index-pattern',
        id: indexPatternId,
      },
    ],
    workspaces: [workspaceId],
  };
};

/**
 * send a POST request to API to create a saved explore object
 * @param {SavedTestConfig} config - the relevant config for the test case
 */
export const postRequestSaveExplore = (config) => {
  cy.get('@WORKSPACE_ID').then((workspaceId) => {
    cy.get('@DATASOURCE_ID').then((datasourceId) => {
      cy.get('@INDEX_PATTERN_ID').then((indexPatternId) => {
        // POST a saved search
        cy.request({
          method: 'POST',
          url: `/w/${workspaceId}/api/saved_objects/explore?overwrite=true`,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'osd-xsrf': true,
          },
          body: getSavedObjectPostBody(config, workspaceId, datasourceId, indexPatternId),
          failOnStatusCode: false,
        });
      });
    });
  });
};

/**
 * Loads a saved search and updates it and verify that it is correct
 * @param {SavedTestConfig} config - the relevant config for the test case
 * @param {string} workspaceName - the name of the workspace
 * @param {string} datasourceName - the name of the datasource
 * @param {boolean} saveAsNew - flag to determine whether to overwrite the saved search (false) or save as a new saved search (true)
 */
export const updateSavedSearchAndSaveAndVerify = (
  config,
  workspaceName,
  datasourceName,
  saveAsNew
) => {
  cy.loadSaveSearch(config.saveName);

  // Change the dataset type to use
  const [newDataset, newDatasetType] =
    config.datasetType === DatasetTypes.INDEX_PATTERN.name
      ? [INDEX_WITH_TIME_1, DatasetTypes.INDEXES.name]
      : [INDEX_PATTERN_WITH_TIME, DatasetTypes.INDEX_PATTERN.name];
  const newConfig = generateSavedTestConfiguration(newDataset, newDatasetType, QueryLanguages.PPL);

  cy.setDataset(newConfig.dataset, datasourceName, newConfig.datasetType);
  cy.setQueryLanguage(newConfig.language);
  setDatePickerDatesAndSearchIfRelevant(newConfig.language);
  setSearchConfigurations({
    ...newConfig,
    // only select field if previous config did not select it, because otherwise it is already selected
    selectFields: !config.selectFields ? newConfig.selectFields : false,
  });
  const saveNameToUse = saveAsNew ? newConfig.saveName : config.saveName;
  cy.saveSearch(saveNameToUse, saveAsNew);

  // Load updated saved search and verify
  cy.getElementByTestId('discoverNewButton').click();
  // wait for the new tab to load
  cy.getElementByTestId('loadingSpinnerText').should('not.exist');

  cy.loadSaveSearch(saveNameToUse);

  setDatePickerDatesAndSearchIfRelevant(newConfig.language);
  verifyDiscoverPageState(newConfig);
};

export const updateSavedSearchAndNotSaveAndVerify = (config, datasourceName) => {
  cy.loadSaveSearch(config.saveName);

  // Change the dataset type to use
  const [newDataset, newDatasetType] =
    config.datasetType === DatasetTypes.INDEX_PATTERN.name
      ? [INDEX_WITH_TIME_1, DatasetTypes.INDEXES.name]
      : [INDEX_PATTERN_WITH_TIME, DatasetTypes.INDEX_PATTERN.name];
  const newConfig = generateSavedTestConfiguration(newDataset, newDatasetType, QueryLanguages.PPL);

  cy.setDataset(newConfig.dataset, datasourceName, newConfig.datasetType);
  cy.setQueryLanguage(newConfig.language);
  setDatePickerDatesAndSearchIfRelevant(newConfig.language);
  setSearchConfigurations({
    ...newConfig,
    // only select field if previous config did not select it, because otherwise it is already selected
    selectFields: !config.selectFields ? newConfig.selectFields : false,
  });

  // Verify the snapshot url contain the updates
  openShareMenuWithRetry();
  cy.getElementByTestId('copyShareUrlButton')
    .invoke('attr', 'data-share-url')
    .then((url) => {
      cy.getElementByTestId('discoverNewButton').click();
      cy.get('h1').contains('New search').should('be.visible');
      cy.visit(url);
    });
  verifyDiscoverPageState(newConfig);

  // Verify the original save is unchanged
  cy.loadSaveSearch(config.saveName);

  setDatePickerDatesAndSearchIfRelevant(config.language);
  verifyDiscoverPageState(config);
};
