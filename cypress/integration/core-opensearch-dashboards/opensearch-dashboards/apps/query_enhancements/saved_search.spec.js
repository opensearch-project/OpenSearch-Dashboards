/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  END_TIME,
  START_TIME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
} from './constants';
import { SECONDARY_ENGINE } from '../../../../../utils/constants';
import { v4 as uuid } from 'uuid';

const workspaceName = uuid();
// datasource name must be 32 char or less
const datasourceName = uuid().substring(0, 32);

const allowedSearchOperations = {
  DQL: {
    filters: true,
    histogram: true,
    selectFields: true,
    sort: true,
  },
  Lucene: {
    filters: true,
    histogram: true,
    selectFields: true,
    sort: true,
  },
  'OpenSearch SQL': {
    filters: false,
    histogram: false,
    selectFields: true,
    sort: false,
  },
  PPL: {
    filters: false,
    histogram: true,
    selectFields: true,
    sort: false,
  },
};

const indexPatternTestConfigurations = {
  DQL: {
    ...allowedSearchOperations.DQL,
    language: 'DQL',
    dataset: INDEX_PATTERN_WITH_TIME,
    queryString: 'bytes_transferred > 9950',
    hitCount: 28,
    sampleTableData: [
      [1, '9,998'],
      [2, 'Phyllis Dach'],
    ],
    saveName: 'dql-index-pattern-01',
  },
  Lucene: {
    ...allowedSearchOperations.Lucene,
    language: 'Lucene',
    dataset: INDEX_PATTERN_WITH_TIME,
    queryString: 'bytes_transferred: {9950 TO *}',
    hitCount: 28,
    sampleTableData: [
      [1, '9,998'],
      [2, 'Phyllis Dach'],
    ],
    saveName: 'lucene-index-pattern-01',
  },
  'OpenSearch SQL': {
    ...allowedSearchOperations['OpenSearch SQL'],
    language: 'OpenSearch SQL',
    dataset: INDEX_PATTERN_WITH_TIME,
    queryString: `SELECT * FROM ${INDEX_PATTERN_WITH_TIME} WHERE bytes_transferred > 9950`,
    hitCount: undefined,
    sampleTableData: [],
    saveName: 'sql-index-pattern-01',
  },
  PPL: {
    ...allowedSearchOperations.PPL,
    language: 'PPL',
    dataset: INDEX_PATTERN_WITH_TIME,
    queryString: `source = ${INDEX_PATTERN_WITH_TIME} | where bytes_transferred > 9950`,
    hitCount: 101,
    sampleTableData: [],
    saveName: 'ppl-index-pattern-01',
  },
};
const indexTestConfigurations = {
  'OpenSearch SQL': {
    ...allowedSearchOperations['OpenSearch SQL'],
    language: 'OpenSearch SQL',
    dataset: INDEX_WITH_TIME_1,
    queryString: `SELECT * FROM ${INDEX_WITH_TIME_1} WHERE bytes_transferred > 9950`,
    hitCount: undefined,
    sampleTableData: [],
    saveName: 'sql-index-01',
  },
  PPL: {
    ...allowedSearchOperations.PPL,
    language: 'PPL',
    dataset: INDEX_WITH_TIME_1,
    queryString: `source = ${INDEX_WITH_TIME_1} | where bytes_transferred > 9950`,
    hitCount: 50,
    sampleTableData: [],
    saveName: 'ppl-index-01',
  },
};
const allTestConfigurations = [
  ...Object.values(indexPatternTestConfigurations),
  ...Object.values(indexTestConfigurations),
];

// Maps a dataset that are used in this file to the exact string that dataset
// corresponds to in the saved search API response
const mapDatasetToType = (dataset) => {
  switch (dataset) {
    case INDEX_PATTERN_WITH_TIME:
      return 'INDEX_PATTERN';
    case INDEX_WITH_TIME_1:
      return 'INDEXES';
    default:
      return 'unknown dataset';
  }
};

