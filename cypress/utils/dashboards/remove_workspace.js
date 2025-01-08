/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function removeSampleDataAndWorkspace(url, workspaceName) {
  describe('removing workspace/sampledata', () => {
    it('remove workspace', () => {
      cy.visit(`${url}/app/workspace_list`);
      cy.osd.openWorkspaceDashboard(workspaceName);
      cy.getElementByTestId('toggleNavButton').eq(0).should('exist').click();
      cy.wait(3000);
      cy.getElementByTestId('collapsibleNavAppLink-workspace_detail').should('exist').click();
      cy.deleteWorkspace(workspaceName);
    });
  });
}
