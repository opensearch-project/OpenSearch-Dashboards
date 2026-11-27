/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Helpers for the PPL streaming specs. They run against a real SQL plugin that serves the async PPL
 * API (`POST /_plugins/_ppl` with `wait_for_completion_timeout`, `GET|DELETE
 * /_plugins/_async_query/{id}`), reached through the Dashboards stream routes.
 */

export const STREAMING_SETTING = 'explore:enableStreamingResults';
export const SAMPLE_SIZE_SETTING = 'discover:sampleSize';

// Regular expressions, not globs: the requests carry a `?dataSourceId=` query a glob would not match.
const STREAM_SUBMIT = /\/api\/enhancements\/ppl\/stream(\?|$)/;
const STREAM_JOB = /\/api\/enhancements\/ppl\/stream\/job\/[^/?]+/;

const openSearchUrl = () => Cypress.env('openSearchUrl');

// The backend reads a page of hits at a time, sized by the index's `max_result_window`, and adds
// each page to the rows a poll returns. One row per page, fanned out over several shards, makes ten
// thousand documents take a few seconds to read, so rows reach the page over several polls instead
// of all within the submit wait.
const ROWS_PER_PAGE = 1;
const SHARDS = 5;
const BULK_CHUNK = 5000;

const SERVICES = ['cart', 'checkout', 'payment', 'search', 'shipping'];
const LEVELS = ['INFO', 'WARN', 'ERROR'];

/** Creates `index` with `docCount` documents; document `i` has the timestamp `timestampOf(i)`. */
export const seedStreamingIndex = (index, docCount, timestampOf) => {
  cy.request({ method: 'DELETE', url: `${openSearchUrl()}/${index}`, failOnStatusCode: false });
  cy.request({
    method: 'PUT',
    url: `${openSearchUrl()}/${index}`,
    body: {
      settings: {
        number_of_shards: SHARDS,
        number_of_replicas: 0,
        'index.max_result_window': ROWS_PER_PAGE,
      },
      mappings: {
        properties: {
          timestamp: { type: 'date' },
          event_id: { type: 'long' },
          service: { type: 'keyword' },
          level: { type: 'keyword' },
          message: { type: 'text' },
        },
      },
    },
  });

  for (let from = 0; from < docCount; from += BULK_CHUNK) {
    const lines = [];
    for (let i = from; i < Math.min(from + BULK_CHUNK, docCount); i++) {
      lines.push(JSON.stringify({ index: { _index: index } }));
      lines.push(
        JSON.stringify({
          timestamp: timestampOf(i),
          event_id: i,
          service: SERVICES[i % SERVICES.length],
          level: LEVELS[i % LEVELS.length],
          message: `event ${i}`,
        })
      );
    }
    cy.request({
      method: 'POST',
      url: `${openSearchUrl()}/_bulk?refresh=true`,
      headers: { 'content-type': 'application/x-ndjson' },
      body: `${lines.join('\n')}\n`,
    })
      .its('body.errors')
      .should('equal', false);
  }
};

export const getAsyncQueryStatus = (jobId) =>
  cy
    .request({
      method: 'GET',
      url: `${openSearchUrl()}/_plugins/_async_query/${encodeURIComponent(jobId)}`,
      failOnStatusCode: false,
    })
    .its('status');

const isAggregation = (query = '') => /\|\s*stats\s/.test(query);

/**
 * Aliases the stream requests without changing them: `@streamSubmit` (the table query; the
 * histogram's aggregation submits as `@histogramSubmit`), `@anyStreamSubmit` (both, registered
 * even when none is sent), `@streamPoll` and `@streamRelease`.
 */
export const interceptStreamRequests = () => {
  cy.intercept('POST', STREAM_SUBMIT).as('anyStreamSubmit');
  cy.intercept('POST', STREAM_SUBMIT, (req) => {
    req.alias = isAggregation(req.body?.query) ? 'histogramSubmit' : 'streamSubmit';
  });
  cy.intercept('GET', STREAM_JOB).as('streamPoll');
  cy.intercept('DELETE', STREAM_JOB).as('streamRelease');
};

/** The id of the job a submit started; undefined when it finished within the submit wait. */
export const jobIdOf = (interception) => interception.response?.body?.id;

export const jobIdInUrl = (url) => decodeURIComponent(url.split('/job/')[1].split('?')[0]);

const countIn = ($el) => Number($el.text().replace(/[^\d]/g, ''));

/**
 * Retries until the rows shown, read from the "<rows> / <hits> hits" counter, satisfy `check`,
 * then yields that count.
 */
export const shownRowsShould = (check, options = {}) =>
  cy
    .getElementByTestId('discoverQueryRowsCount', { timeout: 30000, ...options })
    .should(($el) => check(countIn($el)))
    .then(countIn);

export const hitsShould = (check) =>
  cy
    .getElementByTestId('discoverQueryHits', { timeout: 30000 })
    .should(($el) => check(countIn($el)));

export const streamingAnnotation = () => cy.getElementByTestId('discoverQueryStreamingAnnotation');
