/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME } from '../../../../../../utils/apps/explore/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite, createWorkspaceWithDatasource } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const traceAutoDetectTestSuite = () => {
  before(() => {
    // Seeds the data source (with dataSourceEngineType) + OTel span/log fixture indices.
    cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

    // Workspace with the data source but intentionally NO trace dataset, so the auto-detect
    // callout appears and we exercise the app's auto-create path (not the API dataset helper,
    // which bypasses it and writes a legacy reference type).
    createWorkspaceWithDatasource(DATASOURCE_NAME, workspaceName, ['use-case-observability']);
  });

  after(() => {
    cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
  });

  describe('Trace dataset auto-create', () => {
    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'explore/traces',
        isEnhancement: true,
      });
      cy.get('[data-test-subj="globalLoadingIndicator"]').should('not.exist');
    });

    it('auto-creates a trace dataset bound to its data source and renders without a connection error', () => {
      // The callout renders only when OTel trace data is detected and no trace dataset exists yet.
      cy.getElementByTestId('traceAutoDetectCallout').should('be.visible');
      cy.getElementByTestId('traceAutoDetectCreateButton').should('be.enabled').click();

      // Auto-create persists the dataset then reloads the page; the callout no longer shows
      // once a trace dataset exists.
      cy.getElementByTestId('traceAutoDetectCallout').should('not.exist');
      cy.get('[data-test-subj="globalLoadingIndicator"]').should('not.exist');
      cy.explore.setTopNavDate('Aug 1, 2025 @ 00:00:00.000', 'Sep 25, 2025 @ 00:00:00.000');

      // Regression guard 1 (root cause, deterministic): the auto-created index-pattern must
      // persist its data-source reference as the registered type 'data-source' — not the engine
      // type ('OpenSearch'), which previously dropped the binding and caused a 503.
      cy.get(`@${workspaceName}:WORKSPACE_ID`).then((workspaceId) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.config('baseUrl')}/w/${workspaceId}/api/saved_objects/_find`,
          headers: { 'osd-xsrf': true },
          qs: { type: 'index-pattern', per_page: 100 },
        }).then((resp) => {
          const tracePattern = (resp.body?.saved_objects || []).find((obj) =>
            obj.attributes?.title?.includes('otel_v1_apm_span')
          );
          expect(tracePattern, 'auto-created trace index-pattern exists').to.not.equal(undefined);
          const ref = (tracePattern.references || []).find((r) => r.name === 'dataSource');
          expect(ref, 'dataSource reference exists').to.not.equal(undefined);
          expect(ref.type).to.equal('data-source');
        });
      });

      // Regression guard 2 (symptom): the Spans grid renders and there is no query error
      // (e.g. "No Living connections") from an unbound data source.
      cy.getElementByTestId('docTableHeader-endTime').should('exist');
      cy.getElementByTestId('queryResultError').should('not.exist');
      cy.contains('No Living connections').should('not.exist');
    });
  });
};

prepareTestSuite('Trace dataset auto-create', traceAutoDetectTestSuite);
