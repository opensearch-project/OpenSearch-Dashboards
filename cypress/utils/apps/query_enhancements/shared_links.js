/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { START_TIME, END_TIME, QueryLanguages } from './constants';

const formatDateForUrl = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString();
};

/**
 * Verifies share URL parameters based on query language
 * @param {string} url Share URL to verify
 * @param {Object} config Test configuration
 * @param {Object} testData Data that should be in columns
 * @param {string} datasourceName Expected datasource name
 * @param {string} queryString Expected query string
 */
export const verifyShareUrl = (url, config, testData, datasourceName, queryString) => {
  let hashPart = url.split('#')[1];
  if (!hashPart) {
    throw new Error('No hash part in URL');
  }

  // sometimes there is a beginning slash in the hash part that causes test failures. Remove it
  if (hashPart[0] === '/') {
    hashPart = hashPart.substring(1);
  }

  const searchParams = new URLSearchParams(hashPart);
  const q = searchParams.get('_q');
  const a = searchParams.get('_a');
  const g = searchParams.get('_g');

  // Query param checks
  expect(q).to.include(datasourceName);
  expect(q).to.include(config.dataset);
  expect(q).to.include(config.datasetType);
  expect(q).to.include(queryString);
  if (config.language === QueryLanguages.SQL.name) {
    // Not OpenSearch SQL
    expect(q).to.include('language:SQL');
  } else if (config.language === QueryLanguages.PPL.name) {
    expect(q).to.include(`language:${config.language}`);
  } else {
    const expectedLanguage = config.language === QueryLanguages.DQL.name ? 'kuery' : 'lucene';
    expect(q).to.include(`language:${expectedLanguage}`);
    expect(q).to.include(`${testData.filter[0]}:${testData.filter[1]}`);
  }

  // App state checks
  testData.fields.forEach((field, i) => {
    expect(a).to.include(field);
    if ([QueryLanguages.DQL.name, QueryLanguages.Lucene.name].includes(config.language)) {
      expect(a).to.include(`${field},${testData.sort[i]}`);
      expect(a).to.include(`interval:${testData.interval}`);
    }
  });

  // Global state check
  if (config.language !== QueryLanguages.SQL.name) {
    expect(g).to.include(`from:'${formatDateForUrl(START_TIME)}'`);
    expect(g).to.include(`to:'${formatDateForUrl(END_TIME)}'`);
  }
};

/**
 * Opens the share menu with retry mechanism to handle potential timing issues
 * @param {number} maxAttempts Maximum number of attempts to open the menu (default: 3)
 * @throws {Error} If menu fails to open after maximum attempts
 *
 * @example
 * // Open share menu with default 3 retries
 * openShareMenuWithRetry();
 *
 * // Open share menu with custom 5 retries
 * openShareMenuWithRetry(5);
 *
 * TODO:
 * Investigate long-term solutions for share menu flakiness
 */
export const openShareMenuWithRetry = (maxAttempts = 3) => {
  const attemptToOpenMenu = (attempt = 1) => {
    // Check if menu is already open
    cy.get('body').then(($body) => {
      const menuExists = $body.find('[data-test-subj="shareContextMenu"]').length > 0;

      if (menuExists) {
        // Menu is already open, no action needed
        return;
      }

      if (attempt > maxAttempts) {
        throw new Error(`Failed to open share menu after ${maxAttempts} attempts`);
      }

      // Click the share button
      cy.getElementByTestId('shareTopNavButton').click();

      // Wait for animation and verify menu appears
      cy.wait(1000); // Give time for animation

      // Check if menu appeared
      cy.get('body').then(($updatedBody) => {
        const menuOpened = $updatedBody.find('[data-test-subj="shareContextMenu"]').length > 0;

        if (!menuOpened) {
          // Menu didn't appear, retry
          cy.log(`Share menu didn't appear on attempt ${attempt}, retrying...`);
          attemptToOpenMenu(attempt + 1);
        }
      });
    });
  };

  // Start the retry process
  attemptToOpenMenu();

  // Once menu is open, verify expected elements are present
  cy.getElementByTestId('shareContextMenu').should('exist');
  cy.getElementByTestId('exportAsSnapshot').should('exist');
  cy.getElementByTestId('exportAsSavedObject').should('exist');
};