// Maps a language that are used in this file to the exact string that the language
// corresponds to in the saved search API response
const mapLanguageToApiResponseString = (language) => {
  switch (language) {
    case 'DQL':
      return 'kuery';
    case 'Lucene':
      return 'lucene';
    case 'OpenSearch SQL':
      return 'SQL';
    case 'PPL':
      return 'PPL';
    default:
      return 'unknown language';
  }
};

// Escapes special characters for the editor
const prepareQueryStringForEditor = (queryString) => {
  return queryString.replaceAll(/([{}])/g, (char) => `{${char}}`);
};

// In theory this function is not needed as we should be able to use
// the custom command navigateToWorkSpaceSpecificPage, but when using that
// to go to the discover page, it sometimes leads to a blank page
const navigateToDiscoverPage = () => {
  cy.navigateToWorkSpaceHomePage(workspaceName);
  cy.getElementByTestId('headerAppActionMenu').should('be.visible');
};

// Sets the dataset for the search. Since INDEXES are not saved to the dataset,
// we need to click through various buttons to manually add them
const setDataset = (dataset) => {
  const datasetType = mapDatasetToType(dataset);
  cy.getElementByTestId('datasetSelectorButton').should('be.visible').click();

  if (datasetType === 'INDEX_PATTERN') {
    cy.get(`[title="${dataset}"]`).click();
  } else if (datasetType === 'INDEXES') {
    cy.getElementByTestId('datasetSelectorAdvancedButton').click();
    cy.contains('span', 'Indexes').click();
    cy.contains('span', datasourceName).click();
    // this element is sometimes being masked by another element
    cy.contains('span', dataset).should('be.visible').click({ force: true });
    cy.getElementByTestId('datasetSelectorNext').click();

    cy.getElementByTestId('advancedSelectorTimeFieldSelect').select('timestamp');
    cy.getElementByTestId('advancedSelectorConfirmButton').click();

    cy.getElementByTestId('datasetSelectorButton').should(
      'contain.text',
      `${datasourceName}::${dataset}`
    );
  }
};

const setDatePickerDatesAndSearchIfRelevant = (language) => {
  if (language === 'OpenSearch SQL') {
    return;
  }

  cy.setTopNavDate(START_TIME, END_TIME);
};

const setSearchConfigurations = ({
  addFilter,
  queryString,
  setHistogramInterval,
  selectFields,
  applySort,
}) => {
  if (addFilter) {
    cy.getElementByTestId('showFilterActions').click();
    cy.getElementByTestId('addFilters').click();
    cy.getElementByTestId('filterFieldSuggestionList').find('input').type('category');
    cy.getElementByTestId('comboBoxOptionsList filterFieldSuggestionList-optionsList')
      .find('button[title="category"]')
      .click();
    cy.getElementByTestId('filterOperatorList').find('input').type('is one of');
    cy.getElementByTestId('comboBoxOptionsList filterOperatorList-optionsList')
      .find('button[title="is one of"]')
      .click();
    cy.getElementByTestId('filterParams').find('input').type('Application');
    cy.getElementByTestId(
      'comboBoxOptionsList filterParamsComboBox phrasesParamsComboxBox-optionsList'
    )
      .find('button[title="Application"]')
      .click();
    // Need to wait here a bit to avoid cypress flakiness
    cy.wait(750);
    cy.get('span[title="Application"]').should('be.visible');
    // Need to wait here a bit to avoid cypress error
    cy.wait(750);
    // force is true below because sometimes a dropdown covers the button
    cy.getElementByTestId('saveFilter').click({ force: true });
  }

  cy.setQueryEditor(queryString);

  if (setHistogramInterval) {
    cy.getElementByTestId('discoverIntervalSelect').select('w');
  }

  if (selectFields) {
    cy.getElementByTestId('fieldToggle-bytes_transferred').click();
    cy.getElementByTestId('fieldToggle-personal.name').click();

    // reloading as field filtering doesn't appear right away on cypress. Issue only appears in cypress tests,
    // so resolving it via a force reload.
    // cy.reload();
    cy.getElementByTestId('querySubmitButton').should('be.visible');
  }

  if (applySort) {
    cy.getElementByTestId('docTableHeaderFieldSort_bytes_transferred').click();

    // stop sorting based on timestamp
    cy.getElementByTestId('docTableHeaderFieldSort_timestamp').click();
    cy.getElementByTestId('docTableHeaderFieldSort_timestamp').trigger('mouseover');
    cy.contains('div', 'Sort timestamp ascending').should('be.visible');

    cy.getElementByTestId('docTableHeaderFieldSort_bytes_transferred').click();

    // TODO: This reload shouldn't need to be here, but currently the sort doesn't always happen right away
    cy.reload();
    cy.getElementByTestId('querySubmitButton').should('be.visible');
  }
};

