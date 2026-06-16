/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import '../../../../../../utils/dashboards/workspace/commands';
import { DATASOURCE_NAME } from '../../../../../../utils/apps/explore/constants';
import { PATHS } from '../../../../../../utils/constants';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';

const workspaceName = getRandomizedWorkspaceName();

export const runKeyboardShortcutTests = () => {
  describe('Keyboard Shortcuts Tests', () => {
    let workspaceId;
    const endpoint = Cypress.config('baseUrl') || 'http://localhost:5601';

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
        // Get the data source ID and store it as an alias
        cy.osd.getDataSourceId(DATASOURCE_NAME, endpoint);

        // Use the stored data source ID to create workspace
        cy.get('@DATASOURCE_ID').then((dsId) => {
          // Create a workspace
          cy.createWorkspaceWithEndpoint(endpoint, {
            name: workspaceName,
            settings: {
              permissions: {
                library_write: { users: ['%me%'] },
                write: { users: ['%me%'] },
              },
              dataSources: [dsId],
              dataConnections: [],
            },
          }).then((response) => {
            workspaceId = response.id;
            expect(workspaceId).to.be.a('string').that.is.not.empty;
            cy.loadSampleDataForWorkspaceWithEndpoint(endpoint, 'logs', workspaceId, dsId);

            cy.visit(`/w/${workspaceId}/app/dashboards`);
            cy.get('body').should('be.visible');
            cy.wait(6000);
          });
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
  });
};

prepareTestSuite('Keyboard Shortcut Tests', runKeyboardShortcutTests);
