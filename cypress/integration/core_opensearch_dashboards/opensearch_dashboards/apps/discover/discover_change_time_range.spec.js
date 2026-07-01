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

const NARROW_END_TIME = 'Jun 1, 2020 @ 00:00:00.000';

const testSuiteFunction = () => {
  describe('discover change time range', { scrollBehavior: false }, () => {
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
    });

    afterEach(() => {
      cy.window().then((win) => win.sessionStorage.clear());
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace);
    });

    it('should update results when changing to a narrower absolute time range', () => {
      // Set broad time range
      cy.intercept('POST', '**/internal/search/**').as('broadSearch');
      cy.osd.setTopNavDate(START_TIME, END_TIME);
      cy.wait('@broadSearch');

      // Deep: hit count is a positive number
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          expect(parseInt(text.replace(/,/g, ''), 10)).to.be.greaterThan(0);
        });

      // Set narrow time range
      cy.intercept('POST', '**/internal/search/**').as('narrowSearch');
      cy.osd.setTopNavDate(START_TIME, NARROW_END_TIME);
      cy.wait('@narrowSearch');

      // Deep: date picker reflects the narrow end date
      cy.getElementByTestId('superDatePickerendDatePopoverButton')
        .invoke('text')
        .should('include', 'Jun 1, 2020');

      // Deep: results still present
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          expect(parseInt(text.replace(/,/g, ''), 10)).to.be.greaterThan(0);
        });

      // Table still renders
      cy.getElementByTestId('docTable').should('exist');
    });

    it('should show no results when quick-selecting a range outside test data', () => {
      // Set initial broad time range with results
      cy.intercept('POST', '**/internal/search/**').as('initialSearch');
      cy.osd.setTopNavDate(START_TIME, END_TIME);
      cy.wait('@initialSearch');

      // Deep: confirm results exist first
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          expect(parseInt(text.replace(/,/g, ''), 10)).to.be.greaterThan(0);
        });

      // Quick select "Last 15 minutes" — no test data in this range
      cy.intercept('POST', '**/internal/search/**').as('quickSearch');
      cy.getElementByTestId('superDatePickerToggleQuickMenuButton').click();
      cy.contains('Last 15 minutes').click();
      cy.wait('@quickSearch');

      // Deep: no results message displayed
      cy.getElementByTestId('discoverNoResults').invoke('text').should('include', 'No Results');
    });

    it('should display the correct time range in the date picker', () => {
      cy.intercept('POST', '**/internal/search/**').as('dateSearch');
      cy.osd.setTopNavDate(START_TIME, END_TIME);
      cy.wait('@dateSearch');

      // Deep: date picker shows the expected start date
      cy.getElementByTestId('superDatePickerstartDatePopoverButton')
        .invoke('text')
        .should('include', 'Jan 1, 2020');

      // Deep: date picker area shows the expected end date
      cy.contains('Jan 1, 2024').should('be.visible');

      // Deep: hit count is a positive number
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          expect(parseInt(text.replace(/,/g, ''), 10)).to.be.greaterThan(0);
        });

      // Time chart histogram is visible
      cy.getElementByTestId('dscTimechart').should('be.visible');
    });
  });
};

prepareTestSuite('Discover Change Time Range', testSuiteFunction);
