/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  END_TIME,
  START_TIME,
  INDEX_PATTERN_WITH_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('AI Editor', () => {
  const query = `source=${INDEX_PATTERN_WITH_TIME} | where bytes_transferred > 9000`;
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  beforeEach(() => {
    cy.intercept('GET', '**/enhancements/assist/languages*', {
      statusCode: 200,
      body: {
        configuredLanguages: ['PPL'],
      },
    });
    cy.intercept('POST', '**/enhancements/assist/generate', {
      statusCode: 200,
      body: {
        query,
      },
    });
  });

  describe('Language mode switching', () => {
    before(() => {
      cy.getElementByTestId('discoverNewButton').click();
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);
    });

    it('starts in PPL mode by default', () => {
      cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('PPL');
    });

    it('switches to AI mode when space key is pressed', () => {
      cy.explore.setQueryEditor(' ');
      cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('AI');
    });

    it('returns to PPL mode when escape key is pressed', () => {
      cy.explore.setQueryEditor('{esc}');
      cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('PPL');
    });

    it('switches to AI mode using toggle button', () => {
      cy.getElementByTestId('queryPanelFooterLanguageToggle').click();
      cy.getElementByTestId('queryPanelFooterLanguageToggle-AI').click();
      cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('AI');
    });
  });

  it('executes natural language query in AI mode', () => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.explore.setTopNavDate(START_TIME, END_TIME, false);
    cy.explore.setQueryEditor(' give me all errors');
    cy.getElementByTestId('exploreTabs').should('exist');
    cy.verifyHitCount('992');
    cy.getElementByTestId('exploreQueryPanelGeneratedQuery').contains(query);

    // check to see if the "Edit query" button works
    cy.getElementByTestId('exploreQueryPanelGeneratedQueryEditButton').click();
    cy.getElementByTestId('exploreQueryPanelEditor').should('be.visible');
    cy.getElementByTestId('exploreQueryPanelEditor').should(
      'contain.text',
      `source=${INDEX_PATTERN_WITH_TIME}`
    );
  });

  it('adds filters through field selection in AI mode', () => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.explore.setTopNavDate(START_TIME, END_TIME, false);

    // fire query so that we have data to add filter on
    cy.explore.updateTopNav({ log: false });
    cy.explore.setQueryEditor(' give me all errors');

    cy.getElementByTestId('exploreTabs').should('exist');
    cy.getElementByTestId('field-category-showDetails').click({ force: true });
    cy.getElementByTestId('plus-category-Network').click();
    cy.getElementByTestId('exploreQueryPanelEditor').should('contain.text', 'category');
    cy.getElementByTestId('exploreQueryPanelEditor').should('contain.text', 'is');
    cy.getElementByTestId('exploreQueryPanelEditor').should('contain.text', "'Network'");
  });
});
