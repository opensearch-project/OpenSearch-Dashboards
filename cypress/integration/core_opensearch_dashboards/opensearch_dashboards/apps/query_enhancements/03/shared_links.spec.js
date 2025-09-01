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
} from '../../../../../../utils/apps/query_enhancements/shared';
import { QueryLanguages } from '../../../../../../utils/apps/query_enhancements/constants';
import { selectFieldFromSidebar } from '../../../../../../utils/apps/query_enhancements/sidebar';
import {
  verifyShareUrl,
  openShareMenuWithRetry,
} from '../../../../../../utils/apps/query_enhancements/shared_links';
import { setSort } from '../../../../../../utils/apps/query_enhancements/table';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

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
        page: 'discover',
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

        it(`should handle shared document links correctly for ${config.testName}`, () => {
          // Setup
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);

          if (config.hasDocLinks) {
            // Test surrounding documents link
            cy.get('tbody tr')
              .first()
              .find('[data-test-subj="docTableExpandToggleColumn"] button')
              .click();

            cy.getElementByTestId('docTableRowAction-0')
              .should('exist')
              .and('contain.text', 'View surrounding documents')
              .invoke('removeAttr', 'target')
              .click();
            cy.url().should('include', '/context/');
            cy.go('back');

            // Test single document link
            cy.get('tbody tr')
              .first()
              .find('[data-test-subj="docTableExpandToggleColumn"] button')
              .click();

            cy.getElementByTestId('docTableRowAction-1')
              .should('exist')
              .and('contain.text', 'View single document')
              .invoke('removeAttr', 'target')
              .click();
            cy.url().should('include', '/doc/');
            cy.go('back');
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
          cy.getElementByTestId('dscCanvas').scrollTo('top', { ensureScrollable: false });

          // Set query
          cy.setQueryEditor(queryString, { parseSpecialCharSequences: false });

          // Set filter for DQL/Lucene
          if (config.hasDocLinks) {
            cy.submitFilterFromDropDown(testData.filter[0], 'is', testData.filter[1], true);
          }

          // Add fields from side panel
          testData.fields.forEach((field, i) => {
            selectFieldFromSidebar(field);
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
