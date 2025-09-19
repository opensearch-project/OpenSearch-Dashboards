/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import '../../../../../../utils/dashboards/workspace/commands';
import { DATASOURCE_NAME } from '../../../../../../utils/apps/explore/constants';
import { PATHS } from '../../../../../../utils/constants';

describe('Keyboard Shortcuts Tests', () => {
  let workspaceId;
  const endpoint = Cypress.config('baseUrl') || 'http://localhost:5601';
  const workspaceName = `test-workspace-${Date.now()}`;

  before(() => {
    if (PATHS.SECONDARY_ENGINE) {
      cy.osd.addDataSource({
        name: DATASOURCE_NAME,
        url: PATHS.SECONDARY_ENGINE,
        authType: 'no_auth',
      });

      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteAllOldWorkspaces();

      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);

      cy.get('@WORKSPACE_ID').then((wsId) => {
        workspaceId = wsId;
        cy.wrap(workspaceId).as('workspaceId');

        cy.loadSampleDataForWorkspaceWithEndpoint(endpoint, 'logs', workspaceId);

        cy.visit(`/w/${workspaceId}/app/dashboards`);
        cy.get('body').should('be.visible');
        cy.wait(6000);
      });
    } else {
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteAllOldWorkspaces();

      cy.createWorkspaceWithEndpoint(endpoint, {
        name: workspaceName,
        features: ['use-case-observability'],
        description: 'Test workspace for keyboard shortcuts',
      }).then((workspace) => {
        workspaceId = workspace.id;
        cy.wrap(workspaceId).as('workspaceId');

        cy.loadSampleDataForWorkspaceWithEndpoint(endpoint, 'logs', workspaceId);

        cy.visit(`/w/${workspaceId}/app/dashboards`);
        cy.get('body').should('be.visible');
        cy.wait(6000);
      });
    }
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

    // Clean up data source only if it was created
    if (PATHS.SECONDARY_ENGINE) {
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
    }
  });

  describe('Help Modal - dashboard', () => {
    it('should open help modal, verify content, and close properly', () => {
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
  });

  describe('Keyboard Shortcuts global shortcut', () => {
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
  });

  describe('Help Modal - discover', () => {
    it('should open help modal, verify content, and close properly', () => {
      cy.visit(`/w/${workspaceId}/app/explore/logs`);
      cy.explore.setRelativeTopNavDate(7, 'y');
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

  describe('Add to Dashboard Shortcut', () => {
    it('should open add to dashboard modal when pressing A key', () => {
      cy.get('body').type('a');
      cy.getElementByTestId('addToDashboardModalTitle')
        .should('be.visible')
        .and('contain', 'Save and Add to Dashboard');
    });
  });

  describe('Switch to Patterns Tab Shortcut', () => {
    it('should switch to patterns tab when pressing Shift+P', () => {
      cy.get('body').type('{shift+p}');
      cy.get('#explore_patterns_tab').should('have.attr', 'aria-selected', 'true');
    });
  });

  describe('Switch to Logs Tab Shortcut', () => {
    it('should switch to logs tab when pressing Shift+L', () => {
      cy.get('body').type('{shift+l}');
      cy.get('#logs').should('have.attr', 'aria-selected', 'true');
    });
  });

  describe('Switch to Visualization Tab Shortcut', () => {
    it('should switch to visualization tab when pressing Shift+V', () => {
      cy.get('body').type('{shift+v}');
      cy.get('#explore_visualization_tab').should('have.attr', 'aria-selected', 'true');
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
