/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLStreamJobNotFoundError } from '../../streaming/ppl_stream_errors';
import { setResults } from '../slices';
import { setIndividualQueryStatus } from '../slices/query_editor/query_editor_slice';
import {
  executeStreamingQuery,
  isStreamUnavailable,
  STREAMING_POLL_INTERVAL_MS,
} from './streaming_query_actions';

const mockSubmit = jest.fn();
const mockPoll = jest.fn();
const mockCancel = jest.fn().mockResolvedValue(undefined);

jest.mock('../../streaming/ppl_stream_service', () => ({
  PPLStreamService: jest.fn().mockImplementation(() => ({
    submit: (...args: unknown[]) => mockSubmit(...args),
    poll: (...args: unknown[]) => mockPoll(...args),
    cancel: (...args: unknown[]) => mockCancel(...args),
  })),
  PPLStreamJobNotFoundError: jest.requireActual('../../streaming/ppl_stream_errors')
    .PPLStreamJobNotFoundError,
}));

// The thunk resolves the PPL language formatter to render date values as the non-streaming path
// does, so the mock has to supply the language service.
const pplFormatter = jest.fn((value: any) => value);
const services = {
  http: {},
  data: {
    query: {
      queryString: {
        getLanguageService: () => ({
          getLanguage: () => ({ fields: { formatter: pplFormatter } }),
        }),
      },
    },
  },
} as any;

const snapshot = (overrides: Record<string, unknown> = {}) => ({
  status: 'RUNNING',
  schema: [
    { name: '@timestamp', type: 'timestamp' },
    { name: 'event_id', type: 'int' },
  ],
  datarows: [],
  size: 0,
  total: 0,
  ...overrides,
});

/** Runs the thunk, advancing fake timers so the poll loop progresses without real waiting. */
const run = async (args: Record<string, unknown> = {}) => {
  const dispatched: any[] = [];
  // Annotated because the mock references itself for thunk actions, which otherwise infers as any.
  const dispatch: jest.Mock = jest.fn((action: any) => {
    dispatched.push(action);
    return typeof action === 'function' ? action(dispatch, () => ({})) : action;
  });

  const thunk = executeStreamingQuery({
    services,
    cacheKey: 'ck',
    queryString: 'source=logs | fields @timestamp, event_id | head 10',
    ...args,
  } as any);

  const promise = thunk(dispatch, () => ({}) as any, undefined);
  // Let submit resolve, then release each poll interval in turn.
  for (let i = 0; i < 12; i++) {
    await Promise.resolve();
    jest.advanceTimersByTime(STREAMING_POLL_INTERVAL_MS);
    await Promise.resolve();
  }
  // createAsyncThunk resolves with the fulfilled or rejected action rather than rejecting, so the
  // action is what callers inspect.
  const action = await promise;

  const results = dispatched.filter((a) => a?.type === setResults.type).map((a) => a.payload);
  const statuses = dispatched
    .filter((a) => a?.type === setIndividualQueryStatus.type)
    .map((a) => a.payload);
  return { action, results, statuses };
};

