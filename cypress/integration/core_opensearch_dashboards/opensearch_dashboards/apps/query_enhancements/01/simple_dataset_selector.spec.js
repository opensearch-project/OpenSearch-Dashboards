/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_PATTERN_WITH_NO_TIME,
  INDEX_WITHOUT_TIME_1,
  DATASOURCE_NAME,
} from '../../../../../../utils/apps/constants';
import { nonTimeBasedFieldsForDatasetCreation } from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
  getDefaultQuery,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { verifyDiscoverPageState } from '../../../../../../utils/apps/query_enhancements/saved';
import {
  generateSimpleDatasetSelectorTestConfigurations,
  validateItemsInSimpleDatasetSelectorDropDown,
} from '../../../../../../utils/apps/query_enhancements/simple_dataset_selector';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const timebasedDatasetId = getRandomizedDatasetId();
const nontimebasedDatasetId = getRandomizedDatasetId();

const noIndexPatterns = 5; // Determines the no of index patterns that should be in the dropdown for filtering test case
// eslint-disable-next-line no-loop-func
export const runSimpleDatasetSelectorTests = () => {
  before(() => {
    cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

    createWorkspaceAndDatasetUsingEndpoint(
      DATASOURCE_NAME,
      workspaceName,
      timebasedDatasetId,
      INDEX_PATTERN_WITH_TIME, // Create index pattern from base index
      'timestamp', // timestampField
      'logs', // signalType
      ['use-case-search'] // features
    );

    // Creating the Non Timebased Dataset
    cy.get('@DATASOURCE_ID').then((datasourceId) => {
      cy.get(`@${workspaceName}:WORKSPACE_ID`).then((workspaceId) => {
        cy.osd.createDatasetByEndpoint(
          nontimebasedDatasetId,
          workspaceId,
          datasourceId,
          {
            title: INDEX_PATTERN_WITH_NO_TIME,
            signalType: 'logs',
            fields: nonTimeBasedFieldsForDatasetCreation,
          },
          `${nontimebasedDatasetId}:DATASET_ID`
        );
      });
    });

    // Navigate to discover page ONCE for all tests
    cy.osd.navigateToWorkSpaceSpecificPage({
      workspaceName,
      page: 'data-explorer/discover',
      isEnhancement: true,
    });
  });

  describe('simple dataset selector selecting an index pattern', () => {
    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITHOUT_TIME_1,
      ]);
    });

    it('Test all dataset selector configurations without page reloads', () => {
      const configs = generateSimpleDatasetSelectorTestConfigurations([
        {
          indexPattern: INDEX_PATTERN_WITH_TIME,
          time: true,
        },
        {
          indexPattern: INDEX_PATTERN_WITH_NO_TIME,
          time: false,
        },
      ]);

      // Test all configurations in a single test - no page reloads between iterations
      configs.forEach((config, index) => {
        cy.log(
          `Testing configuration ${index + 1}/${configs.length}: ${
            config.time ? 'time-based' : 'no-time-based'
          } with ${config.language}`
        );

        // Select the original language
        cy.setQueryLanguage(config.language);

        // Select the index pattern
        cy.setIndexPatternAsDataset(config.indexPattern, DATASOURCE_NAME);

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

        cy.log(`✅ Configuration ${index + 1} completed successfully`);
      });
    });
  });

  describe('filtering index pattern in simple dataset selector', () => {
    before(() => {
      // Create workspace and dataset using our new helper function
      cy.osd.getDataSourceId(DATASOURCE_NAME);
      cy.get('@DATASOURCE_ID').then((datasourceId) => {
        cy.osd.createWorkspaceWithDataSourceId(
          datasourceId,
          workspaceName,
          ['use-case-search'],
          `${workspaceName}:WORKSPACE_ID`
        );
      });

      for (let i = 1; i <= noIndexPatterns; i++) {
        const currentDatasetId = getRandomizedDatasetId();
        // eslint-disable-next-line no-loop-func
        cy.get('@DATASOURCE_ID').then((datasourceId) => {
          // eslint-disable-next-line no-loop-func
          cy.get(`@${workspaceName}:WORKSPACE_ID`).then((workspaceId) => {
            cy.osd.createDatasetByEndpoint(
              currentDatasetId,
              workspaceId,
              datasourceId,
              {
                title: `${INDEX_PATTERN_WITH_TIME.slice(0, i)}*`,
                signalType: 'logs',
                timestamp: 'timestamp',
              },
              `${currentDatasetId}:DATASET_ID`
            );
          });
        });
      }

      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'data-explorer/discover',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITHOUT_TIME_1,
      ]);
    });

    it('validate filtering index pattern in simple dataset selector', () => {
      for (let i = 1; i <= noIndexPatterns; i++) {
        validateItemsInSimpleDatasetSelectorDropDown(
          `::${INDEX_PATTERN_WITH_TIME.slice(0, i)}`,
          noIndexPatterns - i + 1
        );
      }
    });
  });
};

prepareTestSuite('Simple Dataset Selector', runSimpleDatasetSelectorTests);
