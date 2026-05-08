/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  INDEX_PATTERN_WITH_TIME_1,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
  generateAllTestConfigurations,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const generateFieldStatsTestConfiguration = (dataset, datasetType, language) => {
  const baseConfig = {
    dataset,
    datasetType,
    language: language.name,
    testName: `${language.name}-${datasetType}`,
  };

  return {
    ...baseConfig,
  };
};

export const runFieldStatsTests = () => {
  describe('field statistics tests', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      // Create workspace and dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        `${INDEX_WITH_TIME_1}*`, // Uses index pattern
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
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
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    generateAllTestConfigurations(generateFieldStatsTestConfiguration, {
      indexPattern: INDEX_PATTERN_WITH_TIME_1,
      index: INDEX_WITH_TIME_1,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        beforeEach(() => {
          cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          setDatePickerDatesAndSearchIfRelevant(config.language);
          cy.osd.waitForLoader(true);

          cy.setAdvancedSetting({
            'explore:experimental': true,
          });

          cy.get('#explore_field_stats_tab').click();
          cy.osd.waitForLoader(true);
        });

        it(`should display table with expected fields and allow sorting for ${config.testName}`, () => {
          cy.getElementByTestId('fieldStatsTable').should('be.visible');

          cy.getElementByTestId('fieldStatsTable').should('contain', 'category');
          cy.getElementByTestId('fieldStatsTable').should('contain', 'status_code');
          cy.getElementByTestId('fieldStatsTable').should('contain', 'response_time');
          cy.getElementByTestId('fieldStatsTable').should('contain', 'bytes_transferred');
          cy.getElementByTestId('fieldStatsTable').should('contain', 'timestamp');

          cy.getElementByTestId('fieldStatsTable')
            .contains('th', 'Document Count')
            .should('be.visible');
          cy.getElementByTestId('fieldStatsTable')
            .contains('th', 'Distinct Values')
            .should('be.visible');

          cy.getElementByTestId('fieldStatsTable')
            .find('tbody tr')
            .first()
            .find('td')
            .eq(3)
            .invoke('text')
            .should('match', /\d+.*\(/);

          cy.getElementByTestId('fieldStatsExpandButton-category').should('exist');
          cy.getElementByTestId('fieldStatsExpandButton-status_code').should('exist');
          cy.getElementByTestId('fieldStatsExpandButton-timestamp').should('exist');
        });

        it(`should sort table by different columns for ${config.testName}`, () => {
          cy.getElementByTestId('fieldStatsTable').contains('th', 'Field Name').click();
          cy.getElementByTestId('fieldStatsTable').should('be.visible');
          cy.getElementByTestId('fieldStatsTable').find('tbody tr').should('have.length.gt', 0);

          cy.getElementByTestId('fieldStatsTable').contains('th', 'Document Count').click();
          cy.getElementByTestId('fieldStatsTable').should('be.visible');
          cy.getElementByTestId('fieldStatsTable').find('tbody tr').should('have.length.gt', 0);
        });

        it(`should expand and collapse field rows for ${config.testName}`, () => {
          cy.getElementByTestId('fieldStatsExpandButton-category').click();
          cy.getElementByTestId('fieldStatsRowDetails-category').should('be.visible');

          cy.getElementByTestId('fieldStatsExpandButton-category').click();
          cy.getElementByTestId('fieldStatsRowDetails-category').should('not.exist');
        });

        it(`should expand and collapse multiple field rows for ${config.testName}`, () => {
          cy.getElementByTestId('fieldStatsExpandButton-category').click();
          cy.getElementByTestId('fieldStatsRowDetails-category').should('be.visible');

          cy.getElementByTestId('fieldStatsExpandButton-status_code').scrollIntoView().click();
          cy.getElementByTestId('fieldStatsRowDetails-status_code').should('be.visible');

          cy.getElementByTestId('fieldStatsExpandButton-timestamp').scrollIntoView().click();
          cy.getElementByTestId('fieldStatsRowDetails-timestamp')
            .scrollIntoView()
            .should('be.visible');
        });

        it(`should display expected values for date field details for ${config.testName}`, () => {
          cy.getElementByTestId('fieldStatsExpandButton-timestamp').scrollIntoView().click();
          cy.getElementByTestId('fieldStatsRowDetails-timestamp')
            .scrollIntoView()
            .should('be.visible');

          cy.getElementByTestId('fieldStatsRowDetails-timestamp').then(($panel) => {
            const text = $panel.text().toLowerCase();
            const hasDateRangeContent =
              text.includes('earliest') ||
              text.includes('latest') ||
              text.includes('range') ||
              text.includes('date range');
            expect(hasDateRangeContent).to.be.true;
          });
        });

        it(`should display expected values for number field details for ${config.testName}`, () => {
          cy.getElementByTestId('fieldStatsExpandButton-status_code').scrollIntoView().click();
          cy.getElementByTestId('fieldStatsRowDetails-status_code')
            .scrollIntoView()
            .should('be.visible');

          cy.getElementByTestId('fieldStatsRowDetails-status_code').then(($panel) => {
            const text = $panel.text().toLowerCase();
            const hasExpectedContent =
              text.includes('min') ||
              text.includes('max') ||
              text.includes('average') ||
              text.includes('median') ||
              text.includes('top values') ||
              text.includes('top 10');
            expect(hasExpectedContent).to.be.true;
          });
        });

        it(`should display expected values for string field details for ${config.testName}`, () => {
          cy.getElementByTestId('fieldStatsExpandButton-category').scrollIntoView().click();
          cy.getElementByTestId('fieldStatsRowDetails-category')
            .scrollIntoView()
            .should('be.visible');

          cy.getElementByTestId('fieldStatsRowDetails-category').then(($panel) => {
            const text = $panel.text().toLowerCase();
            const hasTopValuesContent = text.includes('top values') || text.includes('top 10');
            expect(hasTopValuesContent).to.be.true;
          });

          cy.getElementByTestId('fieldStatsRowDetails-category')
            .find('tbody tr')
            .should('have.length.gt', 0);
        });
      });
    });
  });
};

prepareTestSuite('Field Statistics', runFieldStatsTests);
