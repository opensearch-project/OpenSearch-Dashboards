/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME } from '../../../../../../utils/apps/explore/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { INDEX_WITH_TIME_1 } from '../../../../../../utils/constants';

const workspaceName = getRandomizedWorkspaceName();
const INDEX_PATTERN_NAME = 'otel-v1-apm-span-*';
const TIME_FIELD_NAME = 'endTime';

const traceTestSuite = () => {
  describe('Trace Exploration Tests', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    it('should show empty state when no index pattern exists', function () {
      cy.osd.navigateToTracesViaLogsUrl({
        workspaceName: workspaceName,
        isEnhancement: true,
      });
      cy.getElementByTestId('discoverNoIndexPatterns').should('be.visible');
    });

    it('should create trace index pattern and navigate to trace details', function () {
      // Navigate to sample data page
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'import_sample_data',
        isEnhancement: true,
      });
      cy.wait(2000);
      cy.osd.grabIdsFromDiscoverPageUrl();
      cy.url().should('include', 'import_sample_data');

      // Install OTEL sample data if not already present
      cy.get('body').then(($body) => {
        if ($body.find('[data-test-subj="addSampleDataSetotel"]').length > 0) {
          cy.getElementByTestId('addSampleDataSetotel').should('be.visible').click();
          // Wait for the Remove button to appear, indicating successful installation
          cy.getElementByTestId('removeSampleDataSetotel', { timeout: 30000 }).should('be.visible');
        }
      });

      // Create index pattern for traces
      cy.wait(2000);
      cy.log('Creating trace index pattern');
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_NAME.replace('*', ''),
        timefieldName: TIME_FIELD_NAME,
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });

      // Navigate back to traces page
      cy.osd.navigateToTracesViaLogsUrl({
        workspaceName: workspaceName,
        isEnhancement: true,
      });

      // Click on dataset selector to close Syntax options if blocking time-picker
      cy.getElementByTestId('datasetSelectButton').should('be.visible').click();

      // Set time range to capture OTEL sample data - last 2 months
      cy.explore.setRelativeTopNavDate('12', 'Months ago');

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

prepareTestSuite('Discover Traces', traceTestSuite);
