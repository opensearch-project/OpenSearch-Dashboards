/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME } from '../../../../../utils/apps/query_enhancements/constants';
import { getRandomizedWorkspaceName } from '../../../../../utils/apps/query_enhancements/shared';
import { prepareTestSuite } from '../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const devToolsExecuteQueryTestSuite = () => {
  describe('Dev Tools execute query', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      cy.get('@DATASOURCE_ID').then((datasourceId) => {
        cy.osd.createWorkspaceWithDataSourceId(
          datasourceId,
          workspaceName,
          ['use-case-observability'],
          `${workspaceName}:WORKSPACE_ID`
        );
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'dev_tools',
        isEnhancement: true,
      });
      cy.osd.waitForLoader(true);

      // Dismiss the welcome flyout if present by pressing Escape
      cy.get('body').type('{esc}');
    });

    afterEach(() => {
      cy.window().then((win) => win.sessionStorage.clear());
    });

    it('should execute GET _cat/indices and display response output', () => {
      // Wait for the Ace editor textarea to be ready
      cy.get('textarea.ace_text-input', { timeout: 30000 }).first().should('exist');

      // Focus the Ace editor textarea and type the query
      cy.get('textarea.ace_text-input')
        .first()
        .focus({ force: true })
        .type('{selectall}GET _cat/indices', { force: true });

      // Intercept the console proxy API call
      cy.intercept('POST', '**/api/console/proxy*').as('consoleRequest');

      // Click the send request button
      cy.getElementByTestId('sendRequestButton').click({ force: true });

      // Deep assertion: verify the request completes with a success status
      cy.wait('@consoleRequest').its('response.statusCode').should('be.oneOf', [200, 201]);

      // Verify the response editor panel is visible
      cy.getElementByTestId('response-editor', { timeout: 30000 }).should('be.visible');

      // Deep assertion: response panel contains meaningful output text
      cy.getElementByTestId('response-editor').invoke('text').should('have.length.greaterThan', 0);

      // Deep assertion: response text includes typical _cat/indices output
      cy.getElementByTestId('response-editor')
        .invoke('text')
        .should('match', /health|status|index|\.kibana|green|yellow/);
    });
  });
};

prepareTestSuite('Dev Tools Execute Query', devToolsExecuteQueryTestSuite);
