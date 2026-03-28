/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  START_TIME,
  END_TIME,
} from '../../../../../utils/apps/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../utils/apps/query_enhancements/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../utils/helpers';

const workspace = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();
const indexPattern = `${INDEX_WITH_TIME_1}*`;

const discoverApplyFilterTestSuite = () => {
  describe('discover apply filter', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspace,
        datasetId,
        indexPattern,
        'timestamp',
        'logs',
        ['use-case-search']
      );
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspace,
        page: 'data-explorer/discover',
        isEnhancement: true,
      });
      cy.setIndexPatternAsDataset(indexPattern, DATASOURCE_NAME);
      cy.setQueryLanguage('DQL');
      cy.osd.waitForLoader(true);
      cy.get('body').click({ force: true });
      cy.intercept('POST', '**/internal/search/**').as('initialSearch');
      cy.osd.setTopNavDate(START_TIME, END_TIME);
      cy.wait('@initialSearch');
      cy.osd.waitForLoader(true);
    });

    afterEach(() => {
      cy.window().then((win) => win.sessionStorage.clear());
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace);
    });

    it('should add an inclusive filter from sidebar and show filter pill', () => {
      cy.getElementByTestId('docTable').should('be.visible');

      cy.getElementByTestId('field-category-showDetails').click({ force: true });

      cy.intercept('POST', '**/internal/search/**').as('filterSearch');
      cy.get('[data-test-subj^="plus-category-"]', { timeout: 10000 }).first().click();
      cy.wait('@filterSearch', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

      cy.get('[data-test-subj*="filter-key-category"]', { timeout: 30000 })
        .should('exist')
        .invoke('attr', 'data-test-subj')
        .should('contain', 'filter-enabled')
        .and('not.contain', 'filter-negated');

      cy.getElementByTestId('docTable').should('be.visible');
      cy.getElementByTestId('docTableField').first().invoke('text').should('not.be.empty');
    });

    it('should add an exclusive filter from sidebar and show negated filter pill', () => {
      cy.getElementByTestId('docTable').should('be.visible');

      cy.getElementByTestId('field-category-showDetails').click({ force: true });

      cy.intercept('POST', '**/internal/search/**').as('filterSearch');
      cy.get('[data-test-subj^="minus-category-"]', { timeout: 10000 }).first().click();
      cy.wait('@filterSearch', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

      cy.get('[data-test-subj*="filter-key-category"]', { timeout: 30000 })
        .should('exist')
        .invoke('attr', 'data-test-subj')
        .should('contain', 'filter-enabled')
        .and('contain', 'filter-negated');

      cy.getElementByTestId('docTable').should('be.visible');
    });

    it('should remove a filter and restore unfiltered results', () => {
      cy.getElementByTestId('field-category-showDetails').click({ force: true });

      cy.intercept('POST', '**/internal/search/**').as('filterSearch');
      cy.get('[data-test-subj^="plus-category-"]', { timeout: 10000 }).first().click();
      cy.wait('@filterSearch', { timeout: 60000 });

      cy.get('[data-test-subj*="filter-key-category"]', { timeout: 30000 }).should('exist');

      cy.intercept('POST', '**/internal/search/**').as('removeFilterSearch');
      cy.get('[data-test-subj*="filter-key-category"]').click();
      cy.contains('Delete').click({ force: true });
      cy.wait('@removeFilterSearch', { timeout: 60000 })
        .its('response.statusCode')
        .should('eq', 200);

      cy.get('[data-test-subj*="filter-key-category"]').should('not.exist');
      cy.getElementByTestId('docTable').should('be.visible');
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          expect(parseInt(text.replace(/,/g, ''), 10)).to.be.greaterThan(0);
        });
    });
  });
};

prepareTestSuite('Discover Apply Filter', discoverApplyFilterTestSuite);
