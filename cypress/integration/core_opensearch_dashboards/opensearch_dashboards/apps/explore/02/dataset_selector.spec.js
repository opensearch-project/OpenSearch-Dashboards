/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  DatasetTypes,
} from '../../../../../../utils/constants';

import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';

import { verifyDiscoverPageState } from '../../../../../../utils/apps/explore/saved';

import {
  generateDatasetSelectorTestConfiguration,
  verifyBaseState,
  setUpBaseState,
} from '../../../../../../utils/apps/explore/dataset_selector';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

export const runDatasetSelectorTests = () => {
  describe('dataset selector', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      // Create workspace and dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME, // Uses 'data_logs_small_time_*'
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    generateAllTestConfigurations(generateDatasetSelectorTestConfiguration).forEach((config) => {
      it(`should be able to select and load ${config.testName} dataset-language combination using advanced dataset selector`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore/logs',
          isEnhancement: true,
        });

        if (config.datasetType === DatasetTypes.INDEX_PATTERN.name) {
          cy.explore.setIndexPatternFromAdvancedSelector(
            config.dataset,
            DATASOURCE_NAME,
            config.language
          );
        } else {
          cy.explore.setIndexAsDataset(config.dataset, DATASOURCE_NAME, config.language);
        }
        setDatePickerDatesAndSearchIfRelevant(config.language);

        verifyDiscoverPageState({
          dataset: config.dataset,
          queryString: '',
          language: config.language,
          hitCount: config.hitCount,
        });

        // verify time field is present in the result
        cy.getElementByTestId('docTableHeaderField').contains('Time');
      });

      it(`select the ${config.testName} dataset-language combination and cancelling the workflow restores the original state`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore/logs',
          isEnhancement: true,
        });

        // Setup the base state
        setUpBaseState(INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME);

        // Verify if the base state is setup properly
        verifyBaseState(INDEX_PATTERN_WITH_TIME);

        // Try setting the dataset-language combination but click on cancel
        if (config.datasetType === DatasetTypes.INDEX_PATTERN.name) {
          cy.explore.setIndexPatternFromAdvancedSelector(
            config.dataset,
            DATASOURCE_NAME,
            config.language,
            'timestamp',
            'cancel'
          );
        } else {
          cy.explore.setIndexAsDataset(
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
