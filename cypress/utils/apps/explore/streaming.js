/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Helpers for the PPL streaming specs.
 *
 * Streaming needs a SQL plugin that serves the async PPL job API, and the specs must control when
 * rows arrive, so these helpers stand in for the engine at the Dashboards stream routes:
 * `POST /api/enhancements/ppl/stream` (submit) and `GET|DELETE /api/enhancements/ppl/stream/job/{id}`
 * (poll, release). Everything else, including the histogram and tab queries, runs for real.
 */

// Regular expressions, not globs: the requests carry a `?dataSourceId=` query a glob would not match.
const STREAM_SUBMIT = /\/api\/enhancements\/ppl\/stream(\?|$)/;
const STREAM_JOB = /\/api\/enhancements\/ppl\/stream\/job\/[^/?]+/;

export const STREAMING_SETTING = 'explore:enableStreamingResults';

export const STREAM_SCHEMA = [
  { name: 'timestamp', type: 'timestamp' },
  { name: 'unique_category', type: 'string' },
];

export const streamRows = (count) =>
  Array.from({ length: count }, (_, i) => [
    `2023-06-01 00:00:${String(59 - i).padStart(2, '0')}`,
    `streamed_${i}`,
  ]);

/** Turns on both streaming gates for this browser: the capability and the user setting. */
export const enableStreaming = () => {
  cy.intercept('POST', '**/api/core/capabilities', (req) => {
    req.continue((res) => {
      res.body = {
        ...res.body,
        queryEnhancements: { ...(res.body.queryEnhancements || {}), pplStreaming: true },
      };
    });
  });
  cy.setAdvancedSetting({ [STREAMING_SETTING]: true });
};

export const resetStreamingSetting = () => {
  cy.setAdvancedSetting({ [STREAMING_SETTING]: false });
};

/**
 * A fake streaming job engine. The test drives it through the returned `engine`:
 * `commit(n)` makes the first `n` rows visible, `finish()` completes the job, `failPolls(status)`
 * fails every later poll with `status`. Only queries matching `matches` stream; any other submit is
 * refused, so it falls back to the standard query path as it would on a cluster without the API.
 *
 * Job ids are unique per engine, and `engine.released` lists the ids this engine was asked to
 * release. Assert on those rather than on `@streamRelease`: a page left by the previous test
 * releases its own jobs on unload, and that request reaches this test's intercepts too.
 *
 * Aliases: `@streamSubmit` (streamed submits only), `@streamRefused`, `@streamPoll`, `@streamRelease`.
 */
export const stubStreamingEngine = ({ rows, matches }) => {
  const prefix = `job-${Date.now().toString(36)}`;
  const engine = {
    jobs: 0,
    released: [],
    jobId: (n) => `${prefix}-${n}`,
    committed: 0,
    status: 'RUNNING',
    sequence: 0,
    pollStatus: undefined,
    commit(n) {
      engine.committed = Math.min(n, rows.length);
      engine.sequence += 1;
    },
    finish() {
      engine.committed = rows.length;
      engine.status = 'SUCCEEDED';
      engine.sequence += 1;
    },
    failPolls(statusCode) {
      engine.pollStatus = statusCode;
    },
  };

  const snapshot = (id, offset) => {
    const datarows = rows.slice(offset, engine.committed);
    return {
      id,
      status: engine.status,
      sequence: engine.sequence,
      update_mode: 'APPEND',
      window: { offset, count: datarows.length },
      progress: { fraction_done: -1 },
      schema: STREAM_SCHEMA,
      datarows,
      size: datarows.length,
      total: engine.committed,
    };
  };

  cy.intercept('POST', STREAM_SUBMIT, (req) => {
    if (!matches(req.body.query)) {
      req.alias = 'streamRefused';
      req.reply({ statusCode: 403, body: 'Feature is not enabled' });
      return;
    }
    req.alias = 'streamSubmit';
    engine.jobs += 1;
    req.reply({ statusCode: 200, body: snapshot(engine.jobId(engine.jobs), 0) });
  });

  cy.intercept('GET', STREAM_JOB, (req) => {
    if (engine.pollStatus) {
      req.reply({ statusCode: engine.pollStatus, body: { message: 'stubbed failure' } });
      return;
    }
    const id = decodeURIComponent(req.url.split('/job/')[1].split('?')[0]);
    req.reply({ statusCode: 200, body: snapshot(id, Number(req.query.offset || 0)) });
  }).as('streamPoll');

  cy.intercept('DELETE', STREAM_JOB, (req) => {
    const id = decodeURIComponent(req.url.split('/job/')[1].split('?')[0]);
    if (id.startsWith(prefix)) engine.released.push(id);
    req.reply({ statusCode: 200, body: { status: 'CANCELLED' } });
  }).as('streamRelease');

  return engine;
};

// One cell per row; the toggle button inside it carries the same test subject.
export const renderedRowCount = () => cy.get('td[data-test-subj="docTableExpandToggleColumn"]');

export const hitsCounter = (options) => cy.getElementByTestId('dscResultCount', options);
