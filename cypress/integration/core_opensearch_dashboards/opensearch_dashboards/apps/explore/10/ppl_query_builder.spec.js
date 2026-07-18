/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

// Monaco renders whitespace as middot/bullet glyphs; strip them so query text
// plain-matches. Glyphs escaped by codepoint to avoid no-irregular-whitespace lint.
const normalizeMonacoText = (str) =>
  str
    .replace(/[·•∙⋅・]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const expectGeneratedQueryToContain = (clause) => {
  cy.getElementByTestId('pplBuilderModeToggle').should('not.be.disabled').click();
  cy.getElementByTestId('exploreQueryPanelEditor')
    .should('be.visible')
    .find('.view-line')
    .should(($lines) => {
      const text = Cypress.$.makeArray($lines)
        .map((line) => Cypress.$(line).text())
        .join(' ');
      expect(normalizeMonacoText(text)).to.include(normalizeMonacoText(clause));
    });
  cy.getElementByTestId('pplBuilderModeToggle').should('not.be.disabled').click();
  cy.getElementByTestId('pplBuilder').should('be.visible');
};

const pplQueryBuilderTestSuite = () => {
  describe('PPL query builder', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });

      cy.explore.setDataset(INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME, 'INDEX_PATTERN');
      cy.explore.setTopNavDate(START_TIME, END_TIME);

      // "New" resets the Redux query asynchronously, remounting the builder empty;
      // wait so a late remount doesn't discard the test's added element.
      cy.getElementByTestId('discoverNewButton').click();
      cy.wait(2000);
      cy.getElementByTestId('pplBuilder').should('be.visible');
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
    });

    it('renders the builder and toggles to code mode and back', () => {
      cy.getElementByTestId('pplBuilder').should('be.visible');
      cy.getElementByTestId('exploreQueryPanelEditor').should('not.exist');

      cy.getElementByTestId('pplBuilderModeToggle').should('not.be.disabled').click();
      cy.getElementByTestId('exploreQueryPanelEditor').should('be.visible');
      cy.getElementByTestId('pplBuilder').should('not.exist');

      cy.getElementByTestId('pplBuilderModeToggle').should('not.be.disabled').click();
      cy.getElementByTestId('pplBuilder').should('be.visible');
      cy.getElementByTestId('exploreQueryPanelEditor').should('not.exist');
    });

    it('adds a Where filter that generates a where clause', () => {
      cy.getElementByTestId('pplBuilderAddFilter').click();
      cy.getElementByTestId('pplBuilderFilterFieldOption-bytes_transferred')
        .should('be.visible')
        .click();

      cy.getElementByTestId('pplBuilderFilterChip-0').should('be.visible');
      cy.getElementByTestId('pplBuilderFilterValue-0').should('be.visible').type('5000');

      expectGeneratedQueryToContain('WHERE `bytes_transferred` = 5000');

      cy.getElementByTestId('pplBuilderRemoveFilter-0').click();
      cy.getElementByTestId('pplBuilderFilterChip-0').should('not.exist');
      cy.getElementByTestId('pplBuilderAddFilter').should('be.visible');
    });

    it('adds an aggregation that generates a stats clause', () => {
      cy.getElementByTestId('pplBuilderAddAggregation').click();
      cy.getElementByTestId('pplBuilderAddAggregationOption-count').should('be.visible').click();

      cy.getElementByTestId('pplBuilderAgg-0').should('be.visible');
      cy.getElementByTestId('pplBuilderAddGroupBy').should('be.visible');

      expectGeneratedQueryToContain('stats count()');

      cy.getElementByTestId('pplBuilderRemoveAgg-0').click();
      cy.getElementByTestId('pplBuilderAgg-0').should('not.exist');
    });

    it('adds a group-by field to an aggregation', () => {
      cy.getElementByTestId('pplBuilderAddAggregation').click();
      cy.getElementByTestId('pplBuilderAddAggregationOption-count').should('be.visible').click();
      cy.getElementByTestId('pplBuilderAgg-0').should('be.visible');

      // "+ Group by" auto-opens the field picker.
      cy.getElementByTestId('pplBuilderAddGroupBy').should('be.visible').click();
      cy.getElementByTestId('pplBuilderGroupBy').should('be.visible');
      cy.getElementByTestId('pplBuilderFieldOption-category').should('be.visible').click();
      cy.get('body').type('{esc}');

      expectGeneratedQueryToContain('stats count() by category');
    });

    it('adds a sort that generates a sort clause', () => {
      cy.getElementByTestId('pplBuilderAddSort').click();
      cy.getElementByTestId('pplBuilderSortChip').should('be.visible');

      cy.getElementByTestId('pplBuilderSortColumn').should('be.visible').click();
      cy.getElementByTestId('pplBuilderFieldOption-bytes_transferred').should('be.visible').click();

      expectGeneratedQueryToContain('sort');

      cy.getElementByTestId('pplBuilderRemoveSort').click();
      cy.getElementByTestId('pplBuilderSortChip').should('not.exist');
      cy.getElementByTestId('pplBuilderAddSort').should('be.visible');
    });
  });
};

prepareTestSuite('PPL Query Builder', pplQueryBuilderTestSuite);
