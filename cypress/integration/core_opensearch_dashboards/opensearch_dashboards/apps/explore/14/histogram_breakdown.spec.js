/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  DATASOURCE_NAME,
} from '../../../../../../utils/apps/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import { generateHistogramTestConfigurations } from '../../../../../../utils/apps/explore/histogram_interaction';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspace = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const runHistogramBreakdownTests = () => {
  // THe tests have some issues in Neo, They are currently skipped Need to revisit them again.
  describe('histogram breakdown', () => {
    before(() => {
      // Create workspace and dataset using our new helper function
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspace,
        datasetId,
        INDEX_PATTERN_WITH_TIME, // Uses 'data_logs_small_time_*'
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspace,
        page: 'explore/logs',
        isEnhancement: true,
      });

      cy.setAdvancedSetting({
        'explore:experimental': true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace, [INDEX_WITH_TIME_1]);
    });

    generateAllTestConfigurations(generateHistogramTestConfigurations).forEach((config) => {
      it(`select and clear breakdown field and verify histogram for ${config.testName}`, () => {
        if (!config.isHistogramVisible) return;

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        cy.getElementByTestId('discoverChart').should('be.visible');

        cy.getElementByTestId('histogramBreakdownFieldSelector').click();
        cy.get('.euiComboBoxOptionsList').contains('category').click();

        cy.getElementByTestId('histogramBreakdownFieldSelector').should('contain', 'category');
        cy.getElementByTestId('discoverChart').should('be.visible');

        cy.getElementByTestId('histogramBreakdownFieldSelector')
          .find('button.euiFormControlLayoutClearButton')
          .click();

        cy.getElementByTestId('histogramBreakdownFieldSelector').should('not.contain', 'category');
        cy.getElementByTestId('discoverChart').should('be.visible');
      });

      //
      it(`check breakdown persistence with interval changes for ${config.testName}`, () => {
        if (!config.isHistogramVisible) return;

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        cy.getElementByTestId('histogramBreakdownFieldSelector').click();
        cy.get('.euiComboBoxOptionsList').contains('category').click();

        const intervals = ['auto', 'h', 'd'];
        intervals.forEach((interval) => {
          cy.getElementByTestId('discoverIntervalSelect').select(interval);

          cy.getElementByTestId('histogramBreakdownFieldSelector').should('contain', 'category');
          cy.getElementByTestId('discoverChart').should('be.visible');
        });
      });

      it(`check breakdown persistence with collapse/expand for ${config.testName}`, () => {
        if (!config.isHistogramVisible) return;

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        cy.getElementByTestId('histogramBreakdownFieldSelector').click();
        cy.get('.euiComboBoxOptionsList').contains('category').click();

        cy.getElementByTestId('histogramCollapseBtn').click();
        cy.getElementByTestId('discoverChart').should('not.exist');
        cy.getElementByTestId('histogramBreakdownFieldSelector').should('contain', 'category');

        cy.getElementByTestId('histogramCollapseBtn').click();
        cy.getElementByTestId('discoverChart').should('be.visible');
        cy.getElementByTestId('histogramBreakdownFieldSelector').should('contain', 'category');
      });

      it(`check breakdown persistence with time range changes for ${config.testName}`, () => {
        if (!config.isHistogramVisible) return;

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        cy.getElementByTestId('histogramBreakdownFieldSelector').click();
        cy.get('.euiComboBoxOptionsList').contains('category').click();

        const START_DATE = 'Jan 1, 2021 @ 13:00:00.000';
        const END_DATE = 'Oct 1, 2021 @ 13:00:00.000';
        cy.explore.setTopNavDate(START_DATE, END_DATE);

        cy.getElementByTestId('histogramBreakdownFieldSelector').should('contain', 'category');
        cy.getElementByTestId('discoverChart').should('be.visible');
      });
    });
  });
};

prepareTestSuite('Histogram Breakdown', runHistogramBreakdownTests);
