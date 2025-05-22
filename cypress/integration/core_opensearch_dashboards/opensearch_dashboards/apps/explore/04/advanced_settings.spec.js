/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  DATASOURCE_NAME,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  generateBaseConfiguration,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { generateQueryTestConfigurations } from '../../../../../../utils/apps/explore/queries';
import { getDatasetName } from '../../../../../../utils/apps/query_enhancements/autocomplete';

const workspaceName = getRandomizedWorkspaceName();

export const runAdvancedSettingsTests = () => {
  // This test was only for DQL & Lucene
  describe.skip('discover autocomplete tests', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITH_TIME_2,
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
    });

    generateQueryTestConfigurations(generateBaseConfiguration).forEach((config) => {
      describe(`${config.testName}`, () => {
        it('ignoreFilterIfFieldNotInIndex should affect filtered field', () => {
          // Default courier:ignoreFilterIfFieldNotInIndex should be false
          // This is to ensure the setting is not changed by other tests
          cy.setAdvancedSetting({
            'courier:ignoreFilterIfFieldNotInIndex': false,
          });
          // Get dataset names based on type
          const firstDataset = getDatasetName(INDEX_WITH_TIME_1, config.datasetType);
          const secondDataset = getDatasetName(INDEX_WITH_TIME_2, config.datasetType);
          cy.setDataset(firstDataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);

          // courier:ignoreFilterIfFieldNotInIndex is off
          cy.submitFilterFromDropDown('unique_category', 'is', 'Caching', true);
          cy.verifyHitCount(500);

          cy.setDataset(secondDataset, DATASOURCE_NAME, config.datasetType);
          cy.getElementByTestId('discoverNoResults').should('exist');

          // Turn on courier:ignoreFilterIfFieldNotInIndex
          cy.setAdvancedSetting({
            'courier:ignoreFilterIfFieldNotInIndex': true,
          });
          cy.reload();
          cy.getElementByTestId('discoverNoResults').should('not.exist');
          cy.verifyHitCount('10,000');
          cy.setAdvancedSetting({
            'courier:ignoreFilterIfFieldNotInIndex': false,
          });
        });

        it('sampleSize should affect the number of hits', () => {
          // Default discover:sampleSize is 500
          // This is to ensure the setting is not changed by other tests
          cy.setAdvancedSetting({
            'discover:sampleSize': 500,
          });
          // Setup
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);

          // default discover:sampleSize is 500
          // discover shows 50 hits per page by default
          cy.getElementByTestId('docTableField').should('have.length', 100);

          // Turn on courier:sampleSize
          cy.setAdvancedSetting({
            'discover:sampleSize': 5,
          });
          cy.reload();
          // Should not affect total hits
          cy.verifyHitCount('10,000');
          cy.getElementByTestId('docTableField').should('have.length', 10);
          cy.setAdvancedSetting({
            'discover:sampleSize': 500,
          });
        });
      });
    });
  });
};

prepareTestSuite('Advanced Settings', runAdvancedSettingsTests);
