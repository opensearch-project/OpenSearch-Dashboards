/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
} from '../../../../../utils/apps/constants';
import { SECONDARY_ENGINE, BASE_PATH } from '../../../../../utils/constants';
import { NEW_SEARCH_BUTTON } from '../../../../../utils/dashboards/data_explorer/elements.js';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../utils/apps/query_enhancements/shared';
import { generateHistogramInteractionTestConfiguration } from '../../../../../utils/apps/query_enhancements/histogram_interaction';
const workspace = getRandomizedWorkspaceName();

describe('histogram interaction', { testIsolation: true }, () => {
  beforeEach(() => {
    // Load test data
    cy.setupTestData(
      SECONDARY_ENGINE.url,
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.mapping.json'],
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.data.ndjson']
    );

    // Add data source
    cy.addDataSource({
      name: DATASOURCE_NAME,
      url: `${SECONDARY_ENGINE.url}`,
      authType: 'no_auth',
    });
    // Create workspace
    cy.deleteWorkspaceByName(workspace);
    cy.visit('/app/home');
    cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspace);
    cy.wait(2000);
    cy.createWorkspaceIndexPatterns({
      workspaceName: workspace,
      indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
      timefieldName: 'timestamp',
      indexPatternHasTimefield: true,
      dataSource: DATASOURCE_NAME,
      isEnhancement: true,
    });
    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: workspace,
      page: 'discover',
      isEnhancement: true,
    });
    cy.getElementByTestId(NEW_SEARCH_BUTTON).click();
  });

  afterEach(() => {
    cy.deleteWorkspaceByName(workspace);
    cy.deleteDataSourceByName(DATASOURCE_NAME);
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteIndex(INDEX_WITH_TIME_1);
  });

  generateAllTestConfigurations(generateHistogramInteractionTestConfiguration).forEach((config) => {
    const selectLangs = () => {
      let langs = [];
      if (config.datasetType === 'INDEXES') {
        langs = ['PPL'];
      } else {
        langs = ['DQL', 'Lucene', 'PPL'];
        langs.splice(langs.indexOf(config.language), 1); // remove current lang to iterate over the other two only
      }
      return langs;
    };

    it(`check histogram visibility for ${config.testName}`, () => {
      cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
      cy.setQueryLanguage(config.language);
      setDatePickerDatesAndSearchIfRelevant(config.language);
      const assertionByLang = {
        DQL: 'be.visible',
        Lucene: 'be.visible',
        'OpenSearch SQL': 'not.exist',
        PPL: 'be.visible',
      };
      const assertion = assertionByLang[config.language];
      cy.getElementByTestId('dscChartChartheader').should(assertion);
      cy.getElementByTestId('discoverChart').should(assertion);
      // check interval selection persistence
      // skipping SQL because it has no histogram, and PPL for indeces because permutations are unnecesary
      if (
        config.language !== 'OpenSearch SQL' &&
        !(config.datasetType === 'INDEXES' && config.language === 'PPL')
      ) {
        cy.getElementByTestId('discoverIntervalSelect').select('Week');
        cy.getElementByTestId('discoverIntervalDateRange')
          .should('be.visible')
          .then(($range) => {
            cy.wrap($range)
              .invoke('text')
              .then(($originalRangeTxt) => {
                selectLangs().forEach((lang) => {
                  cy.setQueryLanguage(lang);
                  cy.wait(1000); // wait for the text update, if any
                  cy.getElementByTestId('discoverIntervalDateRange').then(($currentRange) => {
                    cy.wrap($currentRange)
                      .invoke('text')
                      .then(($currentRangeTxt) => {
                        expect($currentRangeTxt).to.equal($originalRangeTxt);
                      });
                    // TO DO: interact with the inner histogram
                  });
                });
              });
          });
      }
    });

    it(`check the Auto interval value for ${config.testName}`, () => {
      if (config.language !== 'OpenSearch SQL') {
        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        selectLangs().forEach((lang) => {
          cy.setQueryLanguage(lang);
          cy.wait(1000);
          cy.getElementByTestId('discoverIntervalSelect').should('have.value', 'auto');
          cy.getElementByTestId('discoverIntervalDateRange').should('be.visible');
          // TO DO: check histogram visualization
        });
      }
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
      if (config.language !== 'OpenSearch SQL') {
        if (config.language !== 'PPL') {
          // remove after the bug is fixed
          cy.setTopNavDate(START_DATE, END_DATE);
          cy.wait(1000);
          checkIntervals();
          cy.getElementByTestId('discoverQueryHits').then(($hits) => {
            const hitsTxt = $hits.text();
            const langs = selectLangs();
            langs.splice(langs.indexOf('PPL'), 1); // remove after the bug is fixed
            langs.forEach((lang) => {
              cy.setQueryLanguage(lang);
              cy.wait(1000);
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
      if (config.language !== 'OpenSearch SQL') {
        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        cy.getElementByTestId('dscChartChartheader').should('be.visible');
        cy.getElementByTestId('discoverChart').should('be.visible');
        cy.getElementByTestId('histogramCollapseBtn').should('be.visible').click();
        cy.getElementByTestId('dscChartChartheader').should('be.visible');
        cy.getElementByTestId('discoverChart').should('not.exist');

        const langs = selectLangs();
        const permutation = {
          collapse: 'not.exist',
          expand: 'be.visible',
        };
        Object.keys(permutation).forEach((perm) => {
          langs.forEach((lang) => {
            cy.setQueryLanguage(lang);
            cy.getElementByTestId('dscChartChartheader').should('be.visible');
            cy.getElementByTestId('discoverChart').should(permutation[perm]);
            // Uncomment after reload bug is fixed
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
      }
    });
  });
});
