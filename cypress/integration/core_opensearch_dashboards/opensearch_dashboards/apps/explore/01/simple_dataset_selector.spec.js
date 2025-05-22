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
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getDefaultQuery,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { verifyDiscoverPageState } from '../../../../../../utils/apps/query_enhancements/saved';
import { validateItemsInSimpleDatasetSelectorDropDown } from '../../../../../../utils/apps/query_enhancements/simple_dataset_selector';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { generateSimpleDatasetSelectorTestConfigurations } from '../../../../../../utils/apps/explore/simple_dataset_selector';

const workspaceName = getRandomizedWorkspaceName();
const noIndexPatterns = 5; // Determines the no of index patterns that should be in the dropdown for filtering test case

export const runSimpleDatasetSelectorTests = () => {
  describe('simple dataset selector selecting an index pattern', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITHOUT_TIME_1,
      ]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_NO_TIME.replace('*', ''),
        timefieldName: '',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
        indexPatternHasTimefield: false,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITHOUT_TIME_1,
      ]);
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
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore',
          isEnhancement: true,
        });

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
      });
    });
  });

  describe('filtering index pattern in simple dataset selector', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITHOUT_TIME_1,
      ]);

      for (let i = 1; i <= noIndexPatterns; i++) {
        cy.createWorkspaceIndexPatterns({
          workspaceName: workspaceName,
          indexPattern: INDEX_PATTERN_WITH_TIME.slice(0, i),
          timefieldName: 'timestamp',
          dataSource: DATASOURCE_NAME,
          isEnhancement: true,
        });
      }
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITHOUT_TIME_1,
      ]);
    });

    it('validate filtering index pattern in simple dataset selector', () => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'explore',
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

prepareTestSuite('Simple Dataset Selector', runSimpleDatasetSelectorTests);
