/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME, INDEX_PATTERN_WITH_TIME } from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';
import {
  enableStreaming,
  hitsCounter,
  renderedRowCount,
  resetStreamingSetting,
  streamRows,
  stubStreamingEngine,
} from '../../../../../../utils/apps/explore/streaming';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const STREAMED_QUERY = `source = ${INDEX_PATTERN_WITH_TIME} | fields timestamp, unique_category`;
const isStreamedQuery = (query = '') =>
  query.includes('fields timestamp, unique_category') && !query.includes('stats');

const pplStreamingTests = () => {
  describe('PPL streaming results', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME, // Uses 'data_logs_small_time_*'
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    after(() => {
      resetStreamingSetting();
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    const openExplore = () => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
      cy.explore.setDataset(INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME, 'INDEX_PATTERN');
      setDatePickerDatesAndSearchIfRelevant('PPL');
    };

    describe('with streaming on', () => {
      let engine;

      beforeEach(() => {
        enableStreaming();
        engine = stubStreamingEngine({ rows: streamRows(8), matches: isStreamedQuery });
        openExplore();
      });

      it('shows rows while the query runs, then the final result', () => {
        cy.explore.setQueryEditor(STREAMED_QUERY);
        cy.wait('@streamSubmit');

        cy.then(() => engine.commit(3));
        renderedRowCount().should('have.length', 3);
        cy.getElementByTestId('exploreQueryStopButton').should('be.visible');
        cy.getElementByTestId('exploreQueryPanelStreamingProgress').should('exist');

        cy.then(() => engine.commit(6));
        renderedRowCount().should('have.length', 6);

        cy.then(() => engine.finish());
        renderedRowCount().should('have.length', 8);
        cy.getElementByTestId('exploreQueryExecutionButton').should('be.visible');
        cy.getElementByTestId('exploreQueryPanelStreamingProgress').should('not.exist');
        // A finished job is released, so the cluster does not hold it until its lease lapses.
        cy.wrap(engine).its('released').should('include', engine.jobId(1));
      });

      it('keeps the rows and releases the job when stopped', () => {
        cy.explore.setQueryEditor(STREAMED_QUERY);
        cy.wait('@streamSubmit');
        cy.then(() => engine.commit(4));
        renderedRowCount().should('have.length', 4);

        cy.getElementByTestId('exploreQueryStopButton').click();

        cy.wrap(engine).its('released').should('include', engine.jobId(1));
        hitsCounter().should('contain.text', 'Stopped');
        renderedRowCount().should('have.length', 4);
      });

      it('keeps the rows and ends incomplete when polling keeps failing', () => {
        cy.explore.setQueryEditor(STREAMED_QUERY);
        cy.wait('@streamSubmit');
        cy.then(() => engine.commit(5));
        renderedRowCount().should('have.length', 5);

        // Polls are retried after 1s, 2s and 4s before the run gives up.
        cy.then(() => engine.failPolls(503));
        hitsCounter({ timeout: 30000 }).should('contain.text', 'Incomplete');
        renderedRowCount().should('have.length', 5);
      });

      it('ends incomplete when the job expires', () => {
        cy.explore.setQueryEditor(STREAMED_QUERY);
        cy.wait('@streamSubmit');
        cy.then(() => engine.commit(2));
        renderedRowCount().should('have.length', 2);

        cy.then(() => engine.failPolls(404));
        hitsCounter().should('contain.text', 'Incomplete');
        renderedRowCount().should('have.length', 2);
      });

      it('disables CSV export until the stream finishes', () => {
        cy.explore.setQueryEditor(STREAMED_QUERY);
        cy.wait('@streamSubmit');
        cy.then(() => engine.commit(3));
        renderedRowCount().should('have.length', 3);
        cy.getElementByTestId('dscDownloadCsvButton').should('be.disabled');

        cy.then(() => engine.finish());
        renderedRowCount().should('have.length', 8);
        cy.getElementByTestId('dscDownloadCsvButton').should('be.enabled');
      });

      it('releases the previous job when a new query runs', () => {
        cy.explore.setQueryEditor(STREAMED_QUERY);
        cy.wait('@streamSubmit');
        cy.then(() => engine.commit(2));
        renderedRowCount().should('have.length', 2);

        // The Run button is Stop while a query runs, so submit from the editor with Enter.
        cy.explore.setQueryEditor(`${STREAMED_QUERY} | head 5`, { submit: false });
        cy.get('.inputarea').first().type('{enter}', { force: true });

        cy.wrap(engine).its('released').should('include', engine.jobId(1));
        cy.wrap(engine).its('jobs').should('equal', 2);
      });
    });

    describe('with streaming off', () => {
      beforeEach(() => {
        resetStreamingSetting();
        cy.intercept('POST', '**/api/enhancements/ppl/stream').as('streamSubmit');
        openExplore();
      });

      it('runs the query on the standard path', () => {
        cy.explore.setQueryEditor(STREAMED_QUERY);
        renderedRowCount().should('have.length.greaterThan', 0);
        cy.get('@streamSubmit.all').should('have.length', 0);
      });
    });
  });
};

prepareTestSuite('PPL Streaming', pplStreamingTests);
