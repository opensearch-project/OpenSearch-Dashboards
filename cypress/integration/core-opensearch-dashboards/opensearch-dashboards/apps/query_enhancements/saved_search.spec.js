/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  END_TIME,
  START_TIME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  WORKSPACE_NAME,
  DatasetTypes,
  QueryLanguages,
} from './constants';
import { SECONDARY_ENGINE } from '../../../../../utils/constants';
import { v4 as uuid } from 'uuid';

const workspaceName = `${WORKSPACE_NAME}-${uuid().substring(0, 9)}`;
// datasource name must be 32 char or less
const datasourceName = `${DATASOURCE_NAME}-${uuid().substring(0, 18)}`;
let workspaceId = '';
let datasourceId = '';
let indexPatternId = '';

const SELECTED_FIELD_COLUMNS = ['bytes_transferred', 'personal.name'];
const APPLIED_SORT = [['bytes_transferred', 'desc']];
const APPLIED_FILTERS = {
  field: 'category',
  operator: 'is one of',
  value: 'Application',
};

// Returns the body that is needed when creating a saved search directly through API call
const getSavedObjectPostBody = (config) => {
  return {
    attributes: {
      title: config.saveName,
      description: '',
      hits: 0,
      columns: config.selectFields ? SELECTED_FIELD_COLUMNS : undefined,
      sort: config.sort ? APPLIED_SORT : undefined,
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

const getExpectedHitCount = (datasetType, language) => {
  switch (datasetType) {
    case DatasetTypes.INDEX_PATTERN.name:
      switch (language) {
        case QueryLanguages.DQL.name:
          return 28;
        case QueryLanguages.Lucene.name:
          return 28;
        case QueryLanguages.SQL.name:
          return undefined;
        case QueryLanguages.PPL.name:
          // TODO: Update this to 101 once Histogram is supported on 2.17
          return undefined;
        default:
          throw new Error(
            `getExpectedHitCount encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    case DatasetTypes.INDEXES.name:
      switch (language) {
        case QueryLanguages.SQL.name:
          return undefined;
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

// returns an array of data present in the results table to check against
// For each element in the outer array, the 0th index is the index of the table cell
// and the 1st index is the value that the cell should contain.
// We are testing the table data to ensure that sorting is working as expected
const getSampleTableData = (datasetType, language) => {
  switch (datasetType) {
    case DatasetTypes.INDEX_PATTERN.name:
      switch (language) {
        case QueryLanguages.DQL.name:
          return [
            [1, '9,998'],
            [2, 'Phyllis Dach'],
          ];
        case QueryLanguages.Lucene.name:
          return [
            [1, '9,998'],
            [2, 'Phyllis Dach'],
          ];
        case QueryLanguages.SQL.name:
          return [];
        case QueryLanguages.PPL.name:
          return [];
        default:
          throw new Error(
            `getSampleTableData encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    case DatasetTypes.INDEXES.name:
      switch (language) {
        case QueryLanguages.SQL.name:
          return [];
        case QueryLanguages.PPL.name:
          return [];
        default:
          throw new Error(
            `getSampleTableData encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    default:
      throw new Error(`getSampleTableData encountered unsupported datasetType: ${datasetType}`);
  }
};

const getQueryString = (dataset, language) => {
  switch (language) {
    case QueryLanguages.DQL.name:
      return 'bytes_transferred > 9950';
    case QueryLanguages.Lucene.name:
      return 'bytes_transferred: {9950 TO *}';
    case QueryLanguages.SQL.name:
      return `SELECT * FROM ${dataset} WHERE bytes_transferred > 9950`;
    case QueryLanguages.PPL.name:
      return `source = ${dataset} | where bytes_transferred > 9950`;
    default:
      throw new Error(`getQueryString encountered unsupported language: ${language}`);
  }
};

const generateTestConfiguration = (dataset, datasetType, language) => {
  const baseConfig = {
    dataset,
    datasetType,
    language: language.name,
    apiLanguage: language.apiName,
    saveName: `${language.name}-${datasetType}`,
    testName: `${language.name}-${datasetType}`,
    ...language.supports,
  };

  return {
    ...baseConfig,
    queryString: getQueryString(dataset, language.name),
    hitCount: getExpectedHitCount(datasetType, language.name),
    sampleTableData: getSampleTableData(datasetType, language.name),
  };
};

const generateAllTestConfigurations = () => {
  return Object.values(DatasetTypes).flatMap((dataset) =>
    dataset.supportedLanguages.map((language) => {
      let datasetToUse;
      switch (dataset.name) {
        case DatasetTypes.INDEX_PATTERN.name:
          datasetToUse = INDEX_PATTERN_WITH_TIME;
          break;
        case DatasetTypes.INDEXES.name:
          datasetToUse = INDEX_WITH_TIME_1;
          break;
        default:
          throw new Error(
            `generateAllTestConfigurations encountered unsupported dataset: ${dataset.name}`
          );
      }
      return generateTestConfiguration(datasetToUse, dataset.name, language);
    })
  );
};

const setDatePickerDatesAndSearchIfRelevant = (language) => {
  if (language === QueryLanguages.SQL.name) {
    return;
  }

  cy.setTopNavDate(START_TIME, END_TIME);
};

const setSearchConfigurations = ({ filters, queryString, histogram, selectFields, sort }) => {
  if (filters) {
    cy.submitFilterFromDropDown(
      APPLIED_FILTERS.field,
      APPLIED_FILTERS.operator,
      APPLIED_FILTERS.value,
      true
    );
  }

  cy.setQueryEditor(queryString, { parseSpecialCharSequences: false });

  if (histogram) {
    cy.getElementByTestId('discoverIntervalSelect').select('w');
  }

  if (selectFields) {
    for (const field of SELECTED_FIELD_COLUMNS) {
      cy.getElementByTestId(`fieldToggle-${field}`).click();
    }

    cy.getElementByTestId('querySubmitButton').should('be.visible');
  }

  if (sort) {
    cy.getElementByTestId(`docTableHeaderFieldSort_${APPLIED_SORT[0][0]}`).click();

    // stop sorting based on timestamp
    cy.getElementByTestId('docTableHeaderFieldSort_timestamp').click();
    cy.getElementByTestId('docTableHeaderFieldSort_timestamp').trigger('mouseover');
    cy.contains('div', 'Sort timestamp ascending').should('be.visible');

    cy.getElementByTestId(`docTableHeaderFieldSort_${APPLIED_SORT[0][0]}`).click();

    // TODO: This reload shouldn't need to be here, but currently the sort doesn't always happen right away
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9131
    cy.reload();
    cy.getElementByTestId('querySubmitButton').should('be.visible');
  }
};

const verifyDiscoverPageState = ({
  dataset,
  queryString,
  language,
  hitCount,
  filters,
  histogram,
  selectFields,
  sampleTableData = [],
}) => {
  cy.getElementByTestId('datasetSelectorButton').contains(dataset);
  if ([QueryLanguages.SQL.name, QueryLanguages.PPL.name].includes(language)) {
    cy.getElementByTestId('osdQueryEditor__multiLine').contains(queryString);
  } else {
    cy.getElementByTestId('osdQueryEditor__singleLine').contains(queryString);
  }
  cy.getElementByTestId('queryEditorLanguageSelector').contains(language);

  if (filters) {
    cy.getElementByTestId(
      `filter filter-enabled filter-key-${APPLIED_FILTERS.field} filter-value-${APPLIED_FILTERS.value} filter-unpinned `
    ).should('exist');
  }
  if (hitCount) {
    cy.verifyHitCount(hitCount);
  }

  if (histogram) {
    // TODO: Uncomment this once bug is fixed, currently the interval is not saving
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9077
    // cy.getElementByTestId('discoverIntervalSelect').should('have.value', 'w');
  }

  if (selectFields) {
    cy.getElementByTestId('docTableHeaderField').should('have.length', 3);
    cy.getElementByTestId('docTableHeader-timestamp').should('be.visible');
    for (const field of SELECTED_FIELD_COLUMNS) {
      cy.getElementByTestId(`docTableHeader-${field}`).should('be.visible');
      cy.getElementByTestId(`docTableHeader-${field}`).should('be.visible');
    }
  }
  // verify first row to ensure sorting is working, but ignore the timestamp field as testing environment might have differing timezones
  sampleTableData.forEach(([index, value]) => {
    cy.getElementByTestId('osdDocTableCellDataField').eq(index).contains(value);
  });
};

const verifySavedSearchInAssetsPage = ({
  apiLanguage,
  dataset,
  saveName,
  queryString,
  datasetType,
  histogram,
  selectFields,
  sort,
  filters,
}) => {
  cy.navigateToWorkSpaceSpecificPage({
    workspaceName: workspaceName,
    page: 'objects',
    isEnhancement: true,
  });

  // TODO: Currently this test will only work if the last saved object is the relevant savedSearch
  // Update below to make it work without that requirement.
  cy.getElementByTestId('euiCollapsedItemActionsButton').last().click();

  cy.intercept('POST', '/w/*/api/saved_objects/_bulk_get').as('savedObjectResponse');
  cy.getElementByTestId('savedObjectsTableAction-inspect').click();

  cy.wait('@savedObjectResponse').then((interception) => {
    const savedObjectAttributes = interception.response.body.saved_objects[0].attributes;
    const searchSource = savedObjectAttributes.kibanaSavedObjectMeta.searchSourceJSON;

    expect(savedObjectAttributes.title).eq(saveName);
    if (selectFields) {
      expect(savedObjectAttributes.columns).eqls(SELECTED_FIELD_COLUMNS);
    }
    if (sort) {
      expect(savedObjectAttributes.sort).eqls(APPLIED_SORT);
    }
    expect(searchSource).match(
      // all special characters must be escaped
      new RegExp(`"query":"${queryString.replaceAll(/([*{}])/g, (char) => `\\${char}`)}"`)
    );
    expect(searchSource).match(new RegExp(`"language":"${apiLanguage}"`));
    expect(searchSource).match(new RegExp(`"title":"${dataset.replace('*', '\\*')}"`));
    expect(searchSource).match(new RegExp(`"type":"${datasetType}"`));

    if (histogram) {
      expect(searchSource).match(/"calendar_interval":"1w"/);
    }
    if (filters) {
      expect(searchSource).match(
        new RegExp(`"match_phrase":\{"${APPLIED_FILTERS.field}":"${APPLIED_FILTERS.value}"\}`)
      );
    }
  });
};

export const runSavedSearchTests = () => {
  describe('saved search', () => {
    beforeEach(() => {
      // Load test data
      cy.setupTestData(
        SECONDARY_ENGINE.url,
        [
          `cypress/fixtures/query_enhancements/data-logs-1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data-logs-2/${INDEX_WITH_TIME_2}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data-logs-1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data-logs-2/${INDEX_WITH_TIME_2}.data.ndjson`,
        ]
      );
      // Add data source
      cy.addDataSource({
        name: datasourceName,
        url: SECONDARY_ENGINE.url,
        authType: 'no_auth',
      });
      // Grab the data source ID
      cy.contains('a', datasourceName).click();
      cy.url().then((url) => {
        const urlWithoutSearchParams = url.split('?')[0];
        // split the URL into parts and filter out the empty ones
        const urlParts = urlWithoutSearchParams.split('/').filter((parts) => !!parts.length);
        datasourceId = urlParts[urlParts.length - 1];
      });

      // Create workspace
      cy.deleteWorkspaceByName(workspaceName);
      cy.visit('/app/home');
      cy.createInitialWorkspaceWithDataSource(datasourceName, workspaceName);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: datasourceName,
        isEnhancement: true,
      });
      cy.url().then((url) => {
        const urlWithoutSearchParams = url.split('?')[0];
        // split the URL into parts and filter out the empty ones
        const urlParts = urlWithoutSearchParams.split('/').filter((parts) => !!parts.length);
        // the index pattern path has a # at the end, so stripping it
        indexPatternId = urlParts[urlParts.length - 1].replace('#', '');

        const workspaceIdIndex = urlParts.findIndex((part) => part === 'w') + 1;
        workspaceId = urlParts[workspaceIdIndex];
      });
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      // // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(datasourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITH_TIME_2);
    });

    generateAllTestConfigurations().forEach((config) => {
      it(`should successfully create a saved search for ${config.saveName}`, () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, datasourceName, config.datasetType);

        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        setSearchConfigurations(config);
        verifyDiscoverPageState(config);
        cy.saveSearch(config.saveName);

        // There is a small chance where if we go to assets page,
        // the saved search does not appear. So adding this wait
        cy.wait(2000);

        verifySavedSearchInAssetsPage(config);
      });

      // We are starting from various languages
      // to guard against: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9078
      Object.values(QueryLanguages)
        .map((queryLanguage) => queryLanguage.name)
        .forEach((startingLanguage) => {
          // TODO: Remove this line once bugs are fixed
          // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9078
          if (startingLanguage !== config.language) return;

          it(`should successfully load a saved search for ${config.saveName} starting from ${startingLanguage}`, () => {
            // POST a saved search
            cy.request({
              method: 'POST',
              url: `/w/${workspaceId}/api/saved_objects/search?overwrite=true`,
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'osd-xsrf': true,
              },
              body: getSavedObjectPostBody(config),
              failOnStatusCode: false,
            });

            cy.navigateToWorkSpaceSpecificPage({
              workspaceName,
              page: 'discover',
              isEnhancement: true,
            });
            cy.getElementByTestId('discoverNewButton').click();

            // Intentionally setting INDEX_PATTERN dataset here so that
            // we have access to all four languages that INDEX_PATTERN allows.
            // This means that we are only testing loading a saved search
            // starting from an INDEX_PATTERN dataset, but I think testing where the
            // start is a permutation of other dataset is overkill
            cy.setIndexPatternAsDataset(INDEX_PATTERN_WITH_TIME, datasourceName);

            cy.setQueryLanguage(startingLanguage);
            cy.loadSaveSearch(config.saveName, false);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            verifyDiscoverPageState(config);
          });
        });
    });
  });
};

runSavedSearchTests();
