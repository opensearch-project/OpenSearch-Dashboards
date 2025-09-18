/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1, DATASOURCE_NAME } from '../../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import {
  prepareDiscoverPageForDownload,
  generateDownloadCsvTestConfigurations,
} from '../../../../../../utils/apps/explore/download_csv';

const workspaceName = getRandomizedWorkspaceName();

export const runKeyboardShortcutsTests = () => {
  describe('keyboard shortcuts tests', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      cy.url().then((url) => {
        const workspaceId = url.match(/\/w\/([^\/]+)\//)[1];
        cy.wrap(workspaceId).as('workspaceId');
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
      cy.get('body').should('be.visible');
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    describe('Opening Help Modal', () => {
      it('should open help modal when pressing Shift+/', () => {
        cy.wait(1000);
        cy.get('body').type('{shift+/}');
        cy.getElementByTestId('keyboardShortcutsModal').should('be.visible');
        cy.contains('Keyboard shortcuts').should('be.visible');
      });
    });

    describe('Modal Content Verification', () => {
      beforeEach(() => {
        cy.wait(1000);
        cy.get('body').type('{shift+/}');
        cy.getElementByTestId('keyboardShortcutsModal').should('be.visible');
      });

      it('should display shortcut categories', () => {
        cy.contains('Navigation').should('be.visible');
      });

      it('should display keyboard key combinations with kbd elements', () => {
        cy.get('[data-test-subj="keyboardShortcutsModal"]').within(() => {
          cy.get('kbd').should('exist');
        });
      });

      it('should display the show help shortcut', () => {
        cy.contains('Show this help').should('be.visible');
      });
    });

    describe('Closing Help Modal', () => {
      beforeEach(() => {
        cy.wait(1000);
        cy.get('body').type('{shift+/}');
        cy.getElementByTestId('keyboardShortcutsModal').should('be.visible');
      });

      it('should close modal when clicking close button', () => {
        cy.getElementByTestId('keyboardShortcutsCloseButton').click();
        cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
      });

      it('should close modal when pressing Escape', () => {
        cy.get('body').type('{esc}');
        cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
      });

      it('should close modal when clicking outside', () => {
        cy.get('.euiOverlayMask').click({ force: true });
        cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
      });
    });

    describe('Modal Behavior', () => {
      it('should handle multiple rapid key presses gracefully', () => {
        cy.wait(1000);
        cy.get('body').type('{shift+/}');
        cy.get('body').type('{shift+/}');
        cy.get('body').type('{shift+/}');
        cy.getElementByTestId('keyboardShortcutsModal').should('be.visible');
        cy.contains('Keyboard shortcuts').should('be.visible');
      });

      it('should reopen modal after closing', () => {
        cy.wait(1000);
        cy.get('body').type('{shift+/}');
        cy.getElementByTestId('keyboardShortcutsModal').should('be.visible');
        cy.getElementByTestId('keyboardShortcutsCloseButton').click();
        cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
        cy.get('body').type('{shift+/}');
        cy.getElementByTestId('keyboardShortcutsModal').should('be.visible');
        cy.contains('Keyboard shortcuts').should('be.visible');
      });
    });

    describe('Navigation Shortcuts', () => {
      it('should navigate to dashboard when pressing G then B', () => {
        cy.wait(3000);
        cy.get('body').type('g');
        cy.wait(500);
        cy.get('body').type('b');
        cy.url().should('match', /\/w\/[^\/]+\/app\/dashboards/, { timeout: 10000 });
      });

      it('should navigate to visualization when pressing G then V', () => {
        cy.wait(3000);
        cy.get('body').type('g');
        cy.wait(500);
        cy.get('body').type('v');
        cy.url().should('match', /\/w\/[^\/]+\/app\/visualize/, { timeout: 10000 });
      });

      it('should navigate to discover when pressing G then D', () => {
        cy.wait(3000);
        cy.get('body').type('g');
        cy.wait(500);
        cy.get('body').type('d');
        cy.url().should('match', /\/w\/[^\/]+\/app\/explore/, { timeout: 10000 });
      });
    });

    describe('Global Dev Console Modal', () => {
      it('should open dev tools modal when pressing Shift+`', () => {
        cy.wait(3000);
        cy.get('body').type('{shift+`}');
        cy.contains('Dev Tools').should('be.visible');
      });

      it('should close dev tools modal when pressing Escape', () => {
        cy.wait(3000);
        cy.get('body').type('{shift+`}');
        cy.get('.devToolsOverlayMask').should('be.visible', { timeout: 10000 });
        cy.wait(2000);
        // Requires two presses to close
        cy.get('body').type('{esc}');
        cy.wait(500);
        cy.get('body').type('{esc}');
        cy.wait(1000);
        cy.get('.devToolsOverlayMask').should('not.exist');
      });
    });

    describe('Toggle Navbar Shortcut', () => {
      it('should toggle navbar when pressing Shift+B', () => {
        cy.wait(3000);
        cy.getElementByTestId('toggleNavButton').then(($button) => {
          const initialAriaExpanded = $button.attr('aria-expanded');
          cy.get('body').type('{shift+b}');
          cy.wait(500);
          cy.getElementByTestId('toggleNavButton').should(($newButton) => {
            const newAriaExpanded = $newButton.attr('aria-expanded');
            expect(newAriaExpanded).to.not.equal(initialAriaExpanded);
          });
        });
      });

      it('should toggle navbar back when pressing Shift+B again', () => {
        cy.wait(3000);
        cy.getElementByTestId('toggleNavButton').then(($button) => {
          const initialAriaExpanded = $button.attr('aria-expanded');
          cy.get('body').type('{shift+b}');
          cy.wait(500);
          cy.get('body').type('{shift+b}');
          cy.wait(500);
          cy.getElementByTestId('toggleNavButton').should(
            'have.attr',
            'aria-expanded',
            initialAriaExpanded
          );
        });
      });
    });

    describe('Toggle Fields Panel Shortcut', () => {
      it('should toggle fields panel when pressing Shift+F', () => {
        cy.wait(3000);
        cy.getElementByTestId('osdDiscoverSideBarWrapper')
          .should('be.visible')
          .then(($panel) => {
            const initialVisibility = $panel.is(':visible');
            cy.get('body').type('{shift+f}');
            cy.wait(500);
            if (initialVisibility) {
              cy.getElementByTestId('fieldList-collapse-button').should('exist');
            } else {
              cy.getElementByTestId('osdDiscoverSideBarWrapper').should('be.visible');
            }
          });
      });

      it('should toggle fields panel back when pressing Shift+F again', () => {
        cy.wait(3000);
        cy.get('body').type('{shift+f}');
        cy.wait(500);
        cy.get('body').type('{shift+f}');
        cy.wait(500);
        cy.getElementByTestId('osdDiscoverSideBarWrapper').should('be.visible');
        cy.getElementByTestId('fieldList-collapse-button').should('exist');
      });
    });

    describe('Recent Queries Shortcut', () => {
      it('should toggle recent queries popover when pressing Shift+Q', () => {
        cy.wait(3000);
        cy.getElementByTestId('exploreRecentQueriesButton').should('be.visible');
        cy.get('body').type('{shift+q}');
        cy.wait(500);
        cy.get('.exploreRecentQueriesButton__popover').should('be.visible');
        cy.get('body').type('{shift+q}');
        cy.wait(500);
        cy.get('.exploreRecentQueriesButton__popover').should('not.exist');
      });
    });

    describe('Save Discover Search Shortcut', () => {
      it('should trigger save modal when pressing Cmd+S', () => {
        cy.wait(3000);
        cy.get('body').type('{cmd+s}');
        cy.wait(1000);
        cy.get('body').should('be.visible');
        cy.getElementByTestId('discoverSaveButton').should('exist');
      });
    });

    describe('Open Date Picker Shortcut', () => {
      it('should open date picker when pressing Shift+D', () => {
        cy.wait(3000);
        cy.getElementByTestId('superDatePickerShowDatesButton').should('be.visible');
        cy.get('body').type('{shift+d}');
        cy.wait(1000);
        cy.getElementByTestId('superDatePickerRelativeTab').should('be.visible');
        cy.get('body').should('be.visible');
        cy.getElementByTestId('superDatePickerRelativeTab').should('be.visible');
      });
    });

    describe('Focus Query Bar Shortcut', () => {
      it('should focus query editor when pressing / key', () => {
        cy.wait(3000);
        cy.getElementByTestId('exploreQueryPanelEditor').should('be.visible');
        cy.get('body').type('/');
        cy.wait(500);
        cy.getElementByTestId('exploreQueryPanelEditor').within(() => {
          cy.get('textarea').should('be.focused');
        });
        cy.get('body').should('be.visible');
      });
    });

    describe('Refresh Results Shortcut', () => {
      it('should trigger refresh action when pressing R key', () => {
        cy.wait(3000);
        cy.contains('.euiSuperUpdateButton__text', 'Refresh').should('be.visible');
        cy.get('body').type('r');
        cy.wait(1000);
        cy.get('body').should('be.visible');
        cy.contains('.euiSuperUpdateButton__text', 'Refresh').should('be.visible');
        cy.contains('.euiSuperUpdateButton__text', 'Refresh').parent().should('not.be.disabled');
      });
    });

    describe('Saved Search Shortcut', () => {
      it('should open saved search flyout when pressing Shift+O', () => {
        cy.wait(3000);
        cy.get('body').type('{shift+o}');
        cy.wait(1000);
        cy.getElementByTestId('loadSearchForm').should('be.visible');
        cy.getElementByTestId('loadSearchForm').should('have.attr', 'role', 'dialog');
        cy.getElementByTestId('loadSearchForm').should('have.class', 'euiFlyout');
        cy.get('body').should('be.visible');
        // Clean up
        cy.get('body').type('{esc}');
        cy.wait(500);
        cy.getElementByTestId('loadSearchForm').should('not.exist');
      });
    });

    describe('Download CSV Shortcut', () => {
      it('should open download CSV popover when pressing E key', () => {
        const downloadConfigs = generateDownloadCsvTestConfigurations();
        const testConfig = downloadConfigs[0];

        prepareDiscoverPageForDownload(testConfig, workspaceName);
        cy.wait(3000);
        cy.getElementByTestId('dscDownloadCsvButton').should('be.visible');
        cy.get('body').type('e');
        cy.wait(1000);
        cy.getElementByTestId('dscDownloadCsvPopoverContent').should('be.visible');
      });
    });

    describe('Add to Dashboard Shortcut', () => {
      it('should open add to dashboard modal when pressing A key', () => {
        const downloadConfigs = generateDownloadCsvTestConfigurations();
        const testConfig = downloadConfigs[0];

        prepareDiscoverPageForDownload(testConfig, workspaceName);
        cy.wait(3000);
        cy.get('body').type('a');
        cy.wait(1000);
        cy.getElementByTestId('addToDashboardModalTitle')
          .should('be.visible')
          .and('contain', 'Save and Add to Dashboard');
      });
    });

    describe('Switch to Patterns Tab Shortcut', () => {
      it('should switch to patterns tab when pressing Shift+P', () => {
        const downloadConfigs = generateDownloadCsvTestConfigurations();
        const testConfig = downloadConfigs[0];

        prepareDiscoverPageForDownload(testConfig, workspaceName);
        cy.wait(3000);
        cy.get('body').type('{shift+p}');
        cy.wait(1000);
        cy.get('#explore_patterns_tab').should('have.attr', 'aria-selected', 'true');
      });
    });

    describe('Switch to Logs Tab Shortcut', () => {
      it('should switch to logs tab when pressing Shift+L', () => {
        const downloadConfigs = generateDownloadCsvTestConfigurations();
        const testConfig = downloadConfigs[0];

        prepareDiscoverPageForDownload(testConfig, workspaceName);
        cy.wait(3000);
        cy.get('body').type('{shift+l}');
        cy.wait(1000);
        cy.get('#logs').should('have.attr', 'aria-selected', 'true');
      });
    });

    describe('Switch to Visualization Tab Shortcut', () => {
      it('should switch to visualization tab when pressing Shift+V', () => {
        const downloadConfigs = generateDownloadCsvTestConfigurations();
        const testConfig = downloadConfigs[0];

        prepareDiscoverPageForDownload(testConfig, workspaceName);
        cy.wait(3000);
        cy.get('body').type('{shift+v}');
        cy.wait(1000);
        cy.get('#explore_visualization_tab').should('have.attr', 'aria-selected', 'true');
      });
    });
  });
};

prepareTestSuite('Keyboard Shortcuts', runKeyboardShortcutsTests);
