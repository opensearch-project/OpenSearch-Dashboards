/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
} from '../../../../../../utils/constants';

import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  generateBaseConfiguration,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/query_enhancements/shared';

import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
  createDatasetWithEndpoint,
} from '../../../../../../utils/helpers';
import { generateQueryTestConfigurations } from '../../../../../../utils/apps/query_enhancements/queries';
import { getDatasetName } from '../../../../../../utils/apps/query_enhancements/autocomplete';

const workspaceName = getRandomizedWorkspaceName();
const datasetId1 = getRandomizedDatasetId();
const datasetId2 = getRandomizedDatasetId();

export const runAdvancedSettingsTests = () => {
  describe('advanced settings tests', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId1,
        `${INDEX_WITH_TIME_1}*`,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-search'] // features
      );

      createDatasetWithEndpoint(DATASOURCE_NAME, workspaceName, datasetId2, {
        title: `${INDEX_WITH_TIME_2}*`,
        signalType: 'logs',
        timestamp: 'timestamp',
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'data-explorer/discover',
        isEnhancement: true,
      });
      // Default discover:sampleSize is 500
      // This is to ensure the setting is not changed by other tests
      cy.setAdvancedSetting({
        'discover:sampleSize': 500,
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
          // Page reload
          cy.window().then((win) => {
            win.location.reload();
          });

          cy.getElementByTestId('discoverNoResults').should('not.exist');
          cy.setAdvancedSetting({
            'courier:ignoreFilterIfFieldNotInIndex': false,
          });
        });

        it('sampleSize should affect the number of hits', () => {
          // Setup
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);

          // Wait for initial data loading and verify elements are present
          cy.osd.waitForLoader(true);
          //cy.wait(60000);

          // DIAGNOSTIC: Verify settings are still correct before proceeding
          cy.getAdvancedSetting('discover:sampleSize').should('equal', 500);

          // Store initial count to verify sample size change has effect
          cy.getElementByTestId('docTableField').should('have.length', 100);

          // Turn on courier:sampleSize
          cy.setAdvancedSetting({
            'discover:sampleSize': 5,
          });

          // Page reload
          cy.window().then((win) => {
            win.location.reload();
          });

          // Wait for page reload and data loading
          cy.osd.waitForLoader(true);
          //cy.wait(90000);

          // DIAGNOSTIC: Verify reduced sampleSize setting is correct after reload
          cy.getAdvancedSetting('discover:sampleSize').should('equal', 5);

          // Should not affect total hits
          cy.verifyHitCount('10,000');

          // Verify sample size reduction has effect - should have fewer fields than initial
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
