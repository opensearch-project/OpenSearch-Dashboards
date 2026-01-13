/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME, INDEX_PATTERN_WITH_TIME } from '../../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { generateTimeRangeTestConfiguration } from '../../../../../../utils/apps/query_enhancements/time_range_selection';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

export const runTimeRangeSelectionTests = () => {
  describe('Time Range Selection Tests', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      // Create workspace and dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME, // Uses index pattern
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    afterEach(() => {
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    generateAllTestConfigurations(generateTimeRangeTestConfiguration).forEach((config) => {
      it(`Time Range Selection using the quick select menu ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'data-explorer/discover',
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
          page: 'data-explorer/discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

        cy.setQueryLanguage(config.language.name);

        if (config.language.supports.datepicker) {
          cy.osd.setRelativeTopNavDate(15, 'Years ago');
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
          page: 'data-explorer/discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

        cy.setQueryLanguage(config.language.name);

        if (config.language.supports.datepicker) {
          cy.osd.setTopNavDate('Nov 29, 2021 @ 00:00:00.000', 'Dec 29, 2023 @ 00:00:00.000');
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
