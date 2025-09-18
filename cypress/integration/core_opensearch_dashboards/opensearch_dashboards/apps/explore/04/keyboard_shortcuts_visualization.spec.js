/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1, BASE_PATH } from '../../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

export const runKeyboardShortcutsTests = () => {
  describe('keyboard shortcuts tests for dashboard with sample data', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);

      cy.osd.navigateToWorkSpaceSpecificPage({
        url: BASE_PATH,
        workspaceName: workspaceName,
        page: 'import_sample_data',
        isEnhancement: true,
      });

      cy.wait(3000);

      cy.getElementByTestId('addSampleDataSetflights').should('be.visible').click();
      cy.getElementByTestId('sampleDataSetInstallToast').should('exist');
      cy.wait(3000);

      cy.getElementByTestId('launchSampleDataSetflights').should('be.visible').click();
      cy.wait(2000);

      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'visualize',
        isEnhancement: true,
      });
      cy.wait(2000);
      cy.get('[data-test-subj="visListingTitleLink-[Flights]-Airline-Carrier_data-logs-1"]')
        .should('be.visible')
        .click();
      cy.wait(2000);
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'visualize',
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

    describe('Navigation Shortcuts', () => {
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
    describe('Save Visualization Shortcut', () => {
      it('should save visualization when pressing Cmd+S', () => {
        cy.wait(3000);
        cy.getElementByTestId('visualizeSaveButton').should('be.visible');
        cy.get('body').type('{cmd+s}');
        cy.wait(1000);
        cy.getElementByTestId('savedObjectSaveModal').should('be.visible');
        cy.contains('Save visualization').should('be.visible');
        cy.get('body').type('{esc}');
        cy.wait(500);
      });
    });

    describe('Focus Query Bar Shortcut', () => {
      it('should focus query input textarea when pressing / key', () => {
        cy.wait(3000);
        cy.get('[data-test-subj="queryInput"]').should('be.visible');
        cy.get('body').click();
        cy.wait(100);
        cy.get('[data-test-subj="queryInput"]').should('not.be.focused');
        cy.get('body').type('/');
        cy.wait(500);
        cy.get('[data-test-subj="queryInput"]').should('be.focused');
      });
    });

    describe('Toggle Visualization Sidebar Shortcut', () => {
      it('should toggle visualization sidebar when pressing Shift+C', () => {
        cy.wait(3000);
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

      it('should toggle visualization sidebar back when pressing Shift+C again', () => {
        cy.wait(3000);
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

    describe('Refresh Results Shortcut', () => {
      it('should trigger refresh action when pressing R key', () => {
        cy.contains('.euiSuperUpdateButton__text', 'Refresh').should('be.visible');
        cy.get('body').type('r');
        cy.wait(1000);
        cy.get('body').should('be.visible');
        cy.contains('.euiSuperUpdateButton__text', 'Refresh').should('be.visible');
        cy.contains('.euiSuperUpdateButton__text', 'Refresh').parent().should('not.be.disabled');
      });
    });

    describe('Date Picker Shortcuts', () => {
      it('should open date picker when pressing Shift+D', () => {
        cy.get('body').then(($body) => {
          if ($body.find('[data-test-subj="superDatePickerShowDatesButton"]').length > 0) {
            cy.getElementByTestId('superDatePickerShowDatesButton').should('be.visible');
            cy.get('body').type('{shift+d}');
            cy.wait(1000);
            cy.getElementByTestId('superDatePickerRelativeTab').should('be.visible');
          }
        });
      });
    });
  });
};

prepareTestSuite('Dashboard Keyboard Shortcuts with Sample Data', runKeyboardShortcutsTests);
