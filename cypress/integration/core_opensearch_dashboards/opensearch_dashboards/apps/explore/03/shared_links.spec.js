/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Shared Links', () => {
  let testResources = {};
  const savedSearchName = `shared_search_${Date.now()}`;

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
      cy.core.waitForDatasetsToLoad();
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  it('should persist state in shared links', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    // Set query
    const query = `source = ${INDEX_PATTERN_WITH_TIME} | where bytes_transferred > 9950`;
    cy.explore.setQueryEditor(query, { parseSpecialCharSequences: false });

    // Add fields
    cy.getElementByTestId('field-service_endpoint').click();
    cy.getElementByTestId('field-response_time').click();

    // Test snapshot URL
    cy.getElementByTestId('shareTopNavButton').click();
    cy.getElementByTestId('sharePanel').should('be.visible');

    cy.getElementByTestId('copyShareUrlButton')
      .invoke('attr', 'data-share-url')
      .then((url) => {
        expect(url).to.include('_a=');
        expect(url).to.include('_g=');
        expect(url).to.include(testResources.workspaceId);
      });

    // Test short URL
    cy.getElementByTestId('useShortUrl').click();
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
        expect(redirectUrl).to.include('_a=');
        expect(redirectUrl).to.include('_g=');
      });

    // Save search first
    cy.get('body').type('{esc}'); // Close share panel
    cy.getElementByTestId('discoverSaveButton').click();
    cy.getElementByTestId('savedObjectTitle').type(savedSearchName);
    cy.getElementByTestId('confirmSaveSavedObjectButton').click();
    cy.getElementByTestId('savedExploreSuccess').should('be.visible');

    // Test saved object URL
    cy.getElementByTestId('shareTopNavButton').click();
    cy.getElementByTestId('exportAsSavedObject').should('not.be.disabled').click();

    cy.url().then((url) => {
      const viewMatch = url.match(/\/view\/([^?#]+)/);
      expect(viewMatch).to.not.be.null;

      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        .should('include', `/view/${viewMatch[1]}`);
    });
  });
});