const verifyDiscoverPageState = ({
  dataset,
  queryString,
  language,
  hitCount,
  checkFilter,
  checkHistogramInterval,
  checkSelectedField,
  verifyTableData = [],
}) => {
  cy.getElementByTestId('datasetSelectorButton').contains(dataset);
  if (language === 'OpenSearch SQL' || language === 'PPL') {
    cy.getElementByTestId('osdQueryEditor__multiLine').contains(queryString);
  } else {
    cy.getElementByTestId('osdQueryEditor__singleLine').contains(queryString);
  }
  cy.getElementByTestId('queryEditorLanguageSelector').contains(language);

  if (checkFilter) {
    cy.getElementByTestId(
      'filter filter-enabled filter-key-category filter-value-Application filter-unpinned '
    ).should('exist');
  }
  if (hitCount) {
    cy.verifyHitCount(hitCount);
  }

  if (checkHistogramInterval) {
    // TODO: Uncomment this once bug is fixed, currently the interval is not saving
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9077
    // cy.getElementByTestId('discoverIntervalSelect').should('have.value', 'w');
  }

  if (checkSelectedField) {
    cy.getElementByTestId('docTableHeaderField').should('have.length', 3);
    cy.getElementByTestId('docTableHeader-timestamp').should('be.visible');
    cy.getElementByTestId('docTableHeader-bytes_transferred').should('be.visible');
    cy.getElementByTestId('docTableHeader-personal.name').should('be.visible');
  }
  // verify first row to ensure sorting is working, but ignore the timestamp field as testing environment might have differing timezones
  verifyTableData.forEach(([index, value]) => {
    cy.getElementByTestId('osdDocTableCellDataField').eq(index).contains(value);
  });
};

// if searchName is not passed, assume they want to save as new search
const saveSearch = ({ searchName, saveAsNew }) => {
  cy.getElementByTestId('discoverSaveButton').click();
  if (searchName) {
    cy.getElementByTestId('savedObjectTitle').type(searchName);
  }

  if (saveAsNew) {
    cy.getElementByTestId('saveAsNewCheckbox').click();
  }
  cy.getElementByTestId('confirmSaveSavedObjectButton').click();

  // if saving as new save search, you need to click confirm twice;
  if (saveAsNew) {
    cy.getElementByTestId('confirmSaveSavedObjectButton').click();
  }
  cy.getElementByTestId('euiToastHeader').contains(/was saved/);
};

const verifySavedSearchInAssetsPage = ({
  dataset,
  searchName,
  queryString,
  language,
  checkHistogramInterval,
  checkSelectedField,
  checkSort,
  checkFilter,
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

    expect(savedObjectAttributes.title).eq(searchName);
    if (checkSelectedField) {
      expect(savedObjectAttributes.columns).eqls(['bytes_transferred', 'personal.name']);
    }
    if (checkSort) {
      expect(savedObjectAttributes.sort).eqls([['bytes_transferred', 'desc']]);
    }
    expect(searchSource).match(
      // all special characters must be escaped
      new RegExp(`"query":"${queryString.replaceAll(/([*{}])/g, (char) => `\\${char}`)}"`)
    );
    expect(searchSource).match(
      new RegExp(`"language":"${mapLanguageToApiResponseString(language)}"`)
    );
    expect(searchSource).match(new RegExp(`"title":"${dataset.replace('*', '\\*')}"`));
    expect(searchSource).match(new RegExp(`"type":"${mapDatasetToType(dataset)}"`));

    if (checkHistogramInterval) {
      expect(searchSource).match(/"calendar_interval":"1w"/);
    }
    if (checkFilter) {
      expect(searchSource).match(/"match_phrase":\{"category":"Application"\}/);
    }
  });
};

