/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { START_TIME, END_TIME, QueryLanguages } from './constants';

const formatDateForUrl = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString();
};

const normalizeQuery = (queryString) => {
  return queryString.replace('\n', ' ').replace(/\s+/g, ' ');
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
  expect(normalizeQuery(q)).to.include(queryString);
  if (config.language === QueryLanguages.PPL.name) {
    expect(q).to.include(`language:${config.language}`);
  }

  // App state checks
  testData.fields.forEach((field) => {
    expect(a).to.include(field);
  });

  // Global state check
  expect(g).to.include(`from:'${formatDateForUrl(START_TIME)}'`);
  expect(g).to.include(`to:'${formatDateForUrl(END_TIME)}'`);
};

/**
 * Opens the share menu with retry mechanism to handle potential timing issues.
 * Retries the click itself (not just the assertion) because EUI popovers can
 * fail to open if another overlay intercepts the click or focus is lost.
 * Before retrying, dismisses any partially rendered popover to avoid the toggle
 * race condition where a retry click closes a menu that just appeared
 * (more likely with React 18's batched/async rendering).
 * @param {number} maxAttempts Maximum number of attempts to open the menu (default: 3)
 */
export const openShareMenuWithRetry = (maxAttempts = 3) => {
  const attemptToOpenMenu = (attempt = 1) => {
    // Check if menu is already open (jQuery .find() is the correct Cypress
    // pattern for conditional testing — it doesn't fail on missing elements)
    cy.get('body').then(($body) => {
      if ($body.find('[data-test-subj="shareContextMenu"]').length > 0) {
        return;
      }

      if (attempt > maxAttempts) {
        throw new Error(`Failed to open share menu after ${maxAttempts} attempts`);
      }

      // Ensure the button is visible and actionable before clicking
      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();

      // Wait for React 18 to flush batched state updates and for
      // EUI popover animation to complete
      cy.wait(2000);

      // Check if menu appeared
      cy.get('body').then(($updatedBody) => {
        if ($updatedBody.find('[data-test-subj="shareContextMenu"]').length === 0) {
          cy.log(`Share menu didn't appear on attempt ${attempt}, retrying...`);
          // Dismiss any partially rendered popover before retrying to prevent
          // the next click from toggling the menu closed
          cy.get('body').click(0, 0);
          cy.wait(500);
          attemptToOpenMenu(attempt + 1);
        }
      });
    });
  };

  attemptToOpenMenu();

  // Final assertion to ensure menu and its elements are present
  cy.getElementByTestId('shareContextMenu').should('be.visible');
  cy.getElementByTestId('exportAsSnapshot').should('exist');
  cy.getElementByTestId('exportAsSavedObject').should('exist');
};
