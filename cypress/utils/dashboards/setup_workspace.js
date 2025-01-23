/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const dataSourceTitle = Cypress.env('dataSourceTitle');

export function createWorkspaceAndSampleData(url, workspaceName) {
  describe('setup workspace', () => {
    describe('checking home page', () => {
      it('checking workspace initial page', () => {
        cy.visit(`${url}/app/home`);
        cy.getElementByTestId('workspace-initial-card-createWorkspace-button').should('be.visible');
      });
    });

    describe('creating workspace', () => {
      it('creating workspace with data source', () => {
        cy.visit(`${url}/app/home`);
        cy.osd.createInitialWorkspaceWithDataSource(dataSourceTitle, workspaceName);
        cy.wait(2000);
      });
    });

    describe('adding sample data to workspace', () => {
      it('add sample data to data source', () => {
        cy.visit(`${url}/app/workspace_list`);
        cy.osd.openWorkspaceDashboard(workspaceName);
        cy.openSampleDataPage();
        cy.addSampleDataToDataSource(dataSourceTitle);
      });
    });
  });
}