const loadSavedSearch = (searchName, selectDuplicate = false) => {
  cy.getElementByTestId('discoverOpenButton').click();
  if (selectDuplicate) {
    cy.getElementByTestId(`savedObjectTitle${searchName}`).last().click();
  } else {
    cy.getElementByTestId(`savedObjectTitle${searchName}`).first().click();
  }

  cy.get('h1').contains(searchName).should('be.visible');
};

const setSearchAndSaveAndVerify = (config) => {
  navigateToDiscoverPage();
  setDataset(config.dataset);
  cy.setQueryLanguage(config.language);
  setDatePickerDatesAndSearchIfRelevant(config.language);

  setSearchConfigurations({
    addFilter: config.filters,
    queryString: prepareQueryStringForEditor(config.queryString, config.language, config.dataset),
    setHistogramInterval: config.histogram,
    selectFields: config.selectFields,
    applySort: config.sort,
  });
  verifyDiscoverPageState({
    dataset: config.dataset,
    queryString: config.queryString,
    language: config.language,
    hitCount: config.hitCount,
    checkFilter: config.filters,
    checkHistogramInterval: config.histogram,
    checkSelectedField: config.selectFields,
    verifyTableData: config.sampleTableData,
  });
  saveSearch({ searchName: config.saveName });

  // There is a small chance where if we go to assets page,
  // the saved search does not appear. So adding this wait
  cy.wait(1000);

  verifySavedSearchInAssetsPage({
    dataset: config.dataset,
    searchName: config.saveName,
    queryString: config.queryString,
    language: config.language,
    checkHistogramInterval: config.histogram,
    checkSelectedField: config.selectFields,
    checkSort: config.sort,
    checkFilter: config.filters,
  });
};

const loadSavedSearchAndVerify = (config) => {
  // We are starting from various languages
  // to guard against: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9078
  ['DQL', 'Lucene', 'OpenSearch SQL', 'PPL'].forEach((startingLanguage) => {
    // TODO: Remove this line once bugs are fixed
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9078
    if (startingLanguage !== config.language) return;

    navigateToDiscoverPage();
    cy.getElementByTestId('discoverNewButton').click();

    // Intentionally setting INDEX_PATTERN dataset here so that
    // we have access to all four languages that INDEX_PATTERN allows.
    // This means that we are only testing loading a saved search
    // starting from an INDEX_PATTERN dataset, but I think testing where the
    // start is a permutation of other dataset is overkill
    setDataset(INDEX_PATTERN_WITH_TIME);

    cy.setQueryLanguage(startingLanguage);
    loadSavedSearch(config.saveName);
    setDatePickerDatesAndSearchIfRelevant(config.language);
    verifyDiscoverPageState({
      dataset: config.dataset,
      queryString: config.queryString,
      language: config.language,
      hitCount: config.hitCount,
      checkFilter: config.filters,
      checkHistogramInterval: config.histogram,
      checkSelectedField: config.selectFields,
      verifyTableData: config.sampleTableData,
    });
  });
};

export const runSavedSearchCreateTests = () => {
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
      // Create workspace
      cy.deleteWorkspaceByName(workspaceName);
      cy.visit('/app/home');
      cy.createInitialWorkspaceWithDataSource(datasourceName, workspaceName);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        isEnhancement: true,
      });
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      // // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(datasourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITH_TIME_2);
    });

    allTestConfigurations.forEach((config) => {
      it(`should successfully create a saved search and load it for ${mapDatasetToType(
        config.dataset
      ).toLowerCase()} ${config.language}`, () => {
        setSearchAndSaveAndVerify(config);
        loadSavedSearchAndVerify(config);
      });
    });
  });
};

runSavedSearchCreateTests();
