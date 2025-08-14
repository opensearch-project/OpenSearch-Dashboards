/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  END_TIME,
  INDEX_WITH_TIME_1,
  START_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('AI Editor', () => {
  const index = INDEX_WITH_TIME_1;
  const generatedQuery = 'source=data_logs_small_time_* | where bytes_transferred > 9000';

  before(() => {
    cy.core.setupTestResources({
      index,
    });

    cy.get('@WORKSPACE_ID').then((workspaceId) => {
      cy.visit(`/w/${workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
    });
  });

  after(() => {
    // cy.core.cleanupTestResources({ index });
  });

  beforeEach(() => {
    // mock AI mode enablement
    cy.intercept('GET', '**/enhancements/assist/languages*', {
      statusCode: 200,
      body: {
        configuredLanguages: ['PPL'],
      },
    });
    // mock generated PPL
    cy.intercept('POST', '**/enhancements/assist/generate', {
      statusCode: 200,
      body: {
        query: generatedQuery,
      },
    });
  });

  it('should be able to query via AI mode', () => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.explore.setTopNavDate(START_TIME, END_TIME, false);
    cy.explore.setQueryEditor(' give me all errors');
    cy.getElementByTestId('exploreTabs').should('exist');
    cy.verifyHitCount('992');
    cy.getElementByTestId('exploreQueryPanelGeneratedQuery').contains(generatedQuery);

    // check to see if the "Edit query" button works
    cy.getElementByTestId('exploreQueryPanelGeneratedQueryEditButton').click();
    cy.getElementByTestId('exploreQueryPanelEditor').should('be.visible');
    cy.getElementByTestId('exploreQueryPanelEditor').should(
      'contain.text',
      'source=data_logs_small_time_*'
    );
  });

  it('should be able to toggle between editor modes', () => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.explore.setTopNavDate(START_TIME, END_TIME, false);

    cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('AI');

    // Test via keyboard clicks
    cy.explore.setQueryEditor('{esc}');
    cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('PPL');
    cy.explore.setQueryEditor(' ');
    cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('AI');

    // Test via toggle
    cy.getElementByTestId('queryPanelFooterLanguageToggle').click();
    cy.getElementByTestId('queryPanelFooterLanguageToggle-PPL').click();
    cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('PPL');
  });

  it('should be able to add a filter in AI mode', () => {
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
