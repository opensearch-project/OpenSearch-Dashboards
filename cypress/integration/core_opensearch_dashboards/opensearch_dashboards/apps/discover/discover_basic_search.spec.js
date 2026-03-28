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

const discoverBasicSearchTestSuite = () => {
  describe('discover basic search', { scrollBehavior: false }, () => {
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

    it('should return results for a DQL wildcard query', () => {
      cy.intercept('POST', '**/internal/search/**').as('wildcardSearch');
      cy.setQueryEditor('*');
      cy.wait('@wildcardSearch', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

      cy.getElementByTestId('docTable').should('be.visible');
      cy.getElementByTestId('docTable').find('tr').should('have.length.gte', 2);
      cy.getElementByTestId('docTable').find('tr').eq(1).invoke('text').should('not.be.empty');
    });

    it('should show no results for a query with no matches', () => {
      cy.intercept('POST', '**/internal/search/**').as('noMatchSearch');
      cy.setQueryEditor('nonexistent_field:"no_matching_value_xyz_12345"');
      cy.wait('@noMatchSearch', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

      cy.getElementByTestId('discoverNoResults').should('be.visible');
      cy.getElementByTestId('discoverNoResults').invoke('text').should('include', 'No Results');
      cy.getElementByTestId('docTable').should('not.exist');
    });

    it('should return results for a Lucene query', () => {
      cy.intercept('POST', '**/internal/search/**').as('luceneSearch');
      cy.setQueryLanguage('Lucene');
      cy.wait('@luceneSearch', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

      cy.getElementByTestId('docTable').should('be.visible');
      cy.getElementByTestId('docTable').find('tr').should('have.length.gte', 2);
      cy.getElementByTestId('docTable').find('tr').eq(1).invoke('text').should('not.be.empty');
    });

    it('should display the results table with headers and chart', () => {
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          expect(parseInt(text.replace(/,/g, ''), 10)).to.be.greaterThan(0);
        });

      cy.getElementByTestId('docTable').should('be.visible');
      cy.getElementByTestId('docTable').find('th').should('have.length.gte', 1);
      cy.getElementByTestId('docTable').find('tr').eq(1).invoke('text').should('not.be.empty');

      cy.getElementByTestId('dscTimechart').should('be.visible');
    });
  });
};

prepareTestSuite('Discover Basic Search', discoverBasicSearchTestSuite);
