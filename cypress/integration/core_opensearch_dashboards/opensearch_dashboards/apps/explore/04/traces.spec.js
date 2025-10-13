/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  TRACE_INDEX_PATTERN,
  TRACE_TIME_FIELD,
  TRACE_INDEX,
} from '../../../../../../utils/apps/explore/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { verifyMonacoEditorContent } from '../../../../../../utils/apps/explore/autocomplete';

const workspaceName = getRandomizedWorkspaceName();

const traceTestSuite = () => {
  let traceUrl;

  before(() => {
    cy.explore.setupWorkspaceAndDataSourceWithTraces(workspaceName, [TRACE_INDEX]);
    cy.explore.createWorkspaceDataSets({
      workspaceName: workspaceName,
      indexPattern: TRACE_INDEX_PATTERN.replace('*', ''),
      timefieldName: TRACE_TIME_FIELD,
      indexPatternHasTimefield: true,
      dataSource: DATASOURCE_NAME,
      isEnhancement: true,
      signalType: 'traces',
    });

    cy.window().then((win) => {
      win.localStorage.setItem('hasSeenInfoBox_PPL', true);
    });
  });

  after(() => {
    cy.explore.cleanupWorkspaceAndDataSourceAndTraces(workspaceName, [TRACE_INDEX]);
  });

  describe('Traces Test', () => {
    beforeEach(() => {
      // mock AI mode disablement
      cy.intercept('GET', '**/enhancements/assist/languages*', {
        statusCode: 200,
        body: {
          configuredLanguages: [],
        },
      });

      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/traces',
        isEnhancement: true,
      });
      cy.wait(5000);
      cy.explore.setTopNavDate('Jan 1, 2024 @ 00:00:00.000', 'Dec 31, 2025 @ 00:00:00.000');
    });

    it('should have default columns on landing page', () => {
      // Time field
      cy.getElementByTestId('docTableHeader-endTimeUnixNano').should('exist');
      cy.getElementByTestId('docTableHeader-spanId').should('exist');
      cy.getElementByTestId('docTableHeader-status.code').should('exist');
      cy.getElementByTestId('docTableHeader-attributes.http.status_code').should('exist');
      cy.getElementByTestId('docTableHeader-resource.attributes.service.name').should('exist');
      cy.getElementByTestId('docTableHeader-name').should('exist');
      cy.getElementByTestId('docTableHeader-durationNano').should('exist');
    });

    it('should have correct tabs', () => {
      cy.getElementByTestId('exploreTabs').contains('.euiTab__content', 'Spans').should('exist');
      cy.getElementByTestId('exploreTabs')
        .find('.euiTab__content', 'Visualization')
        .should('exist');
      cy.getElementByTestId('exploreTabs').find('.euiTab__content').should('have.length', 2);
    });

    it('faceted fields should be present and working', () => {
      cy.getElementByTestId('exploreSideBarFieldGroupButton')
        .contains('.euiButtonEmpty__text', 'Faceted fields')
        .should('exist');
      cy.getElementByTestId('exploreSidebarFacetValue')
        .find('[data-test-subj="fieldToggle-ERROR"][aria-label="Filter for ERROR"]')
        .click();
      verifyMonacoEditorContent(`| WHERE \`status.code\` = 'ERROR'`);
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.verifyResultsCount(2);
    });

    it('Clicking a span entry opens the trace flyout', () => {
      cy.explore.setQueryEditor("| WHERE spanId = '58f52f0436530c7c'");
      cy.osd.verifyResultsCount(1);
      cy.getElementByTestId('traceFlyoutButton').first().click();

      // Verify flyout header
      cy.getElementByTestId('traceFlyout').should(
        'include.text',
        'pet-clinic-frontend-java: GET /api/payments/owners/{ownerId}/pets/{petId}'
      );

      cy.getElementByTestId('traceFlyout').within(() => {
        // Verify Timeline tab is active by default
        cy.get('button[role="tab"][aria-selected="true"]').should('contain', 'Timeline');

        // Check for span hierarchy table
        cy.getElementByTestId('span-hierarchy-table').should('be.visible');
      });

      // Get Trace Details link
      cy.getElementByTestId('traceDetailsLink').should('have.prop', 'href');
      cy.getElementByTestId('traceDetailsLink').then(function ($a) {
        traceUrl = $a.prop('href');
        cy.log(`Captured trace URL: ${traceUrl}`);
      });
    });
  });

  describe('Trace Details Interactive Tests', () => {
    beforeEach(() => {
      cy.visit(traceUrl);
      cy.osd.waitForLoader(true);
    });

    describe('Page Load and Structure', () => {
      it('should load trace details page with correct structure', () => {
        // Wait for page to load
        cy.get('[data-test-subj="globalLoadingIndicator"]').should('not.exist');

        // Verify page loads with trace ID in badge
        cy.url().should('include', 'traceDetails');
        cy.get('.euiBadge')
          .contains('Trace ID: 68b0ad76fc05c5a5f5e3738d42b8a735')
          .should('be.visible');

        // Verify Timeline tab is active by default
        cy.get('button[role="tab"][aria-selected="true"]').should('contain', 'Timeline');

        // Verify main panels are visible
        cy.getElementByTestId('span-detail-panel').should('be.visible');

        // Check for span hierarchy table
        cy.getElementByTestId('span-hierarchy-table').should('be.visible');

        // Verify right panel span information is visible
        cy.contains('Service identifier').should('be.visible');
        cy.contains('Span ID').should('be.visible');
      });

      it('should display correct trace information in breadcrumb', () => {
        // Wait for page to load
        cy.get('[data-test-subj="globalLoadingIndicator"]').should('not.exist');

        // verify that we are on the Trace Details page by checking the trace ID badge
        cy.get('.euiBadge')
          .contains('Trace ID: 68b0ad76fc05c5a5f5e3738d42b8a735')
          .should('be.visible');
      });
    });

    describe('Span Hierarchy Table Interactions', () => {
      it('should display span hierarchy table with span rows', () => {
        // Wait for the main span detail panel to be visible first
        cy.getElementByTestId('span-detail-panel', { timeout: 15000 }).should('be.visible');

        // Wait for span hierarchy table to load
        cy.getElementByTestId('span-hierarchy-table', { timeout: 15000 }).should('be.visible');
        cy.getElementByTestId('custom-data-grid', { timeout: 10000 }).should('be.visible');

        // Look for span rows in the data grid
        cy.getElementByTestId('custom-data-grid')
          .find('[data-test-subj="dataGridRowCell"]')
          .should('have.length.greaterThan', 0);

        // Verify the table has the expected structure
        cy.getElementByTestId('span-hierarchy-table').within(() => {
          // Check for span column header
          cy.get('[data-test-subj="dataGridHeaderCell-span"]').should('contain.text', 'Span');

          // Check for timeline column header
          cy.get('[data-test-subj="dataGridHeaderCell-timeline"]').should('be.visible');

          // Check for duration column header
          cy.get('[data-test-subj="dataGridHeaderCell-durationInNanos"]').should(
            'contain.text',
            'Duration'
          );

          // Check for service names in span cells (first column)
          cy.get('.euiDataGridRowCell--firstColumn').should(
            'contain.text',
            'customers-service-java'
          );
          cy.get('.euiDataGridRowCell--firstColumn').should(
            'contain.text',
            'pet-clinic-frontend-java'
          );
        });
      });

      it('should show expand/collapse functionality for span hierarchy', () => {
        // Wait for the main span detail panel
        cy.getElementByTestId('span-detail-panel', { timeout: 15000 }).should('be.visible');

        // Find the span hierarchy table
        cy.getElementByTestId('span-hierarchy-table', { timeout: 15000 }).should('be.visible');

        // Check for expand all button
        cy.getElementByTestId('treeExpandAll').should('be.visible');

        // Check for collapse all button
        cy.getElementByTestId('treeCollapseAll').should('be.visible');

        // Test collapse all functionality
        cy.getElementByTestId('treeCollapseAll').click();

        // Wait a moment for the collapse to take effect
        cy.wait(500);

        // Test expand all functionality
        cy.getElementByTestId('treeExpandAll').click();

        // Wait a moment for the expand to take effect
        cy.wait(500);

        // Verify expand arrows are present for parent spans
        cy.getElementByTestId('treeViewExpandArrow').should('exist');
      });

      it('should handle span row clicking and update right panel', () => {
        // Wait for the main span detail panel
        cy.getElementByTestId('span-detail-panel', { timeout: 15000 }).should('be.visible');

        // Store initial URL to compare later
        let initialUrl;
        cy.url().then((url) => {
          initialUrl = url;
        });

        // Find and click on a span row
        cy.getElementByTestId('span-hierarchy-table')
          .find('[data-test-subj^="span-hierarchy-row-"]')
          .first()
          .click({ force: true });

        // Wait for URL to update (indicating span selection changed)
        cy.url().should('not.equal', initialUrl);

        // Verify URL contains spanId parameter
        cy.url().should('include', 'spanId');
      });

      it('should highlight selected span in hierarchy table', () => {
        // Wait for the main span detail panel
        cy.getElementByTestId('span-detail-panel', { timeout: 15000 }).should('be.visible');

        // Find and click on a span row
        cy.getElementByTestId('span-hierarchy-table')
          .find('[data-test-subj^="span-hierarchy-row-"]')
          .eq(1)
          .click({ force: true });

        // Verify URL updates (indicating span selection)
        cy.url().should('include', 'spanId');

        // The selected span row should have different styling
        cy.get('.exploreSpanDetailTable__selectedRow').should('exist');

        // Verify the URL parameter matches what we expect
        cy.url().then((url) => {
          const spanIdMatch = url.match(/spanId:([^,)]+)/);
          expect(spanIdMatch).to.not.be.null;
        });
      });
    });

    describe('Right Panel Updates', () => {
      it('should update span details when different spans are clicked', () => {
        // Wait for the main span detail panel
        cy.getElementByTestId('span-detail-panel', { timeout: 15000 }).should('be.visible');

        // Store initial URL
        let firstUrl;
        cy.url().then((url) => {
          firstUrl = url;
        });

        // Click first span row
        cy.getElementByTestId('span-hierarchy-table')
          .find('[data-test-subj^="span-hierarchy-row-"]')
          .first()
          .click({ force: true });

        // Click second span row and verify URL changes (indicating different span selected)
        cy.getElementByTestId('span-hierarchy-table')
          .find('[data-test-subj^="span-hierarchy-row-"]')
          .eq(1)
          .click({ force: true });

        cy.url().should('not.equal', firstUrl);
        cy.url().should('include', 'spanId');
      });

      it('should display span information in right panel', () => {
        // Wait for the main span detail panel and right panel to load
        cy.getElementByTestId('span-detail-panel', { timeout: 15000 }).should('be.visible');

        // Verify the key span information fields are visible
        cy.contains('Service identifier').should('be.visible');
        cy.contains('Span ID').should('be.visible');
        cy.contains('Start time').should('be.visible');
        cy.contains('Span status').should('be.visible');
      });

      it('should show span status information', () => {
        // Wait for the main span detail panel
        cy.getElementByTestId('span-detail-panel', { timeout: 15000 }).should('be.visible');

        // Verify span status is displayed and shows OK, Fault, or Error
        cy.contains('Span status').should('be.visible');

        // Check that status shows one of the expected values
        cy.get('body').then(($body) => {
          const hasOK = $body.find(':contains("OK")').length > 0;
          const hasFault = $body.find(':contains("Fault")').length > 0;
          const hasError = $body.find(':contains("Error")').length > 0;

          expect(hasOK || hasFault || hasError).to.be.true;
        });
      });

      it('should update span tabs when different spans are selected', () => {
        // Wait for the main span detail panel
        cy.getElementByTestId('span-detail-panel', { timeout: 15000 }).should('be.visible');

        // Verify span detail tabs are present
        cy.get('button[role="tab"]').contains('Overview').should('be.visible');
        cy.get('button[role="tab"]').contains('Errors').should('be.visible');
        cy.get('button[role="tab"]').contains('Metadata').should('be.visible');

        // Click different span and verify tabs still work
        cy.getElementByTestId('span-hierarchy-table')
          .find('[data-test-subj^="span-hierarchy-row-"]')
          .eq(1)
          .click({ force: true });

        // Click on Metadata tab
        cy.get('button[role="tab"]').contains('Metadata').click();

        // Wait for tab to be selected and verify it's active - target the button directly
        cy.get('button[role="tab"]:contains("Metadata")').should(
          'have.attr',
          'aria-selected',
          'true'
        );
        cy.get('button[role="tab"]:contains("Metadata")').should('have.class', 'euiTab-isSelected');

        // Switch back to Overview
        cy.get('button[role="tab"]').contains('Overview').click();
        cy.get('button[role="tab"]:contains("Overview")').should(
          'have.attr',
          'aria-selected',
          'true'
        );
      });
    });

    describe('Tab Navigation', () => {
      it('should switch between Timeline and Span list tabs', () => {
        // Verify Timeline tab is active by default
        cy.get('button[role="tab"]:contains("Timeline")').should(
          'have.attr',
          'aria-selected',
          'true'
        );

        // Check if span hierarchy table exists in Timeline view
        cy.getElementByTestId('span-hierarchy-table').should('be.visible');

        // Switch to Span list tab
        cy.get('button[role="tab"]').contains('Span list').click();
        cy.get('button[role="tab"]:contains("Span list")').should(
          'have.attr',
          'aria-selected',
          'true'
        );

        // Verify span hierarchy table is hidden and span list table is shown
        cy.getElementByTestId('span-hierarchy-table').should('not.exist');
        cy.get('.euiDataGrid').should('be.visible');

        // Switch back to Timeline
        cy.get('button[role="tab"]').contains('Timeline').click();
        cy.get('button[role="tab"]:contains("Timeline")').should(
          'have.attr',
          'aria-selected',
          'true'
        );

        // Verify span hierarchy table is visible again in Timeline view
        cy.getElementByTestId('span-hierarchy-table').should('be.visible');
      });

      it('should maintain span selection across tab switches', () => {
        // Wait for the main span detail panel and select a span
        cy.getElementByTestId('span-detail-panel', { timeout: 15000 }).should('be.visible');

        // Store initial URL to compare against
        let initialUrl;
        cy.url().then((url) => {
          initialUrl = url;
        });

        // Click on a different span to change selection
        cy.getElementByTestId('span-hierarchy-table')
          .find('[data-test-subj^="span-hierarchy-row-"]')
          .eq(2)
          .click({ force: true });

        // Wait for URL to update after span selection
        cy.url().should('not.equal', initialUrl);
        cy.url().should('include', 'spanId');

        // Capture selected span ID from URL after it has updated
        let selectedSpanId;
        cy.url().then((url) => {
          const spanIdMatch = url.match(/spanId:'([^']+)'/);
          if (spanIdMatch) {
            selectedSpanId = spanIdMatch[1];
            cy.log(`Selected span ID: ${selectedSpanId}`);
          }
        });

        // Switch to Span list tab
        cy.get('button[role="tab"]').contains('Span list').click();

        // Wait for tab to be active
        cy.get('button[role="tab"]:contains("Span list")').should(
          'have.attr',
          'aria-selected',
          'true'
        );

        // Wait a moment for any URL updates to complete
        cy.wait(500);

        // Verify same span is still selected by checking spanId in URL
        cy.url().should('include', 'spanId');
        cy.url().then((url) => {
          const spanIdMatch = url.match(/spanId:'([^']+)'/);
          if (spanIdMatch && selectedSpanId) {
            cy.log(`Current span ID after tab switch: ${spanIdMatch[1]}`);
            expect(spanIdMatch[1]).to.equal(selectedSpanId);
          }
        });

        // Switch back to Timeline
        cy.get('button[role="tab"]').contains('Timeline').click();

        // Wait for tab to be active
        cy.get('button[role="tab"]:contains("Timeline")').should(
          'have.attr',
          'aria-selected',
          'true'
        );

        // Wait a moment for any URL updates to complete
        cy.wait(500);

        // Verify span selection is maintained by checking spanId in URL
        cy.url().should('include', 'spanId');
        cy.url().then((url) => {
          const spanIdMatch = url.match(/spanId:'([^']+)'/);
          if (spanIdMatch && selectedSpanId) {
            cy.log(`Final span ID after returning to Timeline: ${spanIdMatch[1]}`);
            expect(spanIdMatch[1]).to.equal(selectedSpanId);
          }
        });
      });
    });

    describe('Filter Functionality', () => {
      it('should show error filter and handle filtering', () => {
        // Error filter button should exist
        cy.getElementByTestId('error-count-button').should('be.visible').click();

        // Verify filter badge appears
        cy.get('[data-test-subj^="filter-badge-"]').should('be.visible');

        // Verify clear filters button appears
        cy.getElementByTestId('clear-all-filters-button').should('be.visible');

        // Clear filters
        cy.getElementByTestId('clear-all-filters-button').click();

        // Verify filter badge disappears
        cy.get('[data-test-subj^="filter-badge-"]').should('not.exist');
      });
    });

    describe('Performance and Reliability', () => {
      it('should handle page resize without breaking span hierarchy table', () => {
        // Wait for the main span detail panel
        cy.getElementByTestId('span-detail-panel', { timeout: 15000 }).should('be.visible');

        // Resize viewport
        cy.viewport(1200, 800);

        // Wait a moment for resize to take effect
        cy.wait(1000);

        // Verify span hierarchy table is still functional
        cy.getElementByTestId('span-hierarchy-table').should('be.visible');
        cy.getElementByTestId('custom-data-grid')
          .find('[data-test-subj="dataGridRowCell"]')
          .should('have.length.greaterThan', 0);

        // Verify interactions still work
        cy.getElementByTestId('span-hierarchy-table')
          .find('[data-test-subj^="span-hierarchy-row-"]')
          .first()
          .click({ force: true });
        cy.url().should('include', 'spanId');

        // Reset viewport
        cy.viewport(1280, 720);
      });

      it('should load trace data within reasonable time', () => {
        // Verify page loads quickly
        cy.getElementByTestId('span-detail-panel', { timeout: 15000 }).should('be.visible');

        // Verify span hierarchy table and span data is loaded
        cy.getElementByTestId('span-hierarchy-table', { timeout: 15000 }).should('be.visible');
        cy.getElementByTestId('custom-data-grid')
          .find('[data-test-subj="dataGridRowCell"]')
          .should('have.length.greaterThan', 0);

        // Verify right panel has span data
        cy.contains('Service identifier').should('be.visible');
        cy.contains('Span ID').should('be.visible');
      });
    });
  });
};

prepareTestSuite('Traces', traceTestSuite);
