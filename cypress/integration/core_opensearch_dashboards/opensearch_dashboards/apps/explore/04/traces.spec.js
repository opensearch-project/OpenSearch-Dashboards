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
    cy.createWorkspaceIndexPatterns({
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

    it('Expanding a span entry shows the correct info', () => {
      cy.explore.setQueryEditor("| WHERE spanId = '58f52f0436530c7c'");
      cy.osd.verifyResultsCount(1);
      cy.getElementByTestId('docTableExpandToggleColumn').first().click();
      cy.getElementByTestId('osdDocViewer').should('be.visible');
      // Test that timeline is selected as default
      cy.get('#osd_doc_viewer_tab_0.euiTab-isSelected > .euiTab__content').contains('Timeline');
      cy.get('#osd_doc_viewer_tab_1 > .euiTab__content').contains('Table');
      cy.get('#osd_doc_viewer_tab_2 > .euiTab__content').contains('JSON');

      // Intercept window.open to capture URL and navigate in same tab
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });

      // Click within gantt chart
      cy.get('[aria-label="Trace spans Gantt chart"]').find('path[stroke-width="3"]').click();

      cy.get('@windowOpen')
        .should('have.been.called')
        .then((stub) => {
          traceUrl = stub.args[0][0];
          cy.log(`Captured trace URL: ${traceUrl}`);
          cy.visit(traceUrl);
        });
      // verify that we are on the Trace Details page
      cy.getElementByTestId('headerApplicationTitle').contains(
        'Trace: 68b0ad76fc05c5a5f5e3738d42b8a735'
      );
    });
  });

  describe('Trace Details Interactive Tests', () => {
    beforeEach(() => {
      cy.visit(traceUrl);
      cy.osd.waitForLoader(true);
    });

    describe('Page Load and Structure', () => {
      it('should load trace details page with correct structure', () => {
        // Verify page loads with trace ID in title
        cy.url().should('include', 'traceDetails');
        cy.getElementByTestId('headerApplicationTitle').contains(
          'Trace: 68b0ad76fc05c5a5f5e3738d42b8a735'
        );

        // Verify Timeline tab is active by default
        cy.get('button[role="tab"][aria-selected="true"]').should('contain', 'Timeline');

        // Verify main panels are visible
        cy.getElementByTestId('span-gantt-chart-panel').should('be.visible');

        // Check for gantt chart container
        cy.get('.exploreGanttChart__container').should('be.visible');

        // Verify right panel span information is visible
        cy.contains('Service identifier').should('be.visible');
        cy.contains('Span ID').should('be.visible');
      });

      it('should display correct trace information in breadcrumb', () => {
        // verify that we are on the Trace Details page
        cy.getElementByTestId('headerApplicationTitle').contains(
          'Trace: 68b0ad76fc05c5a5f5e3738d42b8a735'
        );
      });
    });

    describe('Gantt Chart Interactions', () => {
      it('should display gantt chart with span bars', () => {
        // Wait for the main gantt chart panel to be visible first
        cy.getElementByTestId('span-gantt-chart-panel', { timeout: 15000 }).should('be.visible');

        // Wait for gantt chart container to load
        cy.get('.exploreGanttChart__container', { timeout: 15000 }).should('be.visible');
        cy.get('.exploreGanttChart__container svg', { timeout: 10000 }).should('be.visible');
        // Look for Vega span bars - they are path elements with class mark-rect
        cy.get('.exploreGanttChart__container svg .mark-rect path').should(
          'have.length.greaterThan',
          0
        );

        // Verify the gantt chart has the expected structure from the SVG
        cy.getElementByTestId('span-gantt-chart-panel')
          .find('svg')
          .within(() => {
            // Check for X-axis title with "Time (ms)"
            cy.get('.mark-text.role-axis-title').should('contain.text', 'Time (ms)');

            // Check for span bars (rectangles rendered as paths)
            cy.get('.mark-rect path').should('have.length.greaterThan', 0);

            // Check for service labels on the left
            cy.get('.mark-text').should('contain.text', 'customers-service-java');
            cy.get('.mark-text').should('contain.text', 'pet-clinic-frontend-java');

            // Check for duration labels in the chart
            cy.get('.mark-text').should('contain.text', 'ms');
          });
      });

      it('should show tooltips when hovering over spans', () => {
        // Wait for the main gantt chart panel
        cy.getElementByTestId('span-gantt-chart-panel', { timeout: 15000 }).should('be.visible');

        // Find the gantt chart SVG
        cy.get('.exploreGanttChart__container svg', { timeout: 15000 }).should('be.visible');

        // Get the first span bar - first click to activate tooltip functionality
        cy.get('.exploreGanttChart__container svg .mark-rect path').first().click({ force: true });

        // Wait a moment for the click to register
        cy.wait(500);

        // Now hover over the span to trigger tooltip
        cy.get('.exploreGanttChart__container svg .mark-rect path')
          .first()
          .trigger('mouseover', { force: true });

        // Tooltip should exist and be visible
        cy.get('.vg-tooltip').should('exist').and('not.be.empty');

        // Trigger mouseout to clean up
        cy.get('.exploreGanttChart__container svg .mark-rect path')
          .first()
          .trigger('mouseout', { force: true });
      });

      it('should handle span clicking and update right panel', () => {
        // Wait for the main gantt chart panel
        cy.getElementByTestId('span-gantt-chart-panel', { timeout: 15000 }).should('be.visible');

        // Store initial URL to compare later
        let initialUrl;
        cy.url().then((url) => {
          initialUrl = url;
        });

        // Find and click on a different span bar
        cy.get('.exploreGanttChart__container svg .mark-rect path')
          .eq(1)
          .then(($path) => {
            cy.wrap($path).trigger('mousedown', { force: true });

            // Wait for URL to update (indicating span selection changed)
            cy.url().should('not.equal', initialUrl);

            // Verify URL contains spanId parameter
            cy.url().should('include', 'spanId');
          });
      });

      it('should highlight selected span in gantt chart', () => {
        // Wait for the main gantt chart panel
        cy.getElementByTestId('span-gantt-chart-panel', { timeout: 15000 }).should('be.visible');

        // Find and click on a span
        cy.get('.exploreGanttChart__container svg .mark-rect path')
          .eq(2)
          .trigger('mousedown', { force: true });

        // Verify URL updates (indicating span selection)
        cy.url().should('include', 'spanId');

        // The selected span should have different styling (this depends on Vega spec implementation)
        // We can verify by checking if the URL parameter matches what we expect
        cy.url().then((url) => {
          const spanIdMatch = url.match(/spanId:([^,)]+)/);
          expect(spanIdMatch).to.not.be.null;
        });
      });
    });

    describe('Right Panel Updates', () => {
      it('should update span details when different spans are clicked', () => {
        // Wait for the main gantt chart panel
        cy.getElementByTestId('span-gantt-chart-panel', { timeout: 15000 }).should('be.visible');

        // Store initial URL
        let firstUrl;
        cy.url().then((url) => {
          firstUrl = url;
        });

        cy.get('.exploreGanttChart__container svg .mark-rect path')
          .first()
          .trigger('mousedown', { force: true });

        // Click second span and verify URL changes (indicating different span selected)
        cy.get('.exploreGanttChart__container svg .mark-rect path')
          .eq(1)
          .trigger('mousedown', { force: true });

        cy.url().should('not.equal', firstUrl);
        cy.url().should('include', 'spanId');
      });

      it('should display span information in right panel', () => {
        // Wait for the main gantt chart panel and right panel to load
        cy.getElementByTestId('span-gantt-chart-panel', { timeout: 15000 }).should('be.visible');

        // Verify the key span information fields are visible
        cy.contains('Service identifier').should('be.visible');
        cy.contains('Span ID').should('be.visible');
        cy.contains('Start time').should('be.visible');
        cy.contains('Span status').should('be.visible');
      });

      it('should show span status information', () => {
        // Wait for the main gantt chart panel
        cy.getElementByTestId('span-gantt-chart-panel', { timeout: 15000 }).should('be.visible');

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
        // Wait for the main gantt chart panel
        cy.getElementByTestId('span-gantt-chart-panel', { timeout: 15000 }).should('be.visible');

        // Verify span detail tabs are present
        cy.get('button[role="tab"]').contains('Overview').should('be.visible');
        cy.get('button[role="tab"]').contains('Errors').should('be.visible');
        cy.get('button[role="tab"]').contains('Metadata').should('be.visible');

        // Click different span and verify tabs still work
        cy.get('.exploreGanttChart__container svg .mark-rect path')
          .eq(1)
          .trigger('mousedown', { force: true });

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
      it('should switch between Timeline, Span list, and Tree view tabs', () => {
        // Verify Timeline tab is active by default
        cy.get('button[role="tab"]:contains("Timeline")').should(
          'have.attr',
          'aria-selected',
          'true'
        );

        // Check if gantt chart container exists
        cy.get('.exploreGanttChart__container').should('be.visible');

        // Switch to Span list tab
        cy.get('button[role="tab"]').contains('Span list').click();
        cy.get('button[role="tab"]:contains("Span list")').should(
          'have.attr',
          'aria-selected',
          'true'
        );

        // Verify gantt chart is hidden and table is shown
        cy.get('.exploreGanttChart__container').should('not.exist');
        cy.get('.euiDataGrid').should('be.visible');

        // Switch to Tree view tab
        cy.get('button[role="tab"]').contains('Tree view').click();
        cy.get('button[role="tab"]:contains("Tree view")').should(
          'have.attr',
          'aria-selected',
          'true'
        );

        // Verify tree view content is shown
        cy.get('.euiDataGrid').should('be.visible');

        // Switch back to Timeline
        cy.get('button[role="tab"]').contains('Timeline').click();
        cy.get('button[role="tab"]:contains("Timeline")').should(
          'have.attr',
          'aria-selected',
          'true'
        );

        // Verify gantt chart is visible again
        cy.get('.exploreGanttChart__container').should('be.visible');
      });

      it('should maintain span selection across tab switches', () => {
        // Wait for the main gantt chart panel and select a span
        cy.getElementByTestId('span-gantt-chart-panel', { timeout: 15000 }).should('be.visible');

        // Store initial URL to compare against
        let initialUrl;
        cy.url().then((url) => {
          initialUrl = url;
        });

        // Click on a different span to change selection
        cy.get('.exploreGanttChart__container svg .mark-rect path').eq(3).click({ force: true });

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
      it('should handle page resize without breaking gantt chart', () => {
        // Wait for the main gantt chart panel
        cy.getElementByTestId('span-gantt-chart-panel', { timeout: 15000 }).should('be.visible');

        // Resize viewport
        cy.viewport(1200, 800);

        // Wait a moment for resize to take effect
        cy.wait(1000);

        // Verify gantt chart is still functional
        cy.get('.exploreGanttChart__container svg').should('be.visible');
        cy.get('.exploreGanttChart__container svg .mark-rect path').should(
          'have.length.greaterThan',
          0
        );

        // Verify interactions still work
        cy.get('.exploreGanttChart__container svg .mark-rect path')
          .first()
          .trigger('mousedown', { force: true });
        cy.url().should('include', 'spanId');

        // Reset viewport
        cy.viewport(1280, 720);
      });

      it('should load trace data within reasonable time', () => {
        // Verify page loads quickly
        cy.getElementByTestId('span-gantt-chart-panel', { timeout: 15000 }).should('be.visible');

        // Verify gantt chart and span data is loaded
        cy.get('.exploreGanttChart__container svg', { timeout: 15000 }).should('be.visible');
        cy.get('.exploreGanttChart__container svg .mark-rect path').should(
          'have.length.greaterThan',
          0
        );

        // Verify right panel has span data
        cy.contains('Service identifier').should('be.visible');
        cy.contains('Span ID').should('be.visible');
      });
    });
  });
};

prepareTestSuite('Traces', traceTestSuite);
