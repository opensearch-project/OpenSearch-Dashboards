/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  END_TIME,
  START_TIME,
} from '../../../../../../utils/apps/explore/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';
import {
  SAMPLE_SIZE_SETTING,
  STREAMING_SETTING,
  getAsyncQueryStatus,
  hitsShould,
  interceptStreamRequests,
  jobIdInUrl,
  jobIdOf,
  seedStreamingIndex,
  shownRowsShould,
  streamingAnnotation,
} from '../../../../../../utils/apps/explore/streaming';

// These specs need a SQL plugin that publishes the rows found so far on each poll of an async PPL
// query, and Dashboards started with `queryEnhancements.ppl.streaming.enabled: true`.

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const INDEX = 'ppl_streaming_e2e';
const INDEX_PATTERN = `${INDEX}*`;
// The backend returns at most `plugins.query.size_limit` rows, 10,000 by default.
const DOC_COUNT = 10000;
// Half the documents are in 2021 and half in 2023, so a time range can select exactly half of them
// whatever the browser's time zone.
const timestampOf = (i) =>
  new Date(Date.UTC(i < DOC_COUNT / 2 ? 2021 : 2023, 5, 1) + i * 1000).toISOString();
const NO_DATA = ['Jan 1, 2019 @ 00:00:00.000', 'Jan 2, 2019 @ 00:00:00.000'];
const YEAR_2021 = ['Jan 1, 2021 @ 00:00:00.000', 'Jan 1, 2022 @ 00:00:00.000'];

const QUERY = `source = ${INDEX_PATTERN} | fields timestamp, service, level, message`;

const isMidRun = (n) => {
  expect(n, 'rows shown while running').to.be.greaterThan(0);
  expect(n, 'rows shown while running').to.be.lessThan(DOC_COUNT);
};

// Asserts on every release rather than the next one: the histogram's job, when it has one, is
// released too.
const expectReleased = (jobId) =>
  cy
    .get('@streamRelease.all', { timeout: 30000 })
    .should((releases) => expect(releases.map((r) => jobIdInUrl(r.request.url))).to.include(jobId));

// Runs `query` over all the data. The query is typed first and the time range applied after, so the
// run starts from the time picker.
const runQuery = (query) => {
  cy.explore.setQueryEditor(query, { submit: false });
  cy.explore.setTopNavDate(START_TIME, END_TIME);
};

const waitForIdle = () =>
  cy.getElementByTestId('exploreQueryExecutionButton', { timeout: 60000 }).should('be.visible');

const pplStreamingTests = () => {
  describe('PPL streaming results', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);
      seedStreamingIndex(INDEX, DOC_COUNT, timestampOf);
      cy.setAdvancedSetting({ [STREAMING_SETTING]: true, [SAMPLE_SIZE_SETTING]: DOC_COUNT });

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    after(() => {
      cy.setAdvancedSetting({ [STREAMING_SETTING]: null, [SAMPLE_SIZE_SETTING]: null });
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
      cy.osd.deleteIndex(INDEX);
    });

    // Opening the page runs the dataset's default query. Narrowing the time range to one with no
    // data ends it quickly (and stops it if it already streams), and the stream requests are only
    // aliased after that, so the aliases see the test's own query alone.
    const openExplore = () => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
      cy.explore.setDataset(INDEX_PATTERN, DATASOURCE_NAME, 'INDEX_PATTERN');
      cy.explore.setTopNavDate(NO_DATA[0], NO_DATA[1]);
      waitForIdle();
      cy.getElementByTestId('exploreQueryStopButton').should('not.exist');
      interceptStreamRequests();
    };

    describe('with streaming on', () => {
      beforeEach(openExplore);

      it('shows the rows found so far while the query runs, then all of them', () => {
        runQuery(QUERY);
        cy.wait('@streamSubmit').then((submit) => {
          const jobId = jobIdOf(submit);
          expect(jobId, 'job id: the query outlasted the submit wait').to.be.a('string');

          cy.getElementByTestId('exploreQueryStopButton').should('be.visible');
          shownRowsShould(isMidRun);
          cy.getElementByTestId('exploreQueryPanelStreamingProgress').should('exist');

          shownRowsShould((n) => expect(n).to.equal(DOC_COUNT), { timeout: 60000 });
          hitsShould((n) => expect(n).to.equal(DOC_COUNT));
          waitForIdle();
          cy.getElementByTestId('exploreQueryPanelStreamingProgress').should('not.exist');

          // A finished job is released, so the cluster does not hold it until its lease lapses.
          expectReleased(jobId);
          getAsyncQueryStatus(jobId).should('equal', 404);
        });
      });

      it('keeps the rows shown and releases the job when stopped', () => {
        runQuery(QUERY);
        cy.wait('@streamSubmit').then((submit) => {
          const jobId = jobIdOf(submit);
          shownRowsShould(isMidRun);

          cy.getElementByTestId('exploreQueryStopButton').click();
          streamingAnnotation().should('contain.text', 'Stopped');
          waitForIdle();

          expectReleased(jobId);
          getAsyncQueryStatus(jobId).should('equal', 404);

          // Nothing more arrives after a stop.
          shownRowsShould(isMidRun).then((stoppedAt) => {
            cy.wait(3000);
            shownRowsShould((n) => expect(n).to.equal(stoppedAt));
          });
        });
      });

      it('releases the running job and starts again when the time range changes', () => {
        runQuery(QUERY);
        cy.wait('@streamSubmit').then((first) => {
          const firstJobId = jobIdOf(first);
          shownRowsShould(isMidRun);

          cy.explore.setTopNavDate(YEAR_2021[0], YEAR_2021[1]);

          expectReleased(firstJobId);
          cy.wait('@streamSubmit').then(jobIdOf).should('not.equal', firstJobId);

          // Only the new range's rows: none of the first run's rows are kept.
          shownRowsShould((n) => expect(n).to.equal(DOC_COUNT / 2), { timeout: 60000 });
          hitsShould((n) => expect(n).to.equal(DOC_COUNT / 2));
          waitForIdle();
        });
      });

      it('shows the error when the query fails', () => {
        runQuery(`source = ${INDEX_PATTERN} | fields nosuchfield`);
        cy.wait('@anyStreamSubmit');
        cy.contains('nosuchfield', { timeout: 30000 }).should('be.visible');
        cy.contains('not found').should('be.visible');
        waitForIdle();
      });
    });

    describe('with streaming off', () => {
      before(() => {
        cy.setAdvancedSetting({ [STREAMING_SETTING]: false });
      });

      after(() => {
        cy.setAdvancedSetting({ [STREAMING_SETTING]: true });
      });

      beforeEach(openExplore);

      it('runs the query on the standard path with the same result', () => {
        runQuery(QUERY);
        shownRowsShould((n) => expect(n).to.equal(DOC_COUNT), { timeout: 60000 });
        hitsShould((n) => expect(n).to.equal(DOC_COUNT));
        cy.get('@anyStreamSubmit.all').should('have.length', 0);
      });
    });
  });
};

prepareTestSuite('PPL Streaming', pplStreamingTests);
