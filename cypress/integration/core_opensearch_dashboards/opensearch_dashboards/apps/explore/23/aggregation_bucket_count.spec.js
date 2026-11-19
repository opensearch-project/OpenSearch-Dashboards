/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/constants';
import { PATHS } from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspace = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();
const indexPattern = `${INDEX_WITH_TIME_1}*`;

const STATISTICS_TAB = 'exploreTab-explore_statistics';
const VISUALIZATION_TAB = 'exploreTab-explore_visualization_tab';

// Every command the hit counter treats as bucket-countable (isBucketCountable in
// PPL_COMMAND_TRAITS). The counter's bucket denominator comes from a separate
// `<query> | stats count() as bucket_count` probe, so it is only correct if the engine counts the
// command's final (post-reshape) rows. Each case asserts the probe equals the rows the tab renders.
const BUCKET_COUNTABLE_CASES = [
  { command: 'stats', query: '| stats count() by category', tab: STATISTICS_TAB },
  { command: 'top', query: '| top 3 status_code', tab: STATISTICS_TAB },
  { command: 'rare', query: '| rare category', tab: STATISTICS_TAB },
  {
    command: 'chart',
    query: '| chart count() over category by status_code',
    tab: VISUALIZATION_TAB,
  },
  {
    command: 'timechart',
    query: '| timechart timefield=timestamp span=30d count()',
    tab: VISUALIZATION_TAB,
  },
  {
    command: 'transpose',
    query: '| stats count() by category | transpose',
    tab: STATISTICS_TAB,
    requiresCommand: 'transpose',
  },
  {
    command: 'xyseries',
    query:
      '| stats count() as c by category, status_code | xyseries category status_code in ("200", "500") c',
    tab: STATISTICS_TAB,
    requiresCommand: 'xyseries',
  },
  {
    command: 'patterns mode=aggregation',
    query: '| patterns service_endpoint mode=aggregation',
    tab: STATISTICS_TAB,
  },
];

// Basic auth for direct engine requests when the security plugin is on.
const engineAuth = () =>
  Cypress.env('SECURITY_ENABLED')
    ? { auth: { username: Cypress.env('username'), password: Cypress.env('password') } }
    : {};

// Sets the cluster default `patterns` mode (plugins.ppl.pattern.mode) on the data source's cluster;
// null restores the engine default. Transient, so a failed run doesn't persist it.
const setClusterPatternsMode = (mode) =>
  cy.request({
    method: 'PUT',
    url: `${PATHS.SECONDARY_ENGINE}/_cluster/settings`,
    body: { transient: { 'plugins.ppl.pattern.mode': mode } },
    ...engineAuth(),
  });

// transpose, xyseries and timewrap are newer PPL commands that older SQL plugin versions reject as
// unknown syntax. Skips the calling test only when the data source's engine reports that exact
// command as not a valid term; any other error still runs the test, so real failures surface.
// Call from a `function () {}` test so `this` is the Mocha context.
const skipUnlessEngineSupports = (context, command, query) =>
  cy
    .request({
      method: 'POST',
      url: `${PATHS.SECONDARY_ENGINE}/_plugins/_ppl`,
      body: { query: `source = ${indexPattern} ${query}` },
      failOnStatusCode: false,
      ...engineAuth(),
    })
    .then((response) => {
      if (
        response.status === 400 &&
        JSON.stringify(response.body).includes(`[${command}] is not a valid term`)
      ) {
        cy.log(`Skipping: this engine does not support the ${command} command`);
        context.skip();
      }
    });

const readCount = (testId) =>
  cy
    .getElementByTestId(testId)
    .invoke('text')
    .then((text) => Number(text.replace(/[^\d]/g, '')));

const aggregationBucketCountTestSuite = () => {
  describe('Aggregation bucket count', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspace,
        datasetId,
        indexPattern,
        'timestamp',
        'logs',
        ['use-case-observability']
      );
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspace,
        page: 'explore/logs',
        isEnhancement: true,
      });

      cy.explore.setDataset(indexPattern, DATASOURCE_NAME, 'INDEX_PATTERN');
      cy.explore.setTopNavDate(START_TIME, END_TIME);
      cy.osd.waitForLoader(true);
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace, [INDEX_WITH_TIME_1]);
    });

    BUCKET_COUNTABLE_CASES.forEach(({ command, query, tab, requiresCommand }) => {
      it(`bucket count equals the rendered row count for ${command}`, function () {
        if (requiresCommand) {
          skipUnlessEngineSupports(this, requiresCommand, query);
        }
        cy.explore.setQueryEditor(`source = ${indexPattern} ${query}`);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId(tab).should('have.attr', 'aria-selected', 'true');

        cy.getElementByTestId('discoverQueryBucketCount').should('be.visible');
        readCount('discoverQueryRowsCount').then((rows) => {
          expect(rows, 'rendered rows').to.be.greaterThan(0);
          readCount('discoverQueryBucketCount').should('equal', rows);
        });
      });
    });

    it('falls back to the plain hits format for timewrap', function () {
      // timewrap's pivot runs in the execution engine after the query plan, so a count probe would
      // count the pre-pivot timechart buckets and overcount. The counter must not show buckets.
      const timewrapQuery = '| timechart timefield=timestamp span=30d count() | timewrap 1y';
      skipUnlessEngineSupports(this, 'timewrap', timewrapQuery);
      cy.explore.setQueryEditor(`source = ${indexPattern} ${timewrapQuery}`);
      cy.osd.waitForLoader(true);

      cy.getElementByTestId(VISUALIZATION_TAB).should('have.attr', 'aria-selected', 'true');
      cy.getElementByTestId('discoverQueryHits').should('be.visible');
      cy.getElementByTestId('discoverQueryBucketCount').should('not.exist');
    });

    // A `patterns` without `mode=` runs in the cluster's default mode, which OSD reads from the
    // cluster setting only for such queries.
    describe('patterns without mode=', () => {
      // Each case uses a different field: tab detection only reruns when the query text changes, and
      // the reload restores the previous case's query.
      const barePatternsQuery = (field) => `source = ${indexPattern} | patterns ${field}`;

      after(() => {
        setClusterPatternsMode(null);
      });

      it('stays on Logs as document rows when the cluster default is label', () => {
        setClusterPatternsMode(null);
        cy.reload();
        cy.osd.waitForLoader(true);
        cy.explore.setQueryEditor(barePatternsQuery('service_endpoint'));
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-logs').should('have.attr', 'aria-selected', 'true');
        cy.getElementByTestId('discoverQueryHits').should('be.visible');
        cy.getElementByTestId('discoverQueryBucketCount').should('not.exist');
      });

      it('is routed and bucket-counted as an aggregation when the cluster default is aggregation', () => {
        setClusterPatternsMode('AGGREGATION');
        // The default mode is cached per page load, so reload to read the new setting.
        cy.reload();
        cy.osd.waitForLoader(true);
        cy.explore.setQueryEditor(barePatternsQuery('request_url'));
        cy.osd.waitForLoader(true);

        cy.getElementByTestId(STATISTICS_TAB).should('have.attr', 'aria-selected', 'true');
        cy.getElementByTestId('discoverQueryBucketCount').should('be.visible');
        readCount('discoverQueryRowsCount').then((rows) => {
          expect(rows, 'rendered rows').to.be.greaterThan(0);
          readCount('discoverQueryBucketCount').should('equal', rows);
        });
      });
    });
  });
};

prepareTestSuite('Aggregation Bucket Count', aggregationBucketCountTestSuite);