describe('executeStreamingQuery', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSubmit.mockReset();
    mockPoll.mockReset();
    mockCancel.mockClear();
  });

  afterEach(() => jest.useRealTimers());

  it('renders once and never polls when the query completes on the fast path', async () => {
    mockSubmit.mockResolvedValue(
      snapshot({ status: 'SUCCEEDED', datarows: [['2026-09-15 10:00:00', 1]], size: 1, total: 1 })
    );

    const { results, statuses } = await run();

    expect(mockPoll).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].results.hits.hits).toHaveLength(1);
    expect(statuses[statuses.length - 1].status.status).toBe('ready');
  });

  it('accumulates APPEND rows across polls and advances the offset', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1', sequence: 0 }));
    mockPoll
      .mockResolvedValueOnce(
        snapshot({
          id: 'job-1',
          sequence: 1,
          update_mode: 'APPEND',
          datarows: [['2026-09-15 10:00:00', 1]],
          size: 1,
          total: 100,
        })
      )
      .mockResolvedValueOnce(
        snapshot({
          id: 'job-1',
          sequence: 2,
          status: 'SUCCEEDED',
          update_mode: 'APPEND',
          datarows: [['2026-09-15 10:01:00', 2]],
          size: 1,
          total: 200,
        })
      );

    const { results } = await run();

    expect(mockPoll).toHaveBeenNthCalledWith(1, expect.objectContaining({ offset: 0 }));
    expect(mockPoll).toHaveBeenNthCalledWith(2, expect.objectContaining({ offset: 1 }));
    // Rows from both snapshots are retained.
    expect(results[results.length - 1].results.hits.hits).toHaveLength(2);
  });

  it('reports the accumulator total, not the rows held', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1', sequence: 0 }));
    mockPoll.mockResolvedValue(
      snapshot({
        id: 'job-1',
        sequence: 1,
        status: 'SUCCEEDED',
        update_mode: 'APPEND',
        datarows: [['2026-09-15 10:00:00', 1]],
        size: 1,
        total: 480954,
      })
    );

    const { results, statuses } = await run();

    expect(results[results.length - 1].results.hits.total).toBe(480954);
    const streaming = statuses[statuses.length - 1].status.streaming;
    expect(streaming.total).toBe(480954);
    expect(streaming.rowsFetched).toBe(1);
  });

  it('always re-reads from offset 0 for REPLACE and discards prior rows', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1', sequence: 0 }));
    mockPoll
      .mockResolvedValueOnce(
        snapshot({
          id: 'job-1',
          sequence: 1,
          update_mode: 'REPLACE',
          datarows: [['2026-09-15 10:00:00', 1]],
          size: 1,
          total: 1,
        })
      )
      .mockResolvedValueOnce(
        snapshot({
          id: 'job-1',
          sequence: 2,
          status: 'SUCCEEDED',
          update_mode: 'REPLACE',
          datarows: [['2026-09-15 11:00:00', 9]],
          size: 1,
          total: 1,
        })
      );

    const { results } = await run();

    expect(mockPoll).toHaveBeenNthCalledWith(1, expect.objectContaining({ offset: 0 }));
    expect(mockPoll).toHaveBeenNthCalledWith(2, expect.objectContaining({ offset: 0 }));
    const finalHits = results[results.length - 1].results.hits.hits;
    expect(finalHits).toHaveLength(1);
    expect(finalHits[0]._source.event_id).toBe(9);
  });

  it('always absorbs REPLACE snapshots, since values can change while total and size do not', async () => {
    // A histogram keeps 25 buckets throughout while the counts inside them move, so REPLACE must
    // not be skipped on an unchanged total/size.
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1' }));
    mockPoll
      .mockResolvedValueOnce(
        snapshot({
          id: 'job-1',
          update_mode: 'REPLACE',
          datarows: [['2026-09-15 10:00:00', 1]],
          size: 1,
          total: 1,
        })
      )
      .mockResolvedValueOnce(
        snapshot({
          id: 'job-1',
          status: 'SUCCEEDED',
          update_mode: 'REPLACE',
          datarows: [['2026-09-15 10:00:00', 999]],
          size: 1,
          total: 1,
        })
      );

    const { results } = await run();
    const finalHits = results[results.length - 1].results.hits.hits;
    // The second snapshot's value must win despite identical total/size.
    expect(finalHits[0]._source.event_id).toBe(999);
  });

  it('does not double-count a repeated APPEND snapshot', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1', sequence: 0 }));
    const repeated = snapshot({
      id: 'job-1',
      sequence: 1,
      update_mode: 'APPEND',
      datarows: [['2026-09-15 10:00:00', 1]],
      size: 1,
      total: 1,
    });
    mockPoll
      .mockResolvedValueOnce(repeated)
      .mockResolvedValueOnce(repeated)
      .mockResolvedValueOnce(snapshot({ id: 'job-1', sequence: 2, status: 'SUCCEEDED', total: 1 }));

    const { results } = await run();

    // The repeated snapshot must not double-count its rows.
    expect(results[results.length - 1].results.hits.hits).toHaveLength(1);
  });

  it('clamps fractionDone so it cannot move backwards', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1', sequence: 0 }));
    mockPoll
      .mockResolvedValueOnce(
        snapshot({ id: 'job-1', sequence: 1, progress: { fraction_done: 0.42 } })
      )
      .mockResolvedValueOnce(
        snapshot({ id: 'job-1', sequence: 2, progress: { fraction_done: -1 } })
      )
      .mockResolvedValueOnce(
        snapshot({ id: 'job-1', sequence: 3, status: 'SUCCEEDED', progress: { fraction_done: 1 } })
      );

    const { statuses } = await run();
    const fractions = statuses
      .map((s) => s.status.streaming?.fractionDone)
      .filter((f) => f != null);

    expect(Math.min(...fractions.slice(1))).toBeGreaterThanOrEqual(0.42);
    expect(fractions[fractions.length - 1]).toBe(1);
  });

  it('publishes histogram buckets from its own aggregation job', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1' }));
    mockPoll.mockResolvedValue({
      status: 'SUCCEEDED',
      update_mode: 'REPLACE',
      schema: [
        { name: 'count()', type: 'bigint' },
        { name: 'span(`@timestamp`,1h)', type: 'timestamp' },
      ],
      datarows: [
        [58823, '2026-09-14 19:00:00'],
        [211765, '2026-09-14 20:00:00'],
      ],
      size: 2,
      total: 2,
    });

    const { results } = await run({ asHistogram: { aggId: '2' } });
    const aggs = results[results.length - 1].results.aggregations;

    // Authoritative engine counts, not a derivation from fetched rows.
    expect(aggs['2'].buckets.map((b: any) => b.doc_count)).toEqual([58823, 211765]);
    // hits.total must be non-zero or the chart renders nothing.
    expect(results[results.length - 1].results.hits.total).toBe(270588);
  });

  it('leaves aggregations alone when no histogram is configured', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1', sequence: 0 }));
    mockPoll.mockResolvedValue(snapshot({ id: 'job-1', sequence: 1, status: 'SUCCEEDED' }));

    const { results } = await run();
    expect(results[results.length - 1].results.aggregations).toBeUndefined();
  });

  it('stops without error when the job has expired', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1', sequence: 0 }));
    mockPoll.mockRejectedValue(new PPLStreamJobNotFoundError('job-1'));

    const { statuses } = await run();

    expect(statuses[statuses.length - 1].status.status).toBe('ready');
  });

  it('stays LOADING while polling and marks isPolling so partial rows are still rendered', async () => {
    // `isPolling`, not a premature READY, is what tells bottom_right_container to render partial
    // results instead of the loading spinner. READY must continue to mean "finished".
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1', sequence: 0 }));
    mockPoll
      .mockResolvedValueOnce(
        snapshot({
          id: 'job-1',
          sequence: 1,
          update_mode: 'APPEND',
          datarows: [['2026-09-15 10:00:00', 1]],
          size: 1,
          total: 500000,
        })
      )
      .mockResolvedValueOnce(
        snapshot({
          id: 'job-1',
          sequence: 2,
          status: 'SUCCEEDED',
          update_mode: 'APPEND',
          datarows: [['2026-09-15 10:01:00', 2]],
          size: 1,
          total: 500000,
        })
      );

    const { statuses } = await run();
    const inFlight = statuses.filter((s) => s.status.streaming?.isPolling === true);

    expect(inFlight.length).toBeGreaterThan(0);
    // Honest status: the query has not finished, so it is never reported as READY mid-flight.
    expect(inFlight.every((s) => s.status.status === 'loading')).toBe(true);
    // Rows are present despite LOADING, which is exactly the case the gate must let through.
    expect(inFlight.some((s) => (s.status.streaming?.rowsFetched ?? 0) > 0)).toBe(true);
    // Only the terminal snapshot is READY.
    expect(statuses[statuses.length - 1].status.status).toBe('ready');
    expect(statuses[statuses.length - 1].status.streaming?.isPolling).toBe(false);
  });

  it('reports LOADING before any rows arrive', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1', sequence: 0 }));
    mockPoll.mockResolvedValue(snapshot({ id: 'job-1', sequence: 1, status: 'SUCCEEDED' }));

    const { statuses } = await run();
    expect(statuses[0].status.status).toBe('loading');
  });

  it('marks polling false once terminal so the UI can stop the spinner', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1', sequence: 0 }));
    mockPoll.mockResolvedValue(snapshot({ id: 'job-1', sequence: 1, status: 'SUCCEEDED' }));

    const { statuses } = await run();
    const streamingStates = statuses.map((s) => s.status.streaming?.isPolling);

    expect(streamingStates[0]).toBe(true);
    expect(streamingStates[streamingStates.length - 1]).toBe(false);
  });

  it('marks polling false when the user aborts, so the timer and bar stop', async () => {
    // Regression: the abort path returned without dispatching, leaving isPolling true forever —
    // the elapsed timer kept ticking and the progress bar stayed frozen at its last value.
    mockSubmit.mockResolvedValue(
      snapshot({
        id: 'job-1',
        update_mode: 'APPEND',
        datarows: [['2026-09-15 10:00:00', 1]],
        size: 1,
        total: 900,
      })
    );
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    mockPoll.mockRejectedValue(abortError);

    const { statuses } = await run();
    const final = statuses[statuses.length - 1].status;

    expect(final.streaming?.isPolling).toBe(false);
    expect(final.status).toBe('ready');
    // The counts already shown are preserved rather than reset.
    expect(final.streaming?.total).toBe(900);
  });

  it('releases the job when the user aborts so the engine stops work', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1' }));
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    mockPoll.mockRejectedValue(abortError);

    await run();

    expect(mockCancel).toHaveBeenCalledWith('job-1', undefined);
  });

  it('preserves the final counts when the job has expired', async () => {
    mockSubmit.mockResolvedValue(
      snapshot({
        id: 'job-1',
        update_mode: 'APPEND',
        datarows: [['2026-09-15 10:00:00', 1]],
        size: 1,
        total: 42,
      })
    );
    mockPoll.mockRejectedValue(new PPLStreamJobNotFoundError('job-1'));

    const { statuses } = await run();
    const final = statuses[statuses.length - 1].status;

    expect(final.streaming?.isPolling).toBe(false);
    expect(final.streaming?.total).toBe(42);
  });

  it('reports ERROR when the engine fails the job, rather than READY', async () => {
    // `isPolling` is false once polling stops, so a terminal FAILED snapshot would otherwise be
    // published as a successful result.
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1' }));
    mockPoll.mockResolvedValue(snapshot({ id: 'job-1', status: 'FAILED' }));

    const { statuses } = await run();
    const final = statuses[statuses.length - 1].status;

    expect(final.status).toBe('error');
    expect(final.streaming?.isPolling).toBe(false);
    expect(final.error?.message.reason).toMatch(/failed/i);
  });

  it('treats a job cancelled elsewhere as stopped, keeping what was rendered', async () => {
    mockSubmit.mockResolvedValue(
      snapshot({
        id: 'job-1',
        update_mode: 'APPEND',
        datarows: [['2026-09-15 10:00:00', 1]],
        size: 1,
        total: 7,
      })
    );
    mockPoll.mockResolvedValue(snapshot({ id: 'job-1', status: 'CANCELLED' }));

    const { statuses } = await run();
    const final = statuses[statuses.length - 1].status;

    expect(final.streaming?.isPolling).toBe(false);
    expect(final.streaming?.aborted).toBe(true);
    expect(final.streaming?.total).toBe(7);
  });

  it('reports ERROR and stops polling when a request fails unexpectedly', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1' }));
    mockPoll.mockRejectedValue(new Error('network exploded'));

    const { statuses } = await run().catch(() => ({ statuses: [] as any[] }));
    const final = statuses[statuses.length - 1]?.status;

    expect(final?.status).toBe('error');
    expect(final?.streaming?.isPolling).toBe(false);
    expect(final?.error?.originalErrorMessage).toBe('network exploded');
  });

  describe('when nothing was ever rendered', () => {
    // An engine without the async PPL API only reveals itself when the submit fails. Nothing is on
    // screen at that point, so the caller re-runs on the non-streaming path instead of showing an
    // error, and this run must not report one.
    it('reports the run as unavailable when the submit fails', async () => {
      mockSubmit.mockRejectedValue(new Error('no handler found for uri [/_plugins/_ppl]'));

      const { action } = await run();

      expect(isStreamUnavailable(action)).toBe(true);
      expect((action as { error: { message: string } }).error.message).toBe(
        'no handler found for uri [/_plugins/_ppl]'
      );
    });

    it('does not report an error status, which the fallback would have to clear', async () => {
      mockSubmit.mockRejectedValue(new Error('no handler'));

      const { statuses } = await run();

      expect(statuses.some((s: any) => s.status?.status === 'error')).toBe(false);
    });

    // A superseded run must stay silent: its successor owns the cache key.
    it('does not claim unavailability when the run is no longer current', async () => {
      mockSubmit.mockRejectedValue(new Error('no handler'));

      const { action } = await run({ isCurrent: () => false });

      expect(isStreamUnavailable(action)).toBe(false);
    });
  });

  // Once rows are on screen, re-running would replace them, so the failure is surfaced instead.
  it('reports an error rather than unavailability when a poll fails after rows arrived', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1', total: 2 }));
    mockPoll.mockRejectedValue(new Error('network exploded'));

    const { statuses } = await run();
    const final = statuses[statuses.length - 1]?.status;

    expect(final?.status).toBe('error');
  });

  it('releases the job once it completes, instead of leaving it to keep_alive', async () => {
    // Rows are held client-side from that point, so the retained result is pure heap cost.
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1' }));
    mockPoll.mockResolvedValue(snapshot({ id: 'job-1', status: 'SUCCEEDED', total: 3 }));

    await run();

    expect(mockCancel).toHaveBeenCalledWith('job-1', undefined);
  });

  it('still reports the completed result when releasing the job fails', async () => {
    mockSubmit.mockResolvedValue(snapshot({ id: 'job-1' }));
    mockPoll.mockResolvedValue(snapshot({ id: 'job-1', status: 'SUCCEEDED', total: 3 }));
    mockCancel.mockRejectedValueOnce(new Error('already gone'));

    const { statuses } = await run();

    expect(statuses[statuses.length - 1].status.status).toBe('ready');
  });
});
