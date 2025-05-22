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
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/query_enhancements/shared';
import { generateTimeRangeTestConfiguration } from '../../../../../../utils/apps/query_enhancements/time_range_selection';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { generateAllExploreTestConfigurations } from '../../../../../../utils/apps/explore/shared';

const workspaceName = getRandomizedWorkspaceName();

export const runTimeRangeSelectionTests = () => {
  describe('Time Range Selection Tests', () => {
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

    generateAllExploreTestConfigurations(generateTimeRangeTestConfiguration).forEach((config) => {
      it(`Time Range Selection using the quick select menu ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore',
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
          page: 'explore',
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
          page: 'explore',
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
