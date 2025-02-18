/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  PATHS,
  DatasetTypes,
} from '../../../../../../utils/constants';

import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  getDefaultQuery,
} from '../../../../../../utils/apps/query_enhancements/shared';

import { verifyDiscoverPageState } from '../../../../../../utils/apps/query_enhancements/saved';

import {
  generateDatasetSelectorTestConfiguration,
  verifyBaseState,
  setUpBaseState,
} from '../../../../../../utils/apps/query_enhancements/dataset_selector';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

export const runDatasetSelectorTests = () => {
  describe('dataset selector', { scrollBehavior: false }, () => {
    beforeEach(() => {
      // Load test data
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_2}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_2}.data.ndjson`,
        ]
      );
      // Add data source
      cy.osd.addDataSource({
        name: DATASOURCE_NAME,
        url: PATHS.SECONDARY_ENGINE,
        authType: 'no_auth',
      });
      // Create workspace
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteAllOldWorkspaces();
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      cy.osd.deleteIndex(INDEX_WITH_TIME_1);
      cy.osd.deleteIndex(INDEX_WITH_TIME_2);
    });

    generateAllTestConfigurations(generateDatasetSelectorTestConfiguration).forEach((config) => {
      it(`should be able to select and load ${config.testName} dataset-language combination using advanced dataset selector`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        if (config.datasetType === DatasetTypes.INDEX_PATTERN.name) {
          cy.setIndexPatternFromAdvancedSelector(config.dataset, DATASOURCE_NAME, config.language);
        } else {
          cy.setIndexAsDataset(config.dataset, DATASOURCE_NAME, config.language);
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
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        // Setup the base state
        setUpBaseState(INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME);

        // Verify if the base state is setup properly
        verifyBaseState(INDEX_PATTERN_WITH_TIME);

        // Try setting the dataset-language combination but click on cancel
        if (config.datasetType === DatasetTypes.INDEX_PATTERN.name) {
          cy.setIndexPatternFromAdvancedSelector(
            config.dataset,
            DATASOURCE_NAME,
            config.language,
            'cancel'
          );
        } else {
          cy.setIndexAsDataset(
            config.dataset,
            DATASOURCE_NAME,
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

prepareTestSuite('Dataset Selector', runDatasetSelectorTests);
