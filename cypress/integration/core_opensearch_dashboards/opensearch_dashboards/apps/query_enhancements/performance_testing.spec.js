/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  PATHS,
  DATASOURCE_NAME,
} from '../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../utils/apps/query_enhancements/shared';
import { generateDisplayTestConfiguration } from '../../../../../utils/apps/query_enhancements/language_specific_display';
import { prepareTestSuite } from '../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const runSavedSearchTests = () => {
  describe('Performance testing', () => {
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
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      // Add data source
      cy.osd.addDataSource({
        name: DATASOURCE_NAME,
        url: PATHS.SECONDARY_ENGINE,
        authType: 'no_auth',
      });

      // Create workspace
      cy.deleteAllWorkspaces();
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      cy.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'discover',
        isEnhancement: true,
      });
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      cy.osd.deleteIndex(INDEX_WITH_TIME_1);
      cy.osd.deleteIndex(INDEX_WITH_TIME_2);
    });

    generateAllTestConfigurations(generateDisplayTestConfiguration).forEach((config) => {
      const keywords = ['PPL', 'DQL', 'SQL', 'Lucene'];
      const matchingKeyword = keywords.find((keyword) => config.language.includes(keyword));

      it(`should correctly sidebar metrics components for ${config.testName}`, () => {
        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        cy.measureComponentPerformance({
          page: 'discover',
          componentTestId: 'sidebarPanel',
          eventName: `onDateTimeSearch_${matchingKeyword}`,
          isDynamic: true,
        });
        // testing the datepicker
        if (config.datepicker) {
          cy.getElementByTestId('superDatePickerstartDatePopoverButton').should('be.visible');
        }
      });

      it(`should correctly table metrics components for ${config.testName}`, () => {
        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        cy.measureComponentPerformance({
          page: 'discover',
          componentTestId: 'docTable',
          eventName: `onDateTimeSearch_${matchingKeyword}`,
          isDynamic: true,
        });
        // testing the datepicker
        if (config.datepicker) {
          cy.getElementByTestId('superDatePickerstartDatePopoverButton').should('be.visible');
        }
      });
    });
  });
};

prepareTestSuite('Performance testing', runSavedSearchTests);
