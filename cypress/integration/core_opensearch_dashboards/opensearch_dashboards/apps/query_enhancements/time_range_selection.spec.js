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
} from '../../../../../utils/apps/query_enhancements/shared';
import { generateTimeRangeTestConfiguration } from '../../../../../utils/apps/query_enhancements/time_range_selection';

const workspaceName = getRandomizedWorkspaceName();
const datasourceName = getRandomizedDatasourceName();

export const runTimeRangeSelectionTests = () => {
  describe('Time Range Selection Tests', () => {
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
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(datasourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITH_TIME_2);
    });

    generateAllTestConfigurations(generateTimeRangeTestConfiguration).forEach((config) => {
      it(`Time Range Selection using the quick select menu ${config.testName}`, () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, datasourceName, config.datasetType);

        cy.setQueryLanguage(config.language.name);

        if (config.language.supports.datepicker) {
          cy.setQuickSelectTime('Last', 15, 'years');
          if (config.hitCountRealtiveQuickTimeSelect) {
            cy.verifyHitCount(config.hitCountRealtiveQuickTimeSelect);
          }
        } else {
          cy.getElementByTestId('superDatePickerToggleQuickMenuButton').should('not.exist');
        }
      });

      it(`Time Range Selection using the relative time select menu ${config.testName}`, () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, datasourceName, config.datasetType);

        cy.setQueryLanguage(config.language.name);

        if (config.language.supports.datepicker) {
          cy.setRelativeTopNavDate(15, 'Years ago');
          if (config.hitCountRealtiveQuickTimeSelect) {
            cy.verifyHitCount(config.hitCountRealtiveQuickTimeSelect);
          }
        } else {
          cy.getElementByTestId('superDatePickerToggleQuickMenuButton').should('not.exist');
        }
      });

      it(`Time Range Selection using the absolute time select menu ${config.testName}`, () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, datasourceName, config.datasetType);

        cy.setQueryLanguage(config.language.name);

        if (config.language.supports.datepicker) {
          cy.setTopNavDate('Nov 29, 2021 @ 00:00:00.000', 'Dec 29, 2023 @ 00:00:00.000');
          if (config.hitCountAbsoluteTimeSelect) {
            cy.verifyHitCount(config.hitCountAbsoluteTimeSelect);
          }
        } else {
          cy.getElementByTestId('superDatePickerToggleQuickMenuButton').should('not.exist');
        }
      });
    });
  });
};

runTimeRangeSelectionTests();
