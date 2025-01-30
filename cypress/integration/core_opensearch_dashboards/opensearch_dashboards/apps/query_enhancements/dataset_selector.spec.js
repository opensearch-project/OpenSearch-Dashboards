/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  SECONDARY_ENGINE,
} from '../../../../../utils/constants';

import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  getRandomizedDatasourceName,
  setDatePickerDatesAndSearchIfRelevant,
  getDefaultQuery,
} from '../../../../../utils/apps/query_enhancements/shared';

import { verifyDiscoverPageState } from '../../../../../utils/apps/query_enhancements/saved';

import {
  generateDatasetSelectorTestConfiguration,
  verifyBaseState,
  setUpBaseState,
} from '../../../../../utils/apps/query_enhancements/dataset_selector';

const workspaceName = getRandomizedWorkspaceName();
const dataSourceName = getRandomizedDatasourceName();

export const runDatasetSelectorTests = () => {
  describe('dataset selector', { scrollBehavior: false }, () => {
    beforeEach(() => {
      // Load test data
      cy.setupTestData(
        SECONDARY_ENGINE.url,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_2/${INDEX_WITH_TIME_2}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_2/${INDEX_WITH_TIME_2}.data.ndjson`,
        ]
      );
      // Add data source
      cy.addDataSource({
        name: dataSourceName,
        url: SECONDARY_ENGINE.url,
        authType: 'no_auth',
      });

      // Create workspace
      cy.deleteWorkspaceByName(workspaceName);
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(dataSourceName, workspaceName);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: dataSourceName,
        isEnhancement: true,
      });
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(dataSourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITH_TIME_2);
    });

    generateAllTestConfigurations(generateDatasetSelectorTestConfiguration).forEach((config) => {
      it(`should be able to select and load ${config.testName} dataset-language combination using advanced dataset selector`, () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        if (config.datasetType === 'INDEX_PATTERN') {
          cy.setIndexPatternFromAdvancedSelector(config.dataset, dataSourceName, config.language);
        } else {
          cy.setIndexAsDataset(config.dataset, dataSourceName, config.language);
        }
        setDatePickerDatesAndSearchIfRelevant(config.language);

        verifyDiscoverPageState({
          dataset: config.dataset,
          queryString: getDefaultQuery(config.dataset, config.language),
          language: config.language,
          hitCount: config.hitCount,
        });

        // verify time field is present in the result
        cy.getElementByTestId('docTableHeaderField').contains('Time');
      });

      it(`select the ${config.testName} dataset-language combination and cancelling the workflow restores the original state`, () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        // Setup the base state
        setUpBaseState(INDEX_PATTERN_WITH_TIME, dataSourceName);

        // Verify if the base state is setup properly
        verifyBaseState(INDEX_PATTERN_WITH_TIME);

        // Try setting the dataset-language combination but click on cancel
        if (config.datasetType === 'INDEX_PATTERN') {
          cy.setIndexPatternFromAdvancedSelector(
            config.dataset,
            dataSourceName,
            config.language,
            'cancel'
          );
        } else {
          cy.setIndexAsDataset(
            config.dataset,
            dataSourceName,
            config.language,
            'timestamp',
            'cancel'
          );
        }

        // Verify if the base state is retained
        verifyBaseState(INDEX_PATTERN_WITH_TIME);
      });
    });
  });
};

runDatasetSelectorTests();
