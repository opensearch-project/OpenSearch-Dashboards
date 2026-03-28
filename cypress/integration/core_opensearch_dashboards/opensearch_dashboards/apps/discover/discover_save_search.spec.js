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

const discoverSaveSearchTestSuite = () => {
  describe('discover save search', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspace,
        datasetId,
        `${INDEX_WITH_TIME_1}*`,
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
      cy.setIndexPatternAsDataset(`${INDEX_WITH_TIME_1}*`, DATASOURCE_NAME);
      cy.setQueryLanguage('DQL');
      cy.osd.setTopNavDate(START_TIME, END_TIME);
    });

    afterEach(() => {
      cy.window().then((win) => win.sessionStorage.clear());
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace);
    });

    it('should save a search and verify save confirmation', () => {
      const searchName = `Save-Test-${Date.now()}`;

      cy.intercept('POST', '**/internal/search/**').as('searchRequest');
      cy.setQueryEditor('*');
      cy.wait('@searchRequest');

      // Deep: hit count is a positive number
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          expect(parseInt(text.replace(/,/g, ''), 10)).to.be.greaterThan(0);
        });

      cy.saveSearch(searchName);

      // Deep: page title reflects saved search name
      cy.contains('h1', searchName).should('be.visible');

      // Deep: results persist after save
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          expect(parseInt(text.replace(/,/g, ''), 10)).to.be.greaterThan(0);
        });
    });

    it('should load a saved search after page reload', () => {
      const searchName = `Reload-Test-${Date.now()}`;

      cy.intercept('POST', '**/internal/search/**').as('searchRequest');
      cy.setQueryEditor('*');
      cy.wait('@searchRequest');
      cy.saveSearch(searchName);
      cy.contains('h1', searchName).should('be.visible');

      // Full page reload
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspace,
        page: 'data-explorer/discover',
        isEnhancement: true,
      });

      cy.loadSaveSearch(searchName);

      // Deep: title matches saved name
      cy.contains('h1', searchName).should('be.visible');

      // Re-set date range since time range is not persisted with saved search
      cy.intercept('POST', '**/internal/search/**').as('reloadSearch');
      cy.osd.setTopNavDate(START_TIME, END_TIME);
      cy.wait('@reloadSearch');

      // Deep: results loaded correctly
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          expect(parseInt(text.replace(/,/g, ''), 10)).to.be.greaterThan(0);
        });

      // Deep: table rows have content
      cy.getElementByTestId('docTableField').first().invoke('text').should('not.be.empty');
    });

    it('should save as new search and preserve original', () => {
      const originalName = `Original-${Date.now()}`;
      const copyName = `Copy-${Date.now()}`;

      cy.intercept('POST', '**/internal/search/**').as('searchRequest');
      cy.setQueryEditor('*');
      cy.wait('@searchRequest');
      cy.saveSearch(originalName);
      cy.contains('h1', originalName).should('be.visible');

      // Save as new copy
      cy.saveSearch(copyName, true);

      // Deep: title reflects the new copy name
      cy.contains('h1', copyName).should('be.visible');

      // Deep: results still present
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          expect(parseInt(text.replace(/,/g, ''), 10)).to.be.greaterThan(0);
        });

      // Load original to verify it still exists
      cy.loadSaveSearch(originalName);

      // Deep: original loads with correct title
      cy.contains('h1', originalName).should('be.visible');

      // Deep: original has results
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          expect(parseInt(text.replace(/,/g, ''), 10)).to.be.greaterThan(0);
        });
    });
  });
};

prepareTestSuite('Discover Save Search', discoverSaveSearchTestSuite);
