/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_PATTERN_WITH_NO_TIME,
  INDEX_WITHOUT_TIME_1,
  SECONDARY_ENGINE,
} from '../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasourceName,
  getDefaultQuery,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../utils/apps/query_enhancements/shared';
import { verifyDiscoverPageState } from '../../../../../utils/apps/query_enhancements/saved';
import {
  generateSimpleDatasetSelectorTestConfigurations,
  validateItemsInSimpleDatasetSelectorDropDown,
} from '../../../../../utils/apps/query_enhancements/simple_dataset_selector';

const workspaceName = getRandomizedWorkspaceName();
const datasourceName = getRandomizedDatasourceName();
const noIndexPatterns = 5; // Determines the no of index patterns that should be in the dropdown for filtering test case

export const runSimpleDatasetSelectorTests = () => {
  describe('simple dataset selector selecting an index pattern', () => {
    beforeEach(() => {
      // Load test data
      cy.setupTestData(
        SECONDARY_ENGINE.url,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.data.ndjson`,
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
      cy.osd.createInitialWorkspaceWithDataSource(datasourceName, workspaceName);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: datasourceName,
        isEnhancement: true,
      });
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_NO_TIME.replace('*', ''),
        timefieldName: '',
        dataSource: datasourceName,
        isEnhancement: true,
        indexPatternHasTimefield: false,
      });
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(datasourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITHOUT_TIME_1);
    });

    generateSimpleDatasetSelectorTestConfigurations([
      {
        indexPattern: INDEX_PATTERN_WITH_TIME,
        time: true,
      },
      {
        indexPattern: INDEX_PATTERN_WITH_NO_TIME,
        time: false,
      },
    ]).forEach((config) => {
      it(`Select ${
        config.time ? 'time-based' : 'no-time-based'
      } Indexpattern when original language was ${
        config.language
      } from the simple dataset selector`, () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        // Select the original language
        cy.setQueryLanguage(config.language);

        // Select the index pattern
        cy.setIndexPatternAsDataset(config.indexPattern, datasourceName);

        // Verify if the language is unchanged, we get a default query populated, and correct dataset is set
        verifyDiscoverPageState({
          dataset: config.indexPattern,
          queryString: getDefaultQuery(config.indexPattern, config.language),
          language: config.language,
          hitCount: null,
          filters: null,
          histogram: null,
          selectFields: null,
          sampleTableData: null,
        });

        // Verify the presence of timestamp column
        // Set the time range
        if (config.time) {
          setDatePickerDatesAndSearchIfRelevant(config.language);
          cy.getElementByTestId('docTableHeaderField').contains('Time');
        }
      });
    });
  });

  describe('filtering index pattern in simple dataset selector', () => {
    beforeEach(() => {
      // Load test data
      cy.setupTestData(
        SECONDARY_ENGINE.url,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.data.ndjson`,
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
      cy.osd.createInitialWorkspaceWithDataSource(datasourceName, workspaceName);

      for (let i = 1; i <= noIndexPatterns; i++) {
        cy.createWorkspaceIndexPatterns({
          workspaceName: workspaceName,
          indexPattern: INDEX_PATTERN_WITH_TIME.slice(0, i),
          timefieldName: 'timestamp',
          dataSource: datasourceName,
          isEnhancement: true,
        });
      }
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(datasourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITHOUT_TIME_1);
    });

    it('validate filtering index pattern in simple dataset selector', () => {
      cy.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'discover',
        isEnhancement: true,
      });

      for (let i = 1; i <= noIndexPatterns; i++) {
        validateItemsInSimpleDatasetSelectorDropDown(
          `::${INDEX_PATTERN_WITH_TIME.slice(0, i)}`,
          noIndexPatterns - i + 1
        );
      }
    });
  });
};

runSimpleDatasetSelectorTests();
