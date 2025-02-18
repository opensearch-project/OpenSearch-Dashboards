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
} from '../../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { generateTimeRangeTestConfiguration } from '../../../../../../utils/apps/query_enhancements/time_range_selection';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

export const runTimeRangeSelectionTests = () => {
  describe('Time Range Selection Tests', () => {
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
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
    });

    generateAllTestConfigurations(generateTimeRangeTestConfiguration).forEach((config) => {
      it(`Time Range Selection using the quick select menu ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

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
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

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
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

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

prepareTestSuite('Time Range Selection', runTimeRangeSelectionTests);
