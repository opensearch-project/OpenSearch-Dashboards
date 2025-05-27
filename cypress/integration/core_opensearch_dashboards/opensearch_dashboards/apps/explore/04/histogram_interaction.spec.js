/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  START_TIME,
  END_TIME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  QueryLanguages,
  DATASOURCE_NAME,
} from '../../../../../../utils/apps/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { generateHistogramTestConfigurations } from '../../../../../../utils/apps/query_enhancements/histogram_interaction';
import { DatasetTypes } from '../../../../../../utils/apps/query_enhancements/constants';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { generateAllExploreTestConfigurations } from '../../../../../../utils/apps/explore/shared';

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
        page: 'explore',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace, [INDEX_WITH_TIME_1]);
    });

    generateAllExploreTestConfigurations(generateHistogramTestConfigurations).forEach((config) => {
      it(`check histogram visibility for ${config.testName}`, () => {
        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        if (config.isHistogramVisible) {
          cy.getElementByTestId('dscChartChartheader').should('be.visible');
          cy.getElementByTestId('discoverChart').should('be.visible');
        } else {
          cy.getElementByTestId('dscChartChartheader').should('not.exist');
          cy.getElementByTestId('discoverChart').should('not.exist');
        }
        // check interval selection persistence across language changes.
        // Only need to check for INDEX_PATTERNS because INDEXES
        // only supports SQL & PPL, and only one of the two supports histogram.
        if (config.isHistogramVisible && config.datasetType === DatasetTypes.INDEX_PATTERN.name) {
          cy.getElementByTestId('discoverIntervalSelect').select('Week');
          cy.getElementByTestId('discoverIntervalDateRange').contains(
            `${START_TIME} - ${END_TIME} per`
          );
          for (const language of DatasetTypes.INDEX_PATTERN.supportedLanguages) {
            if (language.name === QueryLanguages.SQL.name) continue;
            cy.setQueryLanguage(language.name);
            cy.wait(1000); // wait a bit to ensure data is loaded
            if (language.supports.histogram) {
              cy.getElementByTestId('discoverIntervalSelect').select('Week');
              cy.getElementByTestId('discoverIntervalDateRange').contains(
                `${START_TIME} - ${END_TIME} per`
              );
            }
          }
        }
      });

      it(`check the Auto interval value for ${config.testName}`, () => {
        if (!config.isHistogramVisible) return;
        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        const intervals = ['auto', 'ms', 's', 'm', 'h', 'd', 'w', 'M', 'y'];
        cy.getElementByTestId('discoverIntervalSelect').should('have.value', intervals[0]);
        intervals.forEach((interval) => {
          cy.getElementByTestId('discoverIntervalSelect').select(interval);
          cy.wait(1000); // adding a wait here to ensure the data has been updated
          config.langPermutation.forEach((lang) => {
            if (lang === QueryLanguages.SQL.name) return; // SQL doesn't have a histogram
            cy.setQueryLanguage(lang);
            cy.getElementByTestId('discoverIntervalSelect').should('have.value', interval);
            cy.getElementByTestId('discoverIntervalDateRange').should('be.visible');
          });
        });
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
        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.setQueryLanguage(config.language);
        if (config.isHistogramVisible) {
          // TODO: related bug
          // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9294
          if (config.language !== 'PPL') {
            // remove after the bug is fixed
            cy.osd.setTopNavDate(START_DATE, END_DATE);
            cy.wait(1000); // adding a wait here to ensure the data has been updated
            checkIntervals();
            cy.getElementByTestId('discoverQueryHits').then(($hits) => {
              const hitsTxt = $hits.text();
              const langs = config.langPermutation;
              langs.splice(langs.indexOf('PPL'), 1); // TODO: remove after the bug is fixed
              langs.forEach((lang) => {
                if (lang === QueryLanguages.SQL.name) return; // SQL doesn't have a histogram
                cy.setQueryLanguage(lang);
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
        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.setQueryLanguage(config.language);
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
          config.langPermutation.forEach((lang) => {
            if (lang === QueryLanguages.SQL.name) return; // SQL doesn't have a histogram
            cy.setQueryLanguage(lang);
            cy.getElementByTestId('dscChartChartheader').should('be.visible');
            cy.getElementByTestId('discoverChart').should(permutation[perm]);
            // TODO: Uncomment after reload bug is fixed
            //cy.reload(); // should not remove cache for the test to be meaningful
            //cy.getElementByTestId('discoverChart').should(permutation[perm]);
            //cy.getElementByTestId('histogramCollapseBtn').should(permutation[perm]);
          });
          if (perm === 'collapse') {
            // start again from the beginning and expand again
            cy.setQueryLanguage(config.language);
            cy.getElementByTestId('histogramCollapseBtn').should('be.visible').click();
          }
        });
      });
    });
  });
};

prepareTestSuite('Histogram interaction', runHistogramInteractionTests);
