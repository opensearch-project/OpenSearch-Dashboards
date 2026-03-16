/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME_1,
  INDEX_WITH_TIME_1,
} from '../../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  setHistogramIntervalIfRelevant,
  getRandomizedDatasetId,
  resetPageState,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { QueryLanguages } from '../../../../../../utils/apps/query_enhancements/constants';
import { selectFieldFromSidebar } from '../../../../../../utils/apps/query_enhancements/sidebar';
import {
  verifyShareUrl,
  openShareMenuWithRetry,
} from '../../../../../../utils/apps/query_enhancements/shared_links';
import { setSort } from '../../../../../../utils/apps/query_enhancements/table';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const generateShareUrlsTestConfiguration = (dataset, datasetType, language) => {
  const baseConfig = {
    dataset,
    datasetType,
    language: language.name,
    apiLanguage: language.apiName,
    hasDocLinks: [QueryLanguages.DQL.name, QueryLanguages.Lucene.name].includes(language.name),
    testName: `${language.name}-${datasetType}`,
    saveName: `${language.name}-${datasetType}`,
  };

  return {
    ...baseConfig,
  };
};

const getQueryString = (config) => {
  if (config.language === QueryLanguages.DQL.name) {
    return 'bytes_transferred > 9950';
  }
  if (config.language === QueryLanguages.Lucene.name) {
    return 'bytes_transferred: {9950 TO *}';
  }
  if (config.language === QueryLanguages.SQL.name) {
    return `SELECT * FROM ${config.dataset} WHERE bytes_transferred > 9950`;
  }
  return `source = ${config.dataset} | where bytes_transferred > 9950`;
};

export const runSharedLinksTests = () => {
  describe('discover sharing tests', () => {
    const testData = {
      fields: ['service_endpoint'],
      sort: ['asc'],
      interval: 'w',
      filter: ['category', 'Network'],
    };

    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        `${INDEX_WITH_TIME_1}*`,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-search'] // features
      );

      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'data-explorer/discover',
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      // Only navigate if not already on the correct page
      cy.url().then((currentUrl) => {
        if (!currentUrl.includes('data-explorer/discover')) {
          cy.osd.navigateToWorkSpaceSpecificPage({
            workspaceName: workspaceName,
            page: 'data-explorer/discover',
            isEnhancement: true,
          });
        } else {
          resetPageState();
        }
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    generateAllTestConfigurations(generateShareUrlsTestConfiguration, {
      indexPattern: INDEX_PATTERN_WITH_TIME_1,
      index: INDEX_WITH_TIME_1,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        const queryString = getQueryString(config);

        it(`should handle shared document links correctly for ${config.testName}`, () => {
          // Setup
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);

          cy.osd.waitForLoader(true);

          // Wait for data to load before interacting with table rows
          cy.get('tbody tr', { timeout: 30000 }).should('have.length.at.least', 1);

          if (config.hasDocLinks) {
            // Test surrounding documents link
            cy.get('tbody tr')
              .first()
              .find('[data-test-subj="docTableExpandToggleColumn"] button')
              .click();

            // Verify surrounding documents link exists and has correct text
            cy.getElementByTestId('docTableRowAction-0')
              .should('exist')
              .and('contain.text', 'View surrounding documents');

            // Test single document link without navigation (just verify it exists)
            cy.getElementByTestId('docTableRowAction-1')
              .should('exist')
              .and('contain.text', 'View single document');
          } else {
            // Verify no document links for SQL/PPL
            cy.get('tbody tr')
              .first()
              .find('[data-test-subj="docTableExpandToggleColumn"] button')
              .click();
            cy.getElementByTestId('docTableRowAction-0').should('not.exist');
            cy.getElementByTestId('docTableRowAction-1').should('not.exist');
          }
        });

        it(`should persist state in shared links for ${config.testName}`, () => {
          // Set dataset and language
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);

          // Set interval
          setHistogramIntervalIfRelevant(config.language, testData.interval);

          // scroll to top
          cy.getElementByTestId('dscCanvas').scrollTo('top', {
            ensureScrollable: false,
          });

          // Set query
          cy.setQueryEditor(queryString, { parseSpecialCharSequences: false });

          // Set filter for DQL/Lucene
          if (config.hasDocLinks) {
            cy.submitFilterFromDropDown(testData.filter[0], 'is', testData.filter[1], true);

            cy.osd.waitForLoader(true);
          }

          // Add fields from side panel
          testData.fields.forEach((field, i) => {
            selectFieldFromSidebar(field);
            cy.wait(6000);
            if (config.hasDocLinks) {
              setSort(field, testData.sort[i]);
            }
          });

          // Test snapshot url
          openShareMenuWithRetry();

          cy.getElementByTestId('copyShareUrlButton')
            .invoke('attr', 'data-share-url')
            .then((url) => {
              verifyShareUrl(url, config, testData, DATASOURCE_NAME, queryString);
            });

          // Test short url
          cy.getElementByTestId('useShortUrl').click();

          // Wait for short URL to be generated (watch for attribute change)
          cy.wait(2000); // Give time for short URL generation

          cy.getElementByTestId('copyShareUrlButton')
            .then(($el) => {
              const shareUrl = $el.attr('data-share-url');
              expect(shareUrl).to.exist;
              expect(shareUrl).to.not.be.empty;
              return shareUrl;
            })
            .then((shareUrl) => {
              return cy.request({
                url: shareUrl,
                followRedirect: false,
              });
            })
            .then((response) => {
              const redirectUrl = response.headers.location;
              verifyShareUrl(redirectUrl, config, testData, DATASOURCE_NAME, queryString);
            });

          // Test saved object url
          // Before save, export as saved object is disabled
          cy.getElementByTestId('exportAsSavedObject').find('input').should('be.disabled');
          cy.saveSearch(config.saveName);
          cy.loadSaveSearch(config.saveName);
          cy.osd.waitForLoader(true);

          // Wait for saved search to be saved and URL to update
          cy.url().should('include', '/view/', { timeout: 30000 });

          openShareMenuWithRetry();

          // Wait for exportAsSavedObject to be enabled instead of hardcoded 30s wait
          cy.getElementByTestId('exportAsSavedObject')
            .find('input')
            .should('not.be.disabled', { timeout: 10000 });
          cy.getElementByTestId('exportAsSavedObject').click();
          // Get saved search ID
          cy.url().then((url) => {
            const viewMatch = url.match(/\/view\/([^?#]+)/);
            const savedSearchId = viewMatch ? viewMatch[1] : '';

            // Verify ID exists and is properly formatted
            expect(savedSearchId).to.not.be.empty;

            cy.getElementByTestId('copyShareUrlButton')
              .invoke('attr', 'data-share-url')
              .then((shareUrl) => {
                expect(shareUrl).to.include(`/view/${savedSearchId}`);
              });
          });
        });
      });
    });
  });
};

prepareTestSuite('Shared Links', runSharedLinksTests);
