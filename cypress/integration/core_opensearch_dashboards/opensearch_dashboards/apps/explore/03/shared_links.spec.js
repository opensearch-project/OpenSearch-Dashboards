/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  INDEX_PATTERN_WITH_TIME_1,
  DATASOURCE_NAME,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  generateAllTestConfigurations,
  setDatePickerDatesAndSearchIfRelevant,
  setHistogramIntervalIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import { selectFieldFromSidebar } from '../../../../../../utils/apps/explore/sidebar';
import {
  verifyShareUrl,
  openShareMenuWithRetry,
} from '../../../../../../utils/apps/explore/shared_links';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const generateShareUrlsTestConfiguration = (dataset, datasetType, language) => {
  const baseConfig = {
    dataset,
    datasetType,
    language: language.name,
    apiLanguage: language.apiName,
    hasDocLinks: false,
    testName: `${language.name}-${datasetType}`,
    saveName: `${language.name}-${datasetType}`,
  };

  return {
    ...baseConfig,
  };
};

const getQueryString = (config) => {
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
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    generateAllTestConfigurations(generateShareUrlsTestConfiguration, {
      indexPattern: INDEX_PATTERN_WITH_TIME_1,
      index: INDEX_WITH_TIME_1,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        const queryString = getQueryString(config);

        it(`should persist state in shared links for ${config.testName}`, () => {
          // Set dataset and language
          cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          setDatePickerDatesAndSearchIfRelevant(config.language);

          // Set interval
          setHistogramIntervalIfRelevant(config.language, testData.interval);

          // scroll to top
          cy.getElementByTestId('discoverTable').scrollTo('top', { ensureScrollable: false });

          // Set query
          cy.explore.setQueryEditor(queryString, { parseSpecialCharSequences: false });

          // Add fields from side panel
          testData.fields.forEach((field) => {
            selectFieldFromSidebar(field);
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
          // Need to wait for short url to generate
          cy.wait(2000);
          cy.getElementByTestId('copyShareUrlButton')
            .invoke('attr', 'data-share-url')
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
          cy.osd.waitForLoader(true);
          openShareMenuWithRetry();
          cy.getElementByTestId('exportAsSavedObject').find('input').should('not.be.disabled');
          cy.getElementByTestId('exportAsSavedObject').click();
          // Get saved explore ID
          cy.url().then((url) => {
            const viewMatch = url.match(/\/view\/([^?#]+)/);
            const savedExploreId = viewMatch ? viewMatch[1] : '';

            // Verify ID exists and is properly formatted
            expect(savedExploreId).to.not.be.empty;

            cy.getElementByTestId('copyShareUrlButton')
              .invoke('attr', 'data-share-url')
              .then((shareUrl) => {
                expect(shareUrl).to.include(`/view/${savedExploreId}`);
              });
          });
        });
      });
    });
  });
};

prepareTestSuite('Shared Links', runSharedLinksTests);
