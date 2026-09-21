/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  abortAllStreamingQueries,
  abortStreamingQuery,
  isCurrentStreamingRun,
  isStreamingQueryAbortable,
  registerStreamingAbort,
  unregisterStreamingAbort,
} from './streaming_abort_registry';

describe('streamingAbortRegistry', () => {
  afterEach(() => abortAllStreamingQueries());

  it('aborts the registered query and reports that it did', () => {
    const abort = jest.fn();
    registerStreamingAbort('ck', abort);

    expect(abortStreamingQuery('ck')).toBe(true);
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('reports false when there is nothing to abort', () => {
    expect(abortStreamingQuery('missing')).toBe(false);
  });

  it('aborts the previous run when a new one takes the same key', () => {
    // Regression: re-running a query left the previous job polling and unreachable, so two jobs
    // published to one cacheKey (counts jumped backwards) and Stop cancelled only the newer one.
    const first = jest.fn();
    const second = jest.fn();

    registerStreamingAbort('ck', first);
    registerStreamingAbort('ck', second);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('aborts the newest run when asked, not a superseded one', () => {
    const first = jest.fn();
    const second = jest.fn();
    registerStreamingAbort('ck', first, 'token-1');
    registerStreamingAbort('ck', second, 'token-2');

    abortStreamingQuery('ck');

    expect(second).toHaveBeenCalledTimes(1);
  });

  it('ignores an unregister from a superseded run', () => {
    const second = jest.fn();
    registerStreamingAbort('ck', jest.fn(), 'token-1');
    registerStreamingAbort('ck', second, 'token-2');

    unregisterStreamingAbort('ck', 'token-1');

    // The newer run must remain abortable.
    expect(isStreamingQueryAbortable('ck')).toBe(true);
    expect(abortStreamingQuery('ck')).toBe(true);
    expect(second).toHaveBeenCalled();
  });

  it('honours an unregister from the current run', () => {
    registerStreamingAbort('ck', jest.fn(), 'token-1');
    unregisterStreamingAbort('ck', 'token-1');

    expect(isStreamingQueryAbortable('ck')).toBe(false);
  });

  it('treats only the newest run as current', () => {
    registerStreamingAbort('ck', jest.fn(), 'token-1');
    expect(isCurrentStreamingRun('ck', 'token-1')).toBe(true);

    registerStreamingAbort('ck', jest.fn(), 'token-2');
    expect(isCurrentStreamingRun('ck', 'token-1')).toBe(false);
    expect(isCurrentStreamingRun('ck', 'token-2')).toBe(true);
  });

  it('treats a run with no entry as current, so terminal updates are not suppressed', () => {
    expect(isCurrentStreamingRun('gone', 'token-1')).toBe(true);
  });

  it('aborts every in-flight query', () => {
    const a = jest.fn();
    const b = jest.fn();
    registerStreamingAbort('a', a);
    registerStreamingAbort('b', b);

    abortAllStreamingQueries();

    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
    expect(isStreamingQueryAbortable('a')).toBe(false);
  });
});
