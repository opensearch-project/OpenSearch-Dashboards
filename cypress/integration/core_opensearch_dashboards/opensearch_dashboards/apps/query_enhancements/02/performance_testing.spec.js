/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
} from '../../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { generateDisplayTestConfiguration } from '../../../../../../utils/apps/query_enhancements/language_specific_display';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const runSavedSearchTests = () => {
  describe('Performance testing', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'discover',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
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
          eventName: `onPageLoad_${matchingKeyword}`,
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
          eventName: `onPageLoad_${matchingKeyword}`,
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
