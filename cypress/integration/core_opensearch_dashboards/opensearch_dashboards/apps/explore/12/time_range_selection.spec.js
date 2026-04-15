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
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import { generateTimeRangeTestConfiguration } from '../../../../../../utils/apps/explore/time_range_selection';
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
        INDEX_PATTERN_WITH_TIME, // Uses 'data_logs_small_time_*'
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
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
    });

    generateAllTestConfigurations(generateTimeRangeTestConfiguration).forEach((config) => {
      it(`Time Range Selection using the quick select menu ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore/logs',
          isEnhancement: true,
        });

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

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
          page: 'explore/logs',
          isEnhancement: true,
        });

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

        if (config.language.supports.datepicker) {
          cy.explore.setRelativeTopNavDate(15, 'Years ago');
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
          page: 'explore/logs',
          isEnhancement: true,
        });

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

        if (config.language.supports.datepicker) {
          cy.explore.setTopNavDate('Nov 29, 2021 @ 00:00:00.000', 'Dec 29, 2023 @ 00:00:00.000');
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
