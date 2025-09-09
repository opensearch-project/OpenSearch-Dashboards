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

const traceTestSuite = () => {
  describe('Trace Sanity Tests', () => {
    before(() => {
      cy.explore.setupWorkspaceAndDataSourceWithTraces(workspaceName, [TRACE_INDEX]);
    });

    after(() => {
      cy.explore.cleanupWorkspaceAndDataSourceAndTraces(workspaceName, [TRACE_INDEX]);
    });

    it('should show empty state when no index pattern exists', function () {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/traces',
        isEnhancement: true,
      });
      cy.getElementByTestId('discoverNoIndexPatterns').should('be.visible');
    });

    it('should create trace index pattern and navigate to trace details', function () {
      cy.osd.grabIdsFromDiscoverPageUrl();

      // Create index pattern for traces (data is already loaded by setup function)
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: TRACE_INDEX_PATTERN.replace('*', ''),
        timefieldName: TRACE_TIME_FIELD,
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
        signalType: 'traces',
      });

      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/traces',
        isEnhancement: true,
      });

      // Click on dataset selector to close Syntax options if blocking time-picker
      cy.getElementByTestId('datasetSelectButton').should('be.visible').click();

      // Set time range to capture OTEL sample data
      cy.explore.setRelativeTopNavDate('3', 'Years ago');

      // Verify empty state is no longer visible
      cy.getElementByTestId('discoverNoIndexPatterns').should('not.exist');

      // Wait for span links and navigate to trace details
      cy.get('[data-test-subj="spanIdLink"]', { timeout: 30000 }).should('exist');

      // Intercept window.open to capture URL and navigate in same tab
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });

      cy.get('[data-test-subj="spanIdLink"]').first().click();

      cy.get('@windowOpen')
        .should('have.been.called')
        .then((stub) => {
          const traceUrl = stub.args[0][0];
          cy.log(`Navigating to trace details: ${traceUrl}`);
          cy.visit(traceUrl);
        });

      // Verify trace details page loaded
      cy.osd.waitForLoader(true);
      cy.url().should('include', 'traceDetails');
      cy.get('button[role="tab"]').contains('Timeline').should('be.visible');
    });
  });
};

prepareTestSuite('Traces Sanity', traceTestSuite);
