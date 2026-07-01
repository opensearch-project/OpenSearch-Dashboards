/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME } from '../../../../../utils/apps/query_enhancements/constants';
import { getRandomizedWorkspaceName } from '../../../../../utils/apps/query_enhancements/shared';
import { prepareTestSuite } from '../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const devToolsViewOutputTestSuite = () => {
  describe('Dev Tools view output', { scrollBehavior: false }, () => {
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

      // Dismiss the welcome flyout if present
      cy.get('body').type('{esc}');
    });

    afterEach(() => {
      cy.window().then((win) => win.sessionStorage.clear());
    });

    it('should execute GET _cluster/health and display JSON output with cluster_name and status', () => {
      // Wait for Ace editor to be ready
      cy.get('textarea.ace_text-input', { timeout: 30000 }).first().should('exist');

      // Type the query into the Ace editor
      cy.get('textarea.ace_text-input')
        .first()
        .focus({ force: true })
        .type('{selectall}GET _cluster/health', { force: true });

      // Intercept the console proxy API call
      cy.intercept('POST', '**/api/console/proxy*').as('consoleRequest');

      // Deep: verify send button has the expected data-test-subj attribute
      cy.getElementByTestId('sendRequestButton').should(
        'have.attr',
        'data-test-subj',
        'sendRequestButton'
      );

      // Click send
      cy.getElementByTestId('sendRequestButton').click({ force: true });

      // Deep: wait for intercepted request and verify status code
      cy.wait('@consoleRequest').its('response.statusCode').should('eq', 200);

      // Deep: verify request-editor has correct attribute
      cy.getElementByTestId('request-editor').should(
        'have.attr',
        'data-test-subj',
        'request-editor'
      );

      // Wait for response panel to render
      cy.getElementByTestId('response-editor', { timeout: 30000 }).should('be.visible');

      // Deep: verify response-editor has correct attribute
      cy.getElementByTestId('response-editor').should(
        'have.attr',
        'data-test-subj',
        'response-editor'
      );

      // Deep: verify output contains cluster_name field
      cy.getElementByTestId('response-editor').invoke('text').should('include', 'cluster_name');

      // Deep: verify output contains status field
      cy.getElementByTestId('response-editor').invoke('text').should('include', 'status');

      // Deep: verify output contains a valid cluster health status value
      cy.getElementByTestId('response-editor')
        .invoke('text')
        .should('match', /green|yellow|red/);
    });
  });
};

prepareTestSuite('Dev Tools View Output', devToolsViewOutputTestSuite);
