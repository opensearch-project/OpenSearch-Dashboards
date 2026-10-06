/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

// The query editor hides the `source = <dataset>` clause, so a query typed as `| where ...` relies
// on the client adding it back. Run always did; Inspect Query used to send the raw editor text,
// which the backend rejected with "[<EOF>] is not a valid term". These tests assert on the request
// the panel actually sends, so the regression fails here rather than only showing up in the UI.
//
// The analyze response is stubbed with a recorded one: the `analyze` PPL option only exists in
// newer SQL plugin releases than the OpenSearch bundle this CI group runs against, and the bug
// lives entirely in the request the frontend builds.
const ANALYZE_RESPONSE_FIXTURE = 'explore/ppl_analyze/analyze_response.json';

const getAnalyzedQuery = (interception) => {
  const { body } = interception.request;
  return (typeof body === 'string' ? JSON.parse(body) : body).query;
};

const expectAnalyzedQueryToHaveSource = (interception, whereClause) => {
  const query = getAnalyzedQuery(interception);
  expect(query, 'analyzed query').to.match(/^source = `[^`]+`/);
  expect(query, 'analyzed query').to.include(INDEX_PATTERN_WITH_TIME);
  expect(query, 'analyzed query').to.include(whereClause);
  // The time filter is only injected into queries that start with `source=`, so its presence
  // also proves the selected time range reaches the analyzed query.
  expect(query, 'analyzed query').to.include('WHERE `timestamp` >=');
};

const expectPanelToShowPlan = () => {
  cy.getElementByTestId('analyzeErrorCallout').should('not.exist');
  cy.contains('Query completed in', { timeout: 60000 }).should('be.visible');
};

const inspectQueryTestSuite = () => {
  describe('Inspect Query (PPL analyze)', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    beforeEach(() => {
      cy.intercept('POST', '**/api/enhancements/ppl/analyze', {
        fixture: ANALYZE_RESPONSE_FIXTURE,
      }).as('pplAnalyze');

      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
      cy.explore.setDataset(INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME, 'INDEX_PATTERN');
      cy.explore.setTopNavDate(START_TIME, END_TIME);
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
    });

    it('analyzes a query without a source clause instead of failing to parse it', () => {
      cy.explore.setQueryEditor('| where status_code > 200', { escape: true });

      cy.getElementByTestId('exploreAnalyzeButton').should('be.visible').click();

      cy.wait('@pplAnalyze').then((interception) =>
        expectAnalyzedQueryToHaveSource(interception, '| where status_code > 200')
      );
      expectPanelToShowPlan();
    });

    it('re-analyzes with the source clause when a query is run while the panel is open', () => {
      cy.explore.setQueryEditor('| where status_code > 200', { escape: true });
      cy.getElementByTestId('exploreAnalyzeButton').should('be.visible').click();
      cy.wait('@pplAnalyze');
      expectPanelToShowPlan();

      // Running a new query refreshes the open panel through a different call site than the
      // button, so check that path adds the source too.
      cy.explore.setQueryEditor('| where status_code >= 500', { escape: true });

      cy.wait('@pplAnalyze').then((interception) =>
        expectAnalyzedQueryToHaveSource(interception, '| where status_code >= 500')
      );
      expectPanelToShowPlan();
    });
  });
};

prepareTestSuite('Inspect Query', inspectQueryTestSuite);
