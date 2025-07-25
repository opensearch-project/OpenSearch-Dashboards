/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  QueryLanguages,
  DATASOURCE_NAME,
} from '../../../../../../utils/apps/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import { generateHistogramTestConfigurations } from '../../../../../../utils/apps/explore/histogram_interaction';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspace = getRandomizedWorkspaceName();

const runHistogramInteractionTests = () => {
  describe('histogram interaction', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspace, [INDEX_WITH_TIME_1]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspace,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspace,
        page: 'explore/logs',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace, [INDEX_WITH_TIME_1]);
    });

    generateAllTestConfigurations(generateHistogramTestConfigurations).forEach((config) => {
      it(`check histogram visibility for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        if (config.isHistogramVisible) {
          cy.getElementByTestId('dscChartChartheader').should('be.visible');
          cy.getElementByTestId('discoverChart').should('be.visible');
        } else {
          cy.getElementByTestId('dscChartChartheader').should('not.exist');
          cy.getElementByTestId('discoverChart').should('not.exist');
        }
      });

      it(`check the Auto interval value for ${config.testName}`, () => {
        if (!config.isHistogramVisible) return;
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        const intervals = ['auto', 'ms', 's', 'm', 'h', 'd', 'w', 'M', 'y'];
        cy.getElementByTestId('discoverIntervalSelect').should('have.value', intervals[0]);
        intervals.forEach((interval) => {
          cy.getElementByTestId('discoverIntervalSelect').select(interval);
          cy.wait(1000); // adding a wait here to ensure the data has been updated
          config.langPermutation.forEach((lang) => {
            if (lang === QueryLanguages.SQL.name) return; // SQL doesn't have a histogram
            cy.getElementByTestId('discoverIntervalSelect').should('have.value', interval);
            cy.getElementByTestId('discoverIntervalDateRange').should('be.visible');
          });
        });
        cy.getElementByTestId('discoverIntervalSelect').select('auto');
        // TODO: check histogram visualization
        // Currently it's not possible to check anything INSIDE the histogram with Cypress
      });

      it(`check the time range selection for ${config.testName}`, () => {
        const TIME = '13:00:00.000';
        const START_DATE = `Jan 1, 2021 @ ${TIME}`;
        const END_DATE = `Oct 1, 2021 @ ${TIME}`;
        const checkIntervals = () => {
          cy.getElementByTestId('discoverIntervalDateRange')
            .should('be.visible')
            .and('have.text', `${START_DATE} - ${END_DATE} per`);
          cy.getElementByTestId('docTableExpandToggleColumn')
            .eq(0)
            .find('button')
            .click({ force: true });
          cy.getElementByTestId('tableDocViewRow-timestamp-value').then(($timestamp) => {
            const timestampTxt = $timestamp.text();
            const parsedDate = timestampTxt.split('@');
            const date = parsedDate[0].trim();
            const actualTime = parsedDate[1].trim();
            const parsedExpectedTime = new Date(`1970-01-01T${TIME}`);
            const parsedActualTime = new Date(`1970-01-01T${actualTime}`);
            expect(timestampTxt).to.contain(date);
            expect(parsedActualTime <= parsedExpectedTime).to.equal(true);
          });
          cy.getElementByTestId('docTableExpandToggleColumn')
            .eq(0)
            .find('button')
            .click({ force: true }); // reset state
        };
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        if (config.isHistogramVisible) {
          // TODO: related bug
          // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9294
          if (config.language !== 'PPL') {
            // remove after the bug is fixed
            cy.explore.setTopNavDate(START_DATE, END_DATE);
            cy.wait(1000); // adding a wait here to ensure the data has been updated
            checkIntervals();
            cy.getElementByTestId('discoverQueryHits').then(($hits) => {
              const hitsTxt = $hits.text();
              const langs = config.langPermutation;
              langs.splice(langs.indexOf('PPL'), 1); // TODO: remove after the bug is fixed
              langs.forEach((lang) => {
                if (lang === QueryLanguages.SQL.name) return; // SQL doesn't have a histogram
                cy.wait(1000); // adding a wait here to ensure the data has been updated
                cy.getElementByTestId('discoverQueryHits').should('have.text', hitsTxt);
                checkIntervals();
              });
            });
          }
        } else {
          cy.getElementByTestId('discoverIntervalSelect').should('not.exist');
        }
      });

      it(`check collapse/expand functionality and state persistence for ${config.testName}`, () => {
        if (!config.isHistogramVisible) return;
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        cy.getElementByTestId('dscChartChartheader').should('be.visible');
        cy.getElementByTestId('discoverChart').should('be.visible');
        cy.getElementByTestId('histogramCollapseBtn').should('be.visible').click();
        cy.getElementByTestId('dscChartChartheader').should('be.visible');
        cy.getElementByTestId('discoverChart').should('not.exist');

        const permutation = {
          collapse: 'not.exist',
          expand: 'be.visible',
        };
        Object.keys(permutation).forEach((perm) => {
          config.langPermutation.forEach(() => {
            cy.getElementByTestId('dscChartChartheader').should('be.visible');
            cy.getElementByTestId('discoverChart').should(permutation[perm]);
            // TODO: Uncomment after reload bug is fixed
            //cy.reload(); // should not remove cache for the test to be meaningful
            //cy.getElementByTestId('discoverChart').should(permutation[perm]);
            //cy.getElementByTestId('histogramCollapseBtn').should(permutation[perm]);
          });
          if (perm === 'collapse') {
            // start again from the beginning and expand again
            cy.getElementByTestId('histogramCollapseBtn').should('be.visible').click();
          }
        });
      });
    });
  });
};

prepareTestSuite('Histogram interaction', runHistogramInteractionTests);
