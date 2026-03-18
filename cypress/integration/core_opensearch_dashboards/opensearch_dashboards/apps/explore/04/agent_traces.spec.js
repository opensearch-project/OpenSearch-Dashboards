/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME } from '../../../../../../utils/apps/explore/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite, createWorkspaceWithDatasource } from '../../../../../../utils/helpers';

const AGENT_TRACES_INDEX_PATTERN = 'agent_traces_cy_test*';
const AGENT_TRACES_TIME_FIELD = 'startTime';
const AGENT_TRACES_START = 'Sep 1, 2026 @ 00:00:00.000';
const AGENT_TRACES_END = 'Oct 1, 2026 @ 00:00:00.000';

const workspaceName = getRandomizedWorkspaceName();

const visitAgentTraces = () => {
  const workspaceId = Cypress.env(`${workspaceName}:WORKSPACE_ID`);
  cy.visit(`/w/${workspaceId}/app/agentTraces/`);
  cy.osd.waitForLoader(true);
  cy.getElementByTestId('headerGlobalNav').should('be.visible').click({ force: true });
};

const selectDatasetAndWaitForData = () => {
  cy.explore.setIndexPatternFromAdvancedSelector(
    AGENT_TRACES_INDEX_PATTERN,
    DATASOURCE_NAME,
    undefined,
    AGENT_TRACES_TIME_FIELD
  );

  cy.getElementByTestId('datasetSelectButton').should('contain.text', AGENT_TRACES_INDEX_PATTERN);

  cy.osd.setTopNavDate(AGENT_TRACES_START, AGENT_TRACES_END);

  cy.get('.agentTracesTable__container .agentTraces-table tbody tr', { timeout: 15000 }).should(
    'have.length.greaterThan',
    0
  );
};

const enterStatsQueryAndRunIt = () => {
  // Agent traces uses a custom query panel editor, not the global query editor,
  // so we interact with the Monaco editor directly instead of cy.setQueryEditor().
  cy.getElementByTestId('headerGlobalNav').should('be.visible').click({ force: true });
  cy.get('[data-test-subj="agentTracesQueryPanelEditor"] .react-monaco-editor-container')
    .should('be.visible')
    .click({ force: true });
  cy.get('.inputarea')
    .focus()
    .type('{selectAll}{del}', { force: true })
    .wait(200)
    .type('| stats count() by `attributes.gen_ai.operation.name`', {
      delay: 50,
      force: true,
    })
    .type('{esc}', { force: true }); // Dismiss autocomplete suggestions
  cy.updateTopNav({ log: false });
  cy.osd.waitForLoader(true);
};

