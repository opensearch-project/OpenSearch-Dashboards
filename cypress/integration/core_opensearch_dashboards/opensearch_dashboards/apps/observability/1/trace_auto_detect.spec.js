/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME } from '../../../../../../utils/apps/explore/constants';
import { PATHS } from '../../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite, createWorkspaceWithDatasource } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

// The auto-detect logic probes the conventional data-prepper OTel index names
// (hyphenated `otel-v1-apm-span*`). The shared fixtures are seeded with the underscore
// convention (`otel_v1_apm_span_*`), which the detector does not match, so we seed a small
// hyphenated span index (with a `spanId` field) here to make the callout appear.
const TRACE_AUTO_DETECT_INDEX = 'otel-v1-apm-span-000001';

const traceAutoDetectTestSuite = () => {
  before(() => {
    // Seeds the data source (with dataSourceEngineType) + the underscore fixture indices.
    cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

    // Seed a transient hyphenated OTel span index so trace auto-detection fires. Cleaned up
    // in `after`. Created directly in the data source's cluster (the secondary engine).
    cy.request({
      method: 'PUT',
      url: `${PATHS.SECONDARY_ENGINE}/${TRACE_AUTO_DETECT_INDEX}`,
      headers: { 'content-type': 'application/json' },
      body: {
        mappings: {
          properties: {
            spanId: { type: 'keyword' },
            traceId: { type: 'keyword' },
            parentSpanId: { type: 'keyword' },
            serviceName: { type: 'keyword' },
            name: { type: 'keyword' },
            startTime: { type: 'date' },
            endTime: { type: 'date' },
            durationInNanos: { type: 'long' },
            'status.code': { type: 'integer' },
          },
        },
      },
      failOnStatusCode: false,
    });
    cy.request({
      method: 'POST',
      url: `${PATHS.SECONDARY_ENGINE}/${TRACE_AUTO_DETECT_INDEX}/_doc?refresh=wait_for`,
      headers: { 'content-type': 'application/json' },
      body: {
        spanId: 'span-1',
        traceId: 'trace-1',
        parentSpanId: '',
        serviceName: 'auto-detect-service',
        name: 'GET /auto-detect',
        startTime: '2025-09-01T00:00:00.000Z',
        endTime: '2025-09-01T00:00:00.045Z',
        durationInNanos: 45000000,
        'status.code': 0,
      },
      failOnStatusCode: false,
    });

    // Workspace with the data source but intentionally NO trace dataset, so the auto-detect
    // callout appears and we exercise the app's auto-create path (not the API dataset helper,
    // which bypasses it and writes a legacy reference type).
    createWorkspaceWithDatasource(DATASOURCE_NAME, workspaceName, ['use-case-observability']);
  });

  after(() => {
    cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    cy.request({
      method: 'DELETE',
      url: `${PATHS.SECONDARY_ENGINE}/${TRACE_AUTO_DETECT_INDEX}`,
      failOnStatusCode: false,
    });
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
            obj.attributes?.title?.includes('apm-span')
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
