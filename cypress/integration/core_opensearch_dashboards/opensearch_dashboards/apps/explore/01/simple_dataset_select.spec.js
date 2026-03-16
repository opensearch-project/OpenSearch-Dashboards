/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_PATTERN_WITH_NO_TIME,
  DATASOURCE_NAME,
  nonTimeBasedFieldsForDatasetCreation,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import { verifyDiscoverPageState } from '../../../../../../utils/apps/explore/saved';
import {
  generateSimpleDatasetSelectorTestConfigurations,
  validateItemsInSimpleDatasetSelectorDropDown,
} from '../../../../../../utils/apps/explore/simple_dataset_selector';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const timebasedDatasetId = getRandomizedDatasetId();
const nontimebasedDatasetId = getRandomizedDatasetId();

const noIndexPatterns = 2; // Determines the no of index patterns that should be in the dropdown for filtering test case

export const runSimpleDatasetSelectorTests = () => {
  describe('simple dataset selector selecting an index pattern', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        timebasedDatasetId,
        INDEX_PATTERN_WITH_TIME, // Create index pattern from base index
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
      // Creating the Non Timebased Dataset
      // eslint-disable-next-line no-loop-func
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
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    generateSimpleDatasetSelectorTestConfigurations([
      {
        indexPattern: INDEX_PATTERN_WITH_TIME,
        time: true,
      },
    ]).forEach((config) => {
      it(`Select time-based Indexpattern when original language was ${config.language} from the simple dataset selector`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore/logs',
          isEnhancement: true,
        });

        // Select the index pattern
        cy.explore.setIndexPatternAsDataset(config.indexPattern, DATASOURCE_NAME);

        // Verify if the language is unchanged, we get a default query populated, and correct dataset is set
        verifyDiscoverPageState({
          dataset: config.indexPattern,
          queryString: '',
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

      it(`Validate non time-based Indexpattern are filtered when original language was ${config.language} from the simple dataset selector`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore/logs',
          isEnhancement: true,
        });

        cy.getElementByTestId('datasetSelectButton')
          .should('not.be.disabled')
          .click({ force: true });

        cy.get('[data-test-subj*="datasetSelectOption"]').should('have.length', 1);
        // Ensure no dataset options contain "data_logs_small_no_time_" text
        cy.get('[data-test-subj*="datasetSelectOption"]').each(($el) => {
          cy.wrap($el).should('not.contain.text', INDEX_PATTERN_WITH_NO_TIME);
        });
      });
    });
  });

  describe('filtering index pattern in simple dataset selector', () => {
    before(() => {
      cy.osd.getDataSourceId(DATASOURCE_NAME);
      cy.get('@DATASOURCE_ID').then((datasourceId) => {
        cy.osd.createWorkspaceWithDataSourceId(
          datasourceId,
          workspaceName,
          ['use-case-observability'],
          `${workspaceName}:WORKSPACE_ID`
        );
      });

      const createDatasetForIndex = (index) => {
        const currentDatasetId = getRandomizedDatasetId();
        cy.get('@DATASOURCE_ID').then((datasourceId) => {
          cy.get(`@${workspaceName}:WORKSPACE_ID`).then((workspaceId) => {
            cy.osd.createDatasetByEndpoint(
              currentDatasetId,
              workspaceId,
              datasourceId,
              {
                title: `${INDEX_PATTERN_WITH_TIME.slice(0, index)}*`,
                signalType: 'logs',
                timestamp: 'timestamp',
              },
              `${currentDatasetId}:DATASET_ID`
            );
          });
        });
      };

      for (let i = 1; i <= noIndexPatterns; i++) {
        createDatasetForIndex(i);
      }
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    it('validate filtering index pattern in simple dataset selector', () => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });

      for (let i = 1; i <= noIndexPatterns; i++) {
        validateItemsInSimpleDatasetSelectorDropDown(
          `${INDEX_PATTERN_WITH_TIME.slice(0, i)}`,
          noIndexPatterns
        );
      }
    });
  });
};

prepareTestSuite('Simple Dataset Selector', runSimpleDatasetSelectorTests);