const switchToVisualizationTab = () => {
  cy.getElementByTestId('agentTracesTabs').within(() => {
    cy.contains('.euiTab__content', 'Visualization').parent('button').click();
  });
  cy.getElementByTestId('agentTracesTabs')
    .find('.euiTab-isSelected .euiTab__content')
    .should('contain.text', 'Visualization');
};
const agentTracesTestSuite = () => {
  before(() => {
    cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);
    createWorkspaceWithDatasource(DATASOURCE_NAME, workspaceName, ['use-case-observability']);
  });

  after(() => {
    cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
  });

  describe('Agent Traces Plugin', () => {
    beforeEach(() => {
      visitAgentTraces();
    });

    afterEach(() => {
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
    });

    it('should select dataset and display traces data', () => {
      selectDatasetAndWaitForData();

      cy.getElementByTestId('agentTracesTabs').should('be.visible');
      cy.getElementByTestId('agentTracesTabs').within(() => {
        cy.contains('.euiTab__content', 'Traces').should('exist');
        cy.contains('.euiTab__content', 'Spans').should('exist');
        cy.contains('.euiTab__content', 'Visualization').should('exist');
      });

      cy.get('.agentTracesMetrics__bar').should('be.visible');
      cy.get('.agentTracesMetrics__bar').within(() => {
        cy.contains('Total Traces').should('be.visible');
        cy.contains('Total Spans').should('be.visible');
        cy.contains('Total Tokens').should('be.visible');
        cy.contains('Latency P50').should('be.visible');
        cy.contains('Latency P99').should('be.visible');
      });

      cy.get('.agentTracesTable__container').should('be.visible');
      cy.get('.agentTracesTable__container')
        .contains(/\d+ of \d+/)
        .should('be.visible');

      cy.get('.agentTraces__categoryBadge').contains('Agent').should('exist');
    });

    it('should switch to Spans tab and show span data', () => {
      selectDatasetAndWaitForData();

      cy.getElementByTestId('agentTracesTabs').within(() => {
        cy.contains('.euiTab__content', 'Spans').parent('button').click();
      });

      cy.getElementByTestId('agentTracesTabs')
        .find('.euiTab-isSelected .euiTab__content')
        .should('contain.text', 'Spans');

      cy.get('.agentTracesTabs [role="tabpanel"]', { timeout: 15000 }).within(() => {
        cy.get('.agentTracesTable__container').should('exist');
        cy.get('.agentTraces-table tbody tr', { timeout: 15000 }).should(
          'have.length.greaterThan',
          0
        );
      });
    });
    it('should expand a trace row to show child spans', () => {
      selectDatasetAndWaitForData();

      cy.get('.agentTracesTable__kindCell button[aria-label="Expand"]').eq(1).click();

      cy.get('.agentTracesTabs [role="tabpanel"]', { timeout: 15000 }).within(() => {
        cy.get('.agentTraces__categoryBadge').contains('LLM').should('exist');
        cy.get('.agentTraces__categoryBadge').contains('Tool').should('exist');
      });

      cy.get('.agentTracesTable__kindCell button[aria-label="Collapse"]').should('exist');
      cy.get('.agentTracesTable__kindCell button[aria-label="Collapse"]').first().click();

      cy.get('.agentTracesTabs [role="tabpanel"]').within(() => {
        cy.get('.agentTraces__categoryBadge').contains('LLM').should('not.exist');
        cy.get('.agentTraces__categoryBadge').contains('Tool').should('not.exist');
      });
    });
    it('should open flyout when clicking a trace row', () => {
      selectDatasetAndWaitForData();

      cy.get('[data-test-subj="agentTracesTimeLink"]').first().click();
      cy.get('.agentTracesFlyout', { timeout: 15000 }).should('be.visible');
      cy.get('.agentTracesFlyout').within(() => {
        cy.get('#trace-details-flyout').should('contain.text', 'POST /plan');

        cy.get('.euiBadge').should('exist');

        cy.contains('Trace Tree').should('be.visible');
        cy.contains('Trace Map').should('be.visible');
        cy.contains('Timeline').should('be.visible');

        cy.get('.agentTracesFlyout__treeRow', { timeout: 15000 }).should(
          'have.length.greaterThan',
          0
        );

        cy.get('.agentTracesFlyout__detailPanel').should('be.visible');
        cy.contains('Metadata').should('be.visible');
        cy.contains('Operation:').should('be.visible');
        cy.contains('Duration:').should('be.visible');
        cy.contains('Span ID:').should('be.visible');

        cy.contains('Input / Output').should('be.visible');
      });

      cy.get('body').type('{esc}');
      cy.get('.agentTracesFlyout').should('not.exist');
    });

    it('should support column sorting on traces table', () => {
      selectDatasetAndWaitForData();

      cy.getElementByTestId('docTableHeaderFieldSort_name').click();

      cy.get('.agentTracesTable__container .agentTraces-table tbody tr').should(
        'have.length.greaterThan',
        0
      );

      cy.getElementByTestId('docTableHeaderFieldSort_name').click();

      cy.get('.agentTracesTable__container .agentTraces-table tbody tr').should(
        'have.length.greaterThan',
        0
      );
    });

    it('should switch to Visualization tab and render chart with stats query', () => {
      selectDatasetAndWaitForData();
      enterStatsQueryAndRunIt();
      switchToVisualizationTab();

      cy.getElementByTestId('agentTracesVisualizationLoader', { timeout: 15000 }).should(
        'be.visible'
      );
      cy.get('.agentTracesVisContainer canvas', { timeout: 10000 }).should('exist');
    });

    it('should save visualization to a new dashboard and verify embeddable rendering', () => {
      const uniqueId = Date.now();
      const dashboardName = `Agent Traces CY Dashboard ${uniqueId}`;
      const saveSearchName = `Agent Traces CY Vis ${uniqueId}`;

      selectDatasetAndWaitForData();
      enterStatsQueryAndRunIt();
      switchToVisualizationTab();

      cy.getElementByTestId('agentTracesVisualizationLoader', { timeout: 15000 }).should(
        'be.visible'
      );
      cy.get('.agentTracesVisContainer canvas', { timeout: 10000 }).should('exist');

      cy.getElementByTestId('agentTracesAddToDashboardButton').click();
      cy.getElementByTestId('agentTracesAddToDashboardModalTitle').should('be.visible');

      cy.getElementByTestId('saveToNewDashboardRadio').click();

      cy.get('input[placeholder="Enter dashboard name"]').type(dashboardName);
      cy.get('input[placeholder="Enter save search name"]').type(saveSearchName);

      cy.getElementByTestId('saveToDashboardConfirmButton').click();

      cy.getElementByTestId('agentTracesAddToNewDashboardSuccessToast', { timeout: 30000 })
        .should('be.visible')
        .contains(`Agent traces '${saveSearchName}' is successfully added to the dashboard.`);

      cy.getElementByTestId('agentTracesAddToNewDashboardSuccessToast')
        .contains('View Dashboard')
        .should('have.attr', 'href')
        .then((href) => {
          expect(href).to.include('/app/dashboards#/view/');
          cy.visit(href);
        });

      cy.osd.waitForLoader(true);

      cy.getElementByTestId('headerAppActionMenu').contains(dashboardName).should('exist');
      cy.getElementByTestId('dashboardPanelTitle').contains(saveSearchName).should('exist');

      cy.osd.setTopNavDate(AGENT_TRACES_START, AGENT_TRACES_END);

      cy.getElementByTestId('embeddedSavedAgentTraces', { timeout: 30000 }).should('be.visible');
    });
  });
};

prepareTestSuite('Agent Traces', agentTracesTestSuite);
