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

// Monaco renders spaces as middot/bullet glyphs and non-breaking spaces, so the
// raw `.view-line` text won't plain-match a query string. Normalize those away
// before comparing — mirrors the shared `verifyMonacoEditorContent` helper.
// Glyphs escaped by codepoint to avoid `no-irregular-whitespace` lint errors:
// · middot, • bullet, ∙ bullet operator, ⋅ dot operator,
// ・ katakana middot.
const normalizeMonacoText = (str) =>
  str
    .replace(/[·•∙⋅・]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Switches the query panel into code mode and asserts the generated PPL contains
 * the given clause, then switches back to builder mode. The builder writes a
 * source-less query (the `source = <index>` clause is owned by the dataset
 * selector), so the generated text begins with a leading pipe.
 */
const expectGeneratedQueryToContain = (clause) => {
  // Enter code mode.
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
  // Return to builder mode.
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

      // Select the dataset. Selecting it seeds an empty (source-only) query which
      // the panel renders in builder mode.
      cy.explore.setDataset(INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME, 'INDEX_PATTERN');
      cy.explore.setTopNavDate(START_TIME, END_TIME);

      // "New" resets the Redux query asynchronously, remounting the builder empty.
      // Let that settle first, else a late remount discards the test's added element.
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
      // Builder mode: builder present, code editor absent.
      cy.getElementByTestId('pplBuilder').should('be.visible');
      cy.getElementByTestId('exploreQueryPanelEditor').should('not.exist');

      // Toggle to code mode: editor present, builder absent.
      cy.getElementByTestId('pplBuilderModeToggle').should('not.be.disabled').click();
      cy.getElementByTestId('exploreQueryPanelEditor').should('be.visible');
      cy.getElementByTestId('pplBuilder').should('not.exist');

      // Toggle back to builder mode.
      cy.getElementByTestId('pplBuilderModeToggle').should('not.be.disabled').click();
      cy.getElementByTestId('pplBuilder').should('be.visible');
      cy.getElementByTestId('exploreQueryPanelEditor').should('not.exist');
    });

    it('adds a Where filter that generates a where clause', () => {
      // Open the field picker and pick a numeric field (plain value input).
      cy.getElementByTestId('pplBuilderAddFilter').click();
      cy.getElementByTestId('pplBuilderFilterFieldOption-bytes_transferred')
        .should('be.visible')
        .click();

      // A chip is created with a value input.
      cy.getElementByTestId('pplBuilderFilterChip-0').should('be.visible');
      cy.getElementByTestId('pplBuilderFilterValue-0').should('be.visible').type('5000');

      expectGeneratedQueryToContain('WHERE `bytes_transferred` = 5000');

      // Removing the only chip collapses back to the empty-state add button.
      cy.getElementByTestId('pplBuilderRemoveFilter-0').click();
      cy.getElementByTestId('pplBuilderFilterChip-0').should('not.exist');
      cy.getElementByTestId('pplBuilderAddFilter').should('be.visible');
    });

    it('adds an aggregation that generates a stats clause', () => {
      cy.getElementByTestId('pplBuilderAddAggregation').click();
      cy.getElementByTestId('pplBuilderAddAggregationOption-count').should('be.visible').click();

      // A metric row is created and the collapsed "+ Group by" affordance appears.
      cy.getElementByTestId('pplBuilderAgg-0').should('be.visible');
      cy.getElementByTestId('pplBuilderAddGroupBy').should('be.visible');

      expectGeneratedQueryToContain('stats count()');

      // Removing the metric removes the metric row.
      cy.getElementByTestId('pplBuilderRemoveAgg-0').click();
      cy.getElementByTestId('pplBuilderAgg-0').should('not.exist');
    });

    it('adds a group-by field to an aggregation', () => {
      cy.getElementByTestId('pplBuilderAddAggregation').click();
      cy.getElementByTestId('pplBuilderAddAggregationOption-count').should('be.visible').click();
      cy.getElementByTestId('pplBuilderAgg-0').should('be.visible');

      // Reveal the group-by row via the "+ Group by" affordance, which auto-opens
      // its field picker, then pick a field.
      cy.getElementByTestId('pplBuilderAddGroupBy').should('be.visible').click();
      cy.getElementByTestId('pplBuilderGroupBy').should('be.visible');
      cy.getElementByTestId('pplBuilderFieldOption-category').should('be.visible').click();
      // Close the (multi-select) popover.
      cy.get('body').type('{esc}');

      expectGeneratedQueryToContain('stats count() by category');
    });

    it('adds a sort that generates a sort clause', () => {
      cy.getElementByTestId('pplBuilderAddSort').click();
      cy.getElementByTestId('pplBuilderSortChip').should('be.visible');

      // Choose the sort column.
      cy.getElementByTestId('pplBuilderSortColumn').should('be.visible').click();
      cy.getElementByTestId('pplBuilderFieldOption-bytes_transferred').should('be.visible').click();

      expectGeneratedQueryToContain('sort');

      // Removing the sort collapses back to the empty-state add button.
      cy.getElementByTestId('pplBuilderRemoveSort').click();
      cy.getElementByTestId('pplBuilderSortChip').should('not.exist');
      cy.getElementByTestId('pplBuilderAddSort').should('be.visible');
    });
  });
};

prepareTestSuite('PPL Query Builder', pplQueryBuilderTestSuite);
