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
import { verifyMonacoEditorContent } from '../../../../../../utils/apps/explore/autocomplete';

const workspaceName = getRandomizedWorkspaceName();

const traceTestSuite = () => {
  describe('Traces Test', () => {
    before(() => {
      cy.explore.setupWorkspaceAndDataSourceWithTraces(workspaceName, [TRACE_INDEX]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: TRACE_INDEX_PATTERN.replace('*', ''),
        timefieldName: TRACE_TIME_FIELD,
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
        signalType: 'traces',
      });
    });

    beforeEach(() => {
      // mock AI mode disablement
      cy.intercept('GET', '**/enhancements/assist/languages*', {
        statusCode: 200,
        body: {
          configuredLanguages: [],
        },
      });

      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/traces',
        isEnhancement: true,
      });
      cy.explore.setTopNavDate('Jan 1, 2024 @ 00:00:00.000', 'Dec 31, 2025 @ 00:00:00.000');
    });

    after(() => {
      cy.explore.cleanupWorkspaceAndDataSourceAndTraces(workspaceName, [TRACE_INDEX]);
    });

    it('should have default columns on landing page', () => {
      // Time field
      cy.getElementByTestId('docTableHeader-endTimeUnixNano').should('exist');
      cy.getElementByTestId('docTableHeader-spanId').should('exist');
      cy.getElementByTestId('docTableHeader-status.code').should('exist');
      cy.getElementByTestId('docTableHeader-attributes.http.status_code').should('exist');
      cy.getElementByTestId('docTableHeader-resource.attributes.service.name').should('exist');
      cy.getElementByTestId('docTableHeader-name').should('exist');
      cy.getElementByTestId('docTableHeader-durationNano').should('exist');
    });

    it('should have correct tabs', () => {
      cy.getElementByTestId('exploreTabs').contains('.euiTab__content', 'Spans').should('exist');
      cy.getElementByTestId('exploreTabs')
        .find('.euiTab__content', 'Visualization')
        .should('exist');
      cy.getElementByTestId('exploreTabs').find('.euiTab__content').should('have.length', 2);
    });

    it('faceted fields should be present and working', () => {
      cy.getElementByTestId('exploreSideBarFieldGroupButton')
        .contains('.euiButtonEmpty__text', 'Faceted fields')
        .should('exist');
      cy.getElementByTestId('exploreSidebarFacetValue')
        .find('[data-test-subj="fieldToggle-ERROR"][aria-label="Filter for ERROR"]')
        .click();
      verifyMonacoEditorContent(`| WHERE \`status.code\` = 'ERROR'`);
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.verifyResultsCount(2);
    });

    it('Expanding a span entry shows the correct info', () => {
      cy.explore.setQueryEditor("| WHERE spanId = '58f52f0436530c7c'");
      cy.osd.verifyResultsCount(1);
      cy.getElementByTestId('docTableExpandToggleColumn').first().click();
      cy.getElementByTestId('osdDocViewer').should('be.visible');
      // Test that timeline is selected as default
      cy.get('#osd_doc_viewer_tab_0.euiTab-isSelected > .euiTab__content').contains('Timeline');
      cy.get('#osd_doc_viewer_tab_1 > .euiTab__content').contains('Table');
      cy.get('#osd_doc_viewer_tab_2 > .euiTab__content').contains('JSON');

      // Intercept window.open to capture URL and navigate in same tab
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });

      // Click within gantt chart
      cy.get('[aria-label="Trace spans Gantt chart"]').find('path[stroke-width="3"]').click();

      cy.get('@windowOpen')
        .should('have.been.called')
        .then((stub) => {
          const traceUrl = stub.args[0][0];
          cy.log(`Navigating to trace details: ${traceUrl}`);
          cy.visit(traceUrl);
        });
      // verify that we are on the Trace Details page
      cy.getElementByTestId('headerApplicationTitle').contains(
        'Trace: 68b0ad76fc05c5a5f5e3738d42b8a735'
      );
    });
  });
};

prepareTestSuite('Traces', traceTestSuite);
