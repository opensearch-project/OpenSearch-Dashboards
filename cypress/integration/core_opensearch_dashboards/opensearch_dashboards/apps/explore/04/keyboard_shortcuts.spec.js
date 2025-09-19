/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import '../../../../../../utils/dashboards/workspace/commands';

describe('Keyboard Shortcuts Tests', () => {
  let workspaceId;
  const endpoint = Cypress.config('baseUrl') || 'http://localhost:5601';
  const workspaceName = `test-workspace-${Date.now()}`;

  before(() => {
    cy.createWorkspaceWithEndpoint(endpoint, {
      name: workspaceName,
      features: ['use-case-observability'],
      description: 'Test workspace for keyboard shortcuts',
    }).then((workspace) => {
      workspaceId = workspace.id;
      cy.wrap(workspaceId).as('workspaceId');

      // Load sample data
      cy.loadSampleDataForWorkspaceWithEndpoint(endpoint, 'logs', workspaceId);

      //cy.visit(`/w/${workspaceId}/app/dashboards`);
      cy.visit(`/w/${workspaceId}/app/explore/logs`);
      cy.get('body').should('be.visible');
    });
  });

  after(() => {
    // Clean up workspace
    if (workspaceId) {
      cy.request({
        method: 'DELETE',
        url: `${endpoint}/api/workspaces/${workspaceId}`,
        headers: {
          'osd-xsrf': true,
        },
        failOnStatusCode: false,
      });
    }
  });

  describe('Help Modal - dashboard', () => {
    it('should open help modal, verify content, and close properly', () => {
      cy.wait(10000);
      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.wait(1000);
      cy.contains('Keyboard shortcuts').should('be.visible');

      cy.contains('Navigation').should('be.visible');
      cy.get('[data-test-subj="keyboardShortcutsModal"]').within(() => {
        cy.get('kbd').should('exist');
      });
      cy.contains('Show this help').should('be.visible');

      cy.getElementByTestId('keyboardShortcutsCloseButton').click();
      cy.wait(500);
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
    });

    it('should close modal when pressing Escape', () => {
      cy.get('body').click();

      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.get('body').type('{esc}');
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
    });

    it('should close modal when clicking outside', () => {
      cy.get('body').click();

      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.get('.euiOverlayMask').click({ force: true });
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
    });

    it('should reopen modal after closing', () => {
      cy.get('body').click();

      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.getElementByTestId('keyboardShortcutsCloseButton').click();
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.contains('Keyboard shortcuts').should('be.visible');
      cy.get('body').type('{esc}');
    });
  });

  describe('Keyboard Shortcuts global shortcut - dashboard', () => {
    it('should navigate to dashboard when pressing G then B', () => {
      cy.get('body').type('g').type('b');
      cy.url().should('match', /\/w\/[^\/]+\/app\/dashboards/, { timeout: 10000 });
    });

    it('should navigate to visualization when pressing G then V', () => {
      cy.get('body').type('g').type('v');
      cy.url().should('match', /\/w\/[^\/]+\/app\/visualize/, { timeout: 10000 });
    });

    it('should navigate to discover when pressing G then D', () => {
      cy.get('body').type('g').type('d');
      cy.url().should('match', /\/w\/[^\/]+\/app\/explore/, { timeout: 10000 });
      cy.get('body').click();
      cy.wait(500);
      cy.get('body').click();
    });

    it('should open dev tools modal when pressing Shift+`', () => {
      cy.get('body').click();
      cy.get('body').type('{shift+`}');
      cy.contains('Dev Tools').should('be.visible');
    });

    it('should close dev tools modal when pressing Escape', () => {
      cy.get('body').type('{shift+`}');
      cy.get('.devToolsOverlayMask').should('be.visible', { timeout: 10000 });

      cy.get('body').type('{esc}');
      cy.wait(1000);
      cy.get('button[aria-label="close modal"]').click();
      cy.wait(1000);
      cy.get('.devToolsOverlayMask').should('not.exist');
    });

    it('should toggle navbar when pressing Shift+B', () => {
      cy.getElementByTestId('toggleNavButton').then(($button) => {
        const initialAriaExpanded = $button.attr('aria-expanded');
        cy.get('body').type('{shift+b}');
        cy.getElementByTestId('toggleNavButton').should(($newButton) => {
          const newAriaExpanded = $newButton.attr('aria-expanded');
          expect(newAriaExpanded).to.not.equal(initialAriaExpanded);
        });
      });
    });

    it('should toggle navbar back when pressing Shift+B again', () => {
      cy.getElementByTestId('toggleNavButton').then(($button) => {
        const initialAriaExpanded = $button.attr('aria-expanded');
        cy.get('body').type('{shift+b}');
        cy.get('body').type('{shift+b}');
        cy.getElementByTestId('toggleNavButton').should(
          'have.attr',
          'aria-expanded',
          initialAriaExpanded
        );
      });
    });
  });

  describe('Help Modal - visualize', () => {
    it('should open help modal, verify content, and close properly', () => {
      cy.visit(`/w/${workspaceId}/app/visualize`);
      cy.wait(2000);
      cy.get('body').should('be.visible');
      cy.get('body').click();
      cy.wait(500);

      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.wait(1000);
      cy.contains('Keyboard shortcuts').should('be.visible');

      cy.contains('Navigation').should('be.visible');
      cy.get('[data-test-subj="keyboardShortcutsModal"]').within(() => {
        cy.get('kbd').should('exist');
      });
      cy.contains('Show this help').should('be.visible');

      cy.getElementByTestId('keyboardShortcutsCloseButton').click();
      cy.wait(500);
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
    });

    it('should close modal when pressing Escape', () => {
      cy.get('body').click();

      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.get('body').type('{esc}');
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
    });

    it('should close modal when clicking outside', () => {
      // Wait for page to fully load and ensure focus

      cy.get('body').click();

      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.get('.euiOverlayMask').click({ force: true });
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
    });

    it('should reopen modal after closing', () => {
      cy.get('body').click();

      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.getElementByTestId('keyboardShortcutsCloseButton').click();
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.contains('Keyboard shortcuts').should('be.visible');
      cy.get('body').type('{esc}');
    });
  });

  describe('Keyboard Shortcuts global shortcut - visualize', () => {
    it('should navigate to dashboard when pressing G then B', () => {
      cy.get('body').type('g').type('b');
      cy.url().should('match', /\/w\/[^\/]+\/app\/dashboards/, { timeout: 10000 });
    });

    it('should navigate to visualization when pressing G then V', () => {
      cy.get('body').type('g').type('v');
      cy.url().should('match', /\/w\/[^\/]+\/app\/visualize/, { timeout: 10000 });
    });

    it('should navigate to discover when pressing G then D', () => {
      cy.get('body').type('g').type('d');
      cy.url().should('match', /\/w\/[^\/]+\/app\/explore/, { timeout: 10000 });

      cy.get('body').click();
      cy.wait(500);
    });

    it('should open dev tools modal when pressing Shift+`', () => {
      cy.get('body').click();
      cy.get('body').type('{shift+`}');
      cy.contains('Dev Tools').should('be.visible');
    });

    it('should close dev tools modal when pressing Escape', () => {
      cy.get('body').type('{shift+`}');
      cy.get('.devToolsOverlayMask').should('be.visible', { timeout: 10000 });

      cy.get('body').type('{esc}');
      cy.wait(1000);
      cy.get('button[aria-label="close modal"]').click();
      cy.wait(1000);
      cy.get('.devToolsOverlayMask').should('not.exist');
    });

    it('should toggle navbar when pressing Shift+B', () => {
      cy.getElementByTestId('toggleNavButton').then(($button) => {
        const initialAriaExpanded = $button.attr('aria-expanded');
        cy.get('body').type('{shift+b}');
        cy.getElementByTestId('toggleNavButton').should(($newButton) => {
          const newAriaExpanded = $newButton.attr('aria-expanded');
          expect(newAriaExpanded).to.not.equal(initialAriaExpanded);
        });
      });
    });

    it('should toggle navbar back when pressing Shift+B again', () => {
      cy.getElementByTestId('toggleNavButton').then(($button) => {
        const initialAriaExpanded = $button.attr('aria-expanded');
        cy.get('body').type('{shift+b}');
        cy.get('body').type('{shift+b}');
        cy.getElementByTestId('toggleNavButton').should(
          'have.attr',
          'aria-expanded',
          initialAriaExpanded
        );
      });
    });
  });
  describe('Help Modal - discover', () => {
    it('should open help modal, verify content, and close properly', () => {
      cy.visit(`/w/${workspaceId}/app/explore/logs`);
      cy.wait(2000);
      cy.get('body').should('be.visible');
      cy.wait(500);
      cy.get('body').click();
      cy.wait(500);

      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.wait(1000);
      cy.contains('Keyboard shortcuts').should('be.visible');

      cy.contains('Navigation').should('be.visible');
      cy.get('[data-test-subj="keyboardShortcutsModal"]').within(() => {
        cy.get('kbd').should('exist');
      });
      cy.contains('Show this help').should('be.visible');

      cy.getElementByTestId('keyboardShortcutsCloseButton').click();
      cy.wait(500);
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
    });

    it('should close modal when pressing Escape', () => {
      cy.get('body').click();

      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.get('body').type('{esc}');
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
    });

    it('should close modal when clicking outside', () => {
      cy.get('body').click();

      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.get('.euiOverlayMask').click({ force: true });
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
    });

    it('should reopen modal after closing', () => {
      cy.get('body').click();

      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.getElementByTestId('keyboardShortcutsCloseButton').click();
      cy.getElementByTestId('keyboardShortcutsModal').should('not.exist');
      cy.get('body').type('{shift+/}');
      cy.getElementByTestId('keyboardShortcutsModal', { timeout: 10000 }).should('be.visible');
      cy.contains('Keyboard shortcuts').should('be.visible');
      cy.get('body').type('{esc}');
    });
  });

  describe('Keyboard Shortcuts global shortcut - visualize', () => {
    it('should navigate to dashboard when pressing G then B', () => {
      cy.get('body').type('g').type('b');
      cy.url().should('match', /\/w\/[^\/]+\/app\/dashboards/, { timeout: 10000 });
    });

    it('should navigate to visualization when pressing G then V', () => {
      cy.get('body').type('g').type('v');
      cy.url().should('match', /\/w\/[^\/]+\/app\/visualize/, { timeout: 10000 });
    });

    it('should navigate to discover when pressing G then D', () => {
      cy.get('body').type('g').type('d');
      cy.url().should('match', /\/w\/[^\/]+\/app\/explore/, { timeout: 10000 });
      cy.get('body').click();
      cy.wait(1000);
      cy.get('body').click();
    });

    it('should open dev tools modal when pressing Shift+`', () => {
      cy.get('body').type('{shift+`}');
      cy.contains('Dev Tools').should('be.visible');
    });

    it('should close dev tools modal when pressing Escape', () => {
      cy.get('body').type('{shift+`}');
      cy.get('.devToolsOverlayMask').should('be.visible', { timeout: 10000 });

      cy.get('body').type('{esc}');
      cy.wait(1000);
      cy.get('button[aria-label="close modal"]').click();
      cy.wait(1000);
      cy.get('.devToolsOverlayMask').should('not.exist');
    });

    it('should toggle navbar when pressing Shift+B', () => {
      cy.getElementByTestId('toggleNavButton').then(($button) => {
        const initialAriaExpanded = $button.attr('aria-expanded');
        cy.get('body').type('{shift+b}');
        cy.getElementByTestId('toggleNavButton').should(($newButton) => {
          const newAriaExpanded = $newButton.attr('aria-expanded');
          expect(newAriaExpanded).to.not.equal(initialAriaExpanded);
        });
      });
    });

    it('should toggle navbar back when pressing Shift+B again', () => {
      cy.getElementByTestId('toggleNavButton').then(($button) => {
        const initialAriaExpanded = $button.attr('aria-expanded');
        cy.get('body').type('{shift+b}');
        cy.get('body').type('{shift+b}');
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
      cy.wait(1000);
      cy.getElementByTestId('osdDiscoverSideBarWrapper')
        .should('be.visible')
        .then(($panel) => {
          const initialVisibility = $panel.is(':visible');
          cy.get('body').type('{shift+f}');
          cy.wait(1000);
          if (initialVisibility) {
            cy.getElementByTestId('fieldList-collapse-button').should('exist');
          } else {
            cy.getElementByTestId('osdDiscoverSideBarWrapper').should('be.visible');
          }
        });
    });

    it('should toggle fields panel back when pressing Shift+F again', () => {
      cy.wait(1000);
      cy.get('body').type('{shift+f}');
      cy.getElementByTestId('osdDiscoverSideBarWrapper').should('be.visible');
      cy.getElementByTestId('fieldList-collapse-button').should('exist');
    });
  });

  describe('Recent Queries Shortcut', () => {
    it('should toggle recent queries popover when pressing Shift+Q', () => {
      cy.getElementByTestId('exploreRecentQueriesButton').should('be.visible');
      cy.get('body').type('{shift+q}');
      cy.get('.exploreRecentQueriesButton__popover').should('be.visible');
      cy.get('body').type('{shift+q}');
      cy.get('.exploreRecentQueriesButton__popover').should('not.exist');
    });
  });

  describe('Save Discover Search Shortcut', () => {
    it('should trigger save modal when pressing Cmd+S', () => {
      cy.get('body').type('{cmd+s}');
      cy.get('body').should('be.visible');
      cy.getElementByTestId('discoverSaveButton').should('exist');
      cy.get('body').type('{esc}');
    });
  });

  describe('Open Date Picker Shortcut', () => {
    it('should open date picker when pressing Shift+D', () => {
      cy.getElementByTestId('superDatePickerShowDatesButton').should('be.visible');
      cy.get('body').type('{shift+d}');
      cy.getElementByTestId('superDatePickerRelativeTab').should('be.visible');
      cy.get('body').should('be.visible');
      cy.getElementByTestId('superDatePickerRelativeTab').should('be.visible');
      cy.wait(1000);
      cy.get('body').type('{esc}');
    });
  });

  describe('Focus Query Bar Shortcut', () => {
    it('should focus query editor when pressing / key', () => {
      cy.getElementByTestId('exploreQueryPanelEditor').should('be.visible');
      cy.get('body').type('/');
      cy.getElementByTestId('exploreQueryPanelEditor').within(() => {
        cy.get('textarea').should('be.focused');
      });
      cy.get('body').should('be.visible');
      cy.wait(1000);
      cy.get('body').click();
    });
  });

  describe('Refresh Results Shortcut', () => {
    it('should trigger refresh action when pressing R key', () => {
      cy.wait(1000);
      cy.contains('.euiSuperUpdateButton__text', 'Refresh').should('be.visible');
      cy.get('body').type('r');
      cy.get('body').should('be.visible');
      cy.contains('.euiSuperUpdateButton__text', 'Refresh').should('be.visible');
      cy.contains('.euiSuperUpdateButton__text', 'Refresh').parent().should('not.be.disabled');
    });
  });

  describe('Saved Search Shortcut', () => {
    it('should open saved search flyout when pressing Shift+O', () => {
      cy.get('body').type('{shift+o}');
      cy.getElementByTestId('loadSearchForm').should('be.visible');
      cy.getElementByTestId('loadSearchForm').should('have.attr', 'role', 'dialog');
      cy.getElementByTestId('loadSearchForm').should('have.class', 'euiFlyout');
      cy.get('body').should('be.visible');
      // Clean up
      cy.get('body').type('{esc}');
      cy.getElementByTestId('loadSearchForm').should('not.exist');
    });
  });

  describe('Dashboard-Specific Shortcuts', () => {
    it('should enter edit mode when pressing E key', () => {
      cy.visit(`/w/${workspaceId}/app/dashboards`);
      cy.wait(2000);
      cy.get('body').should('be.visible');
      cy.get('body').click();
      cy.getElementByTestId(
        'dashboardListingTitleLink-[Logs]-Chart-and-Visualization-demo'
      ).click();
      cy.getElementByTestId('dashboardEditSwitch').then(($switch) => {
        const isInEditMode = $switch.attr('aria-checked') === 'true';
        if (!isInEditMode) {
          cy.get('body').type('{shift+e}');
          // Verify edit mode is now active
          cy.getElementByTestId('dashboardEditSwitch').should('have.attr', 'aria-checked', 'true');
        }
      });
    });

    it('should save dashboard when pressing Cmd+S in edit mode', () => {
      cy.getElementByTestId('dashboardEditSwitch').then(($switch) => {
        const isInEditMode = $switch.attr('aria-checked') === 'true';
        if (!isInEditMode) {
          cy.get('body').type('{shift+e}');
          cy.getElementByTestId('dashboardEditSwitch').should('have.attr', 'aria-checked', 'true');
        }

        cy.get('body').type('{cmd+s}');
        cy.getElementByTestId('savedObjectSaveModal').should('be.visible');
        cy.contains('Save dashboard').should('be.visible');
        cy.get('body').type('{esc}');
      });
    });

    it('should open add panel flyout when pressing A key', () => {
      cy.getElementByTestId('dashboardEditSwitch').then(($switch) => {
        const isInEditMode = $switch.attr('aria-checked') === 'true';
        if (!isInEditMode) {
          cy.get('body').type('{shift+e}');
          cy.getElementByTestId('dashboardEditSwitch').should('have.attr', 'aria-checked', 'true');
        }

        cy.get('body').type('a');
        cy.getElementByTestId('dashboardAddPanel').should('be.visible');
        cy.contains('Add panels').should('be.visible');
        cy.get('body').type('{esc}');
      });
    });
  });

  describe('Toggle Full-Screen Shortcuts', () => {
    it('should enter full-screen mode when pressing Shift+F', () => {
      cy.get('body').type('{shift+f}');
      cy.getElementByTestId('exitFullScreenModeLogo').should('be.visible');
      cy.contains('Exit full screen').should('be.visible');
      cy.get('body').type('{esc}');
    });
  });

  describe('Refresh Results Shortcut - dashboard', () => {
    it('should trigger refresh action when pressing R key', () => {
      cy.contains('.euiSuperUpdateButton__text', 'Refresh').should('be.visible');
      cy.get('body').type('r');
      cy.contains('.euiSuperUpdateButton__text', 'Refresh').should('be.visible');
      cy.contains('.euiSuperUpdateButton__text', 'Refresh').parent().should('not.be.disabled');
    });
  });

  describe('Date Picker Shortcuts - dashboard', () => {
    it('should open date picker when pressing Shift+D', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-test-subj="superDatePickerShowDatesButton"]').length > 0) {
          cy.getElementByTestId('superDatePickerShowDatesButton').should('be.visible');
          cy.get('body').type('{shift+d}');
          cy.getElementByTestId('superDatePickerRelativeTab').should('be.visible');
          cy.get('body').type('{esc}');
        }
      });
    });
  });

  describe('Focus Query Bar Shortcut - dashboard', () => {
    it('should focus query input textarea when pressing / key', () => {
      cy.get('[data-test-subj="queryInput"]').should('be.visible');
      cy.get('body').click();
      cy.get('[data-test-subj="queryInput"]').should('not.be.focused');
      cy.get('body').type('/');
      cy.get('[data-test-subj="queryInput"]').should('be.focused');
      cy.get('body').click();
    });

    describe('Save Visualization Shortcut', () => {
      it('should save visualization when pressing Cmd+S', () => {
        cy.visit(`/w/${workspaceId}/app/visualize`);
        cy.wait(2000);
        cy.get('body').should('be.visible');
        cy.get('body').click();
        cy.getElementByTestId('visListingTitleLink-(Area)-Stacked-extensions-over-time').click();

        cy.wait(3000);
        cy.getElementByTestId('visualizeSaveButton').should('be.visible');
        cy.get('body').type('{cmd+s}');
        cy.getElementByTestId('savedObjectSaveModal').should('be.visible');
        cy.contains('Save visualization').should('be.visible');
        cy.get('body').type('{esc}');
      });
    });

    describe('Focus Query Bar Shortcut - visualize', () => {
      it('should focus query input textarea when pressing / key', () => {
        cy.get('[data-test-subj="queryInput"]').should('be.visible');
        cy.get('body').click();
        cy.get('[data-test-subj="queryInput"]').should('not.be.focused');
        cy.get('body').type('/');
        cy.get('[data-test-subj="queryInput"]').should('be.focused');
        cy.get('body').click();
      });
    });

    describe('Toggle Visualization Sidebar Shortcut - visualize', () => {
      it('should toggle visualization sidebar when pressing Shift+C', () => {
        cy.wait(1000);
        cy.getElementByTestId('collapseSideBarButton').should('be.visible');
        cy.getElementByTestId('collapseSideBarButton').then(($button) => {
          const initialAriaExpanded = $button.attr('aria-expanded');
          cy.get('body').type('{shift+c}');
          cy.wait(500);
          cy.getElementByTestId('collapseSideBarButton').should(($newButton) => {
            const newAriaExpanded = $newButton.attr('aria-expanded');
            expect(newAriaExpanded).to.not.equal(initialAriaExpanded);
          });
        });
      });

      it('should toggle visualization sidebar back when pressing Shift+C again - visualize', () => {
        cy.wait(1000);
        cy.getElementByTestId('collapseSideBarButton').then(($button) => {
          const initialAriaExpanded = $button.attr('aria-expanded');
          cy.get('body').type('{shift+c}');
          cy.wait(500);
          cy.get('body').type('{shift+c}');
          cy.wait(500);
          cy.getElementByTestId('collapseSideBarButton').should(
            'have.attr',
            'aria-expanded',
            initialAriaExpanded
          );
        });
      });
    });

    describe('Refresh Results Shortcut - visualize', () => {
      it('should trigger refresh action when pressing R key', () => {
        cy.contains('.euiSuperUpdateButton__text', 'Refresh').should('be.visible');
        cy.get('body').type('r');
        cy.get('body').should('be.visible');
        cy.contains('.euiSuperUpdateButton__text', 'Refresh').should('be.visible');
        cy.contains('.euiSuperUpdateButton__text', 'Refresh').parent().should('not.be.disabled');
      });
    });

    describe('Date Picker Shortcuts - visualize', () => {
      it('should open date picker when pressing Shift+D', () => {
        cy.get('body').then(($body) => {
          if ($body.find('[data-test-subj="superDatePickerShowDatesButton"]').length > 0) {
            cy.getElementByTestId('superDatePickerShowDatesButton').should('be.visible');
            cy.get('body').type('{shift+d}');
            cy.getElementByTestId('superDatePickerRelativeTab').should('be.visible');
            cy.get('body').type('{esc}');
          }
        });
      });
    });
  });
});
