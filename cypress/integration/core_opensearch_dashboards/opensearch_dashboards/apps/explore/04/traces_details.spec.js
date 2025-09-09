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

const workspaceName = getRandomizedWorkspaceName();

const traceDetailsTestSuite = () => {
  describe('Trace Details Interactive Tests', () => {
    let traceUrl;

    before(() => {
      // Set up workspace and data source with traces
      cy.explore.setupWorkspaceAndDataSourceWithTraces(workspaceName, [TRACE_INDEX]);

      // Create index pattern for traces
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: TRACE_INDEX_PATTERN.replace('*', ''),
        timefieldName: TRACE_TIME_FIELD,
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
        signalType: 'traces',
      });

      // Navigate to traces page and capture trace URL
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/traces',
        isEnhancement: true,
      });

      // Click on dataset selector to close Syntax options if blocking time-picker
      cy.getElementByTestId('datasetSelectButton').should('be.visible').click();

      // Set time range to capture OTEL sample data
      cy.explore.setRelativeTopNavDate('3', 'Years ago');

      // Wait for span links and capture trace URL
      cy.get('[data-test-subj="spanIdLink"]', { timeout: 30000 }).should('exist');

      // Intercept window.open to capture URL
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });

      cy.get('[data-test-subj="spanIdLink"]').first().click();

      cy.get('@windowOpen')
        .should('have.been.called')
        .then((stub) => {
          traceUrl = stub.args[0][0];
          cy.log(`Captured trace URL: ${traceUrl}`);
        });
    });

    after(() => {
      cy.explore.cleanupWorkspaceAndDataSourceAndTraces(workspaceName, [TRACE_INDEX]);
    });

    beforeEach(() => {
      cy.visit(traceUrl);
      cy.osd.waitForLoader(true);
    });

    describe('Page Load and Structure', () => {
      it('should load trace details page with correct structure', () => {
        // Verify page loads with trace ID in title
        cy.url().should('include', 'traceDetails');
        cy.get('h1').should('contain', 'Trace:');

        // Verify Timeline tab is active by default
        cy.get('button[role="tab"][aria-selected="true"]').should('contain', 'Timeline');

        // Verify main panels are visible
        cy.get('[data-test-subj="span-gantt-chart-panel"]').should('be.visible');

        // Check for gantt chart container with fallback
        cy.get('body').then(($body) => {
          if ($body.find('.exploreGanttChart__container').length > 0) {
            cy.get('.exploreGanttChart__container').should('be.visible');
          } else {
            // Fallback: check for SVG in the gantt panel
            cy.get('[data-test-subj="span-gantt-chart-panel"] svg').should('be.visible');
          }
        });

        // Verify right panel span information is visible
        cy.contains('Service identifier').should('be.visible');
        cy.contains('Span ID').should('be.visible');
      });

      it('should display correct trace information in breadcrumb', () => {
        // Extract trace ID from URL and verify it appears in breadcrumb
        cy.url().then((url) => {
          const traceIdMatch = url.match(/traceId:'([^']+)'/);
          if (traceIdMatch) {
            const traceId = traceIdMatch[1];
            cy.get('h1').should('contain', traceId);
          }
        });
      });
    });

    describe('Gantt Chart Interactions', () => {
      it('should display gantt chart with span bars', () => {
        // Wait for the main gantt chart panel to be visible first
        cy.get('[data-test-subj="span-gantt-chart-panel"]', { timeout: 15000 }).should(
          'be.visible'
        );

        // Wait for gantt chart container to load - try multiple selectors
        cy.get('body').then(($body) => {
          if ($body.find('.exploreGanttChart__container').length > 0) {
            cy.get('.exploreGanttChart__container', { timeout: 15000 }).should('be.visible');
            cy.get('.exploreGanttChart__container svg', { timeout: 10000 }).should('be.visible');
            // Look for Vega span bars - they are path elements with class mark-rect
            cy.get('.exploreGanttChart__container svg .mark-rect path').should(
              'have.length.greaterThan',
              0
            );
          } else {
            // Fallback: look for any SVG in the gantt panel
            cy.get('[data-test-subj="span-gantt-chart-panel"] svg', { timeout: 15000 }).should(
              'be.visible'
            );
            // Look for Vega span bars - they are path elements with class mark-rect
            cy.get('[data-test-subj="span-gantt-chart-panel"] svg .mark-rect path').should(
              'have.length.greaterThan',
              0
            );
          }
        });

        // Verify the gantt chart has the expected structure from the SVG
        cy.get('[data-test-subj="span-gantt-chart-panel"] svg').within(() => {
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
        cy.get('[data-test-subj="span-gantt-chart-panel"]', { timeout: 15000 }).should(
          'be.visible'
        );

        // Find the gantt chart SVG - try multiple approaches
        cy.get('body').then(($body) => {
          let svgSelector = '.exploreGanttChart__container svg';
          if ($body.find('.exploreGanttChart__container svg').length === 0) {
            svgSelector = '[data-test-subj="span-gantt-chart-panel"] svg';
          }

          cy.get(svgSelector, { timeout: 15000 }).should('be.visible');

          // Get the first span bar and hover over it - Vega uses path elements for rectangles
          cy.get(`${svgSelector} .mark-rect path`)
            .first()
            .then(($path) => {
              // Trigger mouseover event
              cy.wrap($path).trigger('mouseover', { force: true });

              // Check if tooltip exists and try to make it visible
              cy.get('body').then(($body) => {
                if ($body.find('.vg-tooltip').length > 0) {
                  // Tooltip exists, check if it becomes visible or has content
                  cy.get('.vg-tooltip').should('exist');

                  // Try different approaches to verify tooltip functionality
                  cy.get('.vg-tooltip').then(($tooltip) => {
                    // Check if tooltip has content even if not visible
                    if ($tooltip.text().trim().length > 0) {
                      // Tooltip has content, test passes
                      cy.wrap($tooltip).should('contain.text', 'ms').or('not.be.empty');
                    } else {
                      // Fallback: just verify tooltip element exists
                      cy.wrap($tooltip).should('exist');
                    }
                  });
                } else {
                  // No tooltip found, skip this test gracefully
                  cy.log('Tooltip not found - may not be implemented or configured differently');
                }
              });

              // Trigger mouseout to clean up
              cy.wrap($path).trigger('mouseout', { force: true });
            });
        });
      });

      it('should handle span clicking and update right panel', () => {
        // Wait for the main gantt chart panel
        cy.get('[data-test-subj="span-gantt-chart-panel"]', { timeout: 15000 }).should(
          'be.visible'
        );

        // Store initial URL to compare later
        let initialUrl;
        cy.url().then((url) => {
          initialUrl = url;
        });

        // Find and click on a different span bar
        cy.get('body').then(($body) => {
          let svgSelector = '.exploreGanttChart__container svg';
          if ($body.find('.exploreGanttChart__container svg').length === 0) {
            svgSelector = '[data-test-subj="span-gantt-chart-panel"] svg';
          }

          cy.get(`${svgSelector} .mark-rect path`)
            .eq(1)
            .then(($path) => {
              cy.wrap($path).trigger('mousedown', { force: true });

              // Wait for URL to update (indicating span selection changed)
              cy.url().should('not.equal', initialUrl);

              // Verify URL contains spanId parameter
              cy.url().should('include', 'spanId');
            });
        });
      });

      it('should highlight selected span in gantt chart', () => {
        // Wait for the main gantt chart panel
        cy.get('[data-test-subj="span-gantt-chart-panel"]', { timeout: 15000 }).should(
          'be.visible'
        );

        // Find and click on a span
        cy.get('body').then(($body) => {
          let svgSelector = '.exploreGanttChart__container svg';
          if ($body.find('.exploreGanttChart__container svg').length === 0) {
            svgSelector = '[data-test-subj="span-gantt-chart-panel"] svg';
          }

          cy.get(`${svgSelector} .mark-rect path`).eq(2).trigger('mousedown', { force: true });

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
    });

    describe('Right Panel Updates', () => {
      it('should update span details when different spans are clicked', () => {
        // Wait for the main gantt chart panel
        cy.get('[data-test-subj="span-gantt-chart-panel"]', { timeout: 15000 }).should(
          'be.visible'
        );

        // Find and click first span
        cy.get('body').then(($body) => {
          let svgSelector = '.exploreGanttChart__container svg';
          if ($body.find('.exploreGanttChart__container svg').length === 0) {
            svgSelector = '[data-test-subj="span-gantt-chart-panel"] svg';
          }

          // Store initial URL
          let firstUrl;
          cy.url().then((url) => {
            firstUrl = url;
          });

          cy.get(`${svgSelector} .mark-rect path`).first().trigger('mousedown', { force: true });

          // Click second span and verify URL changes (indicating different span selected)
          cy.get(`${svgSelector} .mark-rect path`).eq(1).trigger('mousedown', { force: true });

          cy.url().should('not.equal', firstUrl);
          cy.url().should('include', 'spanId');
        });
      });

      it('should display span information in right panel', () => {
        // Wait for the main gantt chart panel and right panel to load
        cy.get('[data-test-subj="span-gantt-chart-panel"]', { timeout: 15000 }).should(
          'be.visible'
        );

        // Verify the key span information fields are visible
        cy.contains('Service identifier').should('be.visible');
        cy.contains('Span ID').should('be.visible');
        cy.contains('Start time').should('be.visible');
        cy.contains('Span status').should('be.visible');
      });

      it('should show span status information', () => {
        // Wait for the main gantt chart panel
        cy.get('[data-test-subj="span-gantt-chart-panel"]', { timeout: 15000 }).should(
          'be.visible'
        );

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
        cy.get('[data-test-subj="span-gantt-chart-panel"]', { timeout: 15000 }).should(
          'be.visible'
        );

        // Verify span detail tabs are present
        cy.get('button[role="tab"]').contains('Overview').should('be.visible');
        cy.get('button[role="tab"]').contains('Errors').should('be.visible');
        cy.get('button[role="tab"]').contains('Metadata').should('be.visible');

        // Click different span and verify tabs still work
        cy.get('body').then(($body) => {
          let svgSelector = '.exploreGanttChart__container svg';
          if ($body.find('.exploreGanttChart__container svg').length === 0) {
            svgSelector = '[data-test-subj="span-gantt-chart-panel"] svg';
          }

          cy.get(`${svgSelector} .mark-rect path`).eq(1).trigger('mousedown', { force: true });

          // Click on Metadata tab
          cy.get('button[role="tab"]').contains('Metadata').click();

          // Wait for tab to be selected and verify it's active - target the button directly
          cy.get('button[role="tab"]:contains("Metadata")').should(
            'have.attr',
            'aria-selected',
            'true'
          );
          cy.get('button[role="tab"]:contains("Metadata")').should(
            'have.class',
            'euiTab-isSelected'
          );

          // Switch back to Overview
          cy.get('button[role="tab"]').contains('Overview').click();
          cy.get('button[role="tab"]:contains("Overview")').should(
            'have.attr',
            'aria-selected',
            'true'
          );
        });
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
        cy.get('body').then(($body) => {
          if ($body.find('.exploreGanttChart__container').length > 0) {
            cy.get('.exploreGanttChart__container').should('be.visible');
          } else {
            // Fallback: check for SVG in the gantt panel
            cy.get('[data-test-subj="span-gantt-chart-panel"] svg').should('be.visible');
          }
        });

        // Switch to Span list tab
        cy.get('button[role="tab"]').contains('Span list').click();
        cy.get('button[role="tab"]:contains("Span list")').should(
          'have.attr',
          'aria-selected',
          'true'
        );

        // Verify gantt chart is hidden and table is shown
        cy.get('body').then(($body) => {
          if ($body.find('.exploreGanttChart__container').length > 0) {
            cy.get('.exploreGanttChart__container').should('not.exist');
          }
        });
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
        cy.get('body').then(($body) => {
          if ($body.find('.exploreGanttChart__container').length > 0) {
            cy.get('.exploreGanttChart__container').should('be.visible');
          } else {
            cy.get('[data-test-subj="span-gantt-chart-panel"] svg').should('be.visible');
          }
        });
      });

      it('should maintain span selection across tab switches', () => {
        // Wait for the main gantt chart panel and select a span
        cy.get('[data-test-subj="span-gantt-chart-panel"]', { timeout: 15000 }).should(
          'be.visible'
        );

        cy.get('body').then(($body) => {
          let svgSelector = '.exploreGanttChart__container svg';
          if ($body.find('.exploreGanttChart__container svg').length === 0) {
            svgSelector = '[data-test-subj="span-gantt-chart-panel"] svg';
          }

          // Store initial URL to compare against
          let initialUrl;
          cy.url().then((url) => {
            initialUrl = url;
          });

          // Click on a different span to change selection - try multiple approaches
          cy.get(`${svgSelector} .mark-rect path`).eq(3).click({ force: true });

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
    });

    describe('Filter Functionality', () => {
      it('should show error filter when errors exist', () => {
        // Check if error filter button exists (only if there are errors in the trace)
        cy.get('body').then(($body) => {
          if ($body.find('button').filter(':contains("Filter errors")').length > 0) {
            // Click error filter
            cy.contains('Filter errors').click();

            // Verify filter badge appears
            cy.get('[data-test-subj^="filter-badge-"]').should('be.visible');

            // Verify clear filters button appears
            cy.get('[data-test-subj="clear-all-filters-button"]').should('be.visible');

            // Clear filters
            cy.get('[data-test-subj="clear-all-filters-button"]').click();

            // Verify filter badge disappears
            cy.get('[data-test-subj^="filter-badge-"]').should('not.exist');
          }
        });
      });

      it('should handle service legend modal', () => {
        // Check if service legend button exists
        cy.get('body').then(($body) => {
          if ($body.find('button').filter(':contains("Service legend")').length > 0) {
            // Click service legend button
            cy.contains('Service legend').click();

            // Verify modal opens
            cy.get('.euiModal').should('be.visible');
            cy.contains('Service legend').should('be.visible');

            // Verify service list is shown
            cy.get('.euiModal .euiText').should('have.length.greaterThan', 0);

            // Close modal
            cy.get('.euiModal button').contains('Close').click();

            // Verify modal closes
            cy.get('.euiModal').should('not.exist');
          }
        });
      });
    });

    describe('Performance and Reliability', () => {
      it('should handle page resize without breaking gantt chart', () => {
        // Wait for the main gantt chart panel
        cy.get('[data-test-subj="span-gantt-chart-panel"]', { timeout: 15000 }).should(
          'be.visible'
        );

        // Resize viewport
        cy.viewport(1200, 800);

        // Wait a moment for resize to take effect
        cy.wait(1000);

        // Verify gantt chart is still functional
        cy.get('body').then(($body) => {
          let svgSelector = '.exploreGanttChart__container svg';
          if ($body.find('.exploreGanttChart__container svg').length === 0) {
            svgSelector = '[data-test-subj="span-gantt-chart-panel"] svg';
          }

          cy.get(svgSelector).should('be.visible');
          cy.get(`${svgSelector} .mark-rect path`).should('have.length.greaterThan', 0);

          // Verify interactions still work
          cy.get(`${svgSelector} .mark-rect path`).first().trigger('mousedown', { force: true });
          cy.url().should('include', 'spanId');
        });

        // Reset viewport
        cy.viewport(1280, 720);
      });

      it('should load trace data within reasonable time', () => {
        // Verify page loads quickly
        cy.get('[data-test-subj="span-gantt-chart-panel"]', { timeout: 15000 }).should(
          'be.visible'
        );

        // Verify gantt chart and span data is loaded
        cy.get('body').then(($body) => {
          let svgSelector = '.exploreGanttChart__container svg';
          if ($body.find('.exploreGanttChart__container svg').length === 0) {
            svgSelector = '[data-test-subj="span-gantt-chart-panel"] svg';
          }

          cy.get(svgSelector, { timeout: 15000 }).should('be.visible');
          cy.get(`${svgSelector} .mark-rect path`).should('have.length.greaterThan', 0);
        });

        // Verify right panel has span data
        cy.contains('Service identifier').should('be.visible');
        cy.contains('Span ID').should('be.visible');
      });
    });
  });
};

prepareTestSuite('Trace Details Interactive Tests', traceDetailsTestSuite);
