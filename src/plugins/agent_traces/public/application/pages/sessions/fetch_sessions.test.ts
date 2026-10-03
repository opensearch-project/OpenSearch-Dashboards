/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchSessions, sessionFilterFor } from './fetch_sessions';

const SESSION = 'attributes.gen_ai.conversation.id';
const ppl = (schema: string[], rows: unknown[][]) => ({
  schema: schema.map((name) => ({ name })),
  datarows: rows,
});

describe('fetchSessions', () => {
  it('reports ignored commands and whether the query filters', () => {
    expect(sessionFilterFor('source = t | where a = 1 | head 5')).toEqual({
      whereQuery: 'source = t | where a = 1',
      ignoredCommands: ['head'],
      hasFilter: true,
    });
    expect(sessionFilterFor('source = t').hasFilter).toBe(false);
  });

  it('selects sessions under the time range and totals them over the whole session', async () => {
    const executeQuery = jest.fn(async (_dataset: { timeFieldName?: string }, query: string) => {
      if (query.includes('as total_sessions')) return ppl(['total_sessions'], [[7]]);
      if (query.includes('as last_seen')) return ppl([SESSION, 'last_seen'], [['s1', 'x']]);
      if (query.includes('as total_traces'))
        return ppl(
          [SESSION, 'total_traces', 'start_time', 'end_time'],
          [['s1', 2, '2026-09-29 10:00:00', '2026-09-29 10:01:00']]
        );
      if (query.includes('dedup traceId')) return ppl(['traceId', SESSION], [['t1', 's1']]);
      return ppl([], []);
    });
    const dataset = { id: 'd', title: 'spans', type: 'INDEX_PATTERN', timeFieldName: 'endTime' };

    const result = await fetchSessions(
      { executeQuery },
      dataset as never,
      'source = spans',
      (t) => t
    );

    expect(result.totalSessions).toBe(7);
    expect(result.sessions.map((s) => [s.sessionId, s.totalTraces])).toEqual([['s1', 2]]);
    const byQuery = (part: string) =>
      executeQuery.mock.calls.find(([, q]) => q.includes(part))?.[0];
    // The matching query keeps the time range; per-session totals drop it.
    expect(byQuery('as last_seen')?.timeFieldName).toBe('endTime');
    expect(byQuery('as total_traces')?.timeFieldName).toBeUndefined();
  });

  it('sizes the trace map by the sessions trace counts and flags partial results', async () => {
    const executeQuery = jest.fn(async (_dataset: unknown, query: string) => {
      if (query.includes('as total_sessions')) return ppl(['total_sessions'], [[1]]);
      if (query.includes('as last_seen')) return ppl([SESSION, 'last_seen'], [['s1', 'x']]);
      if (query.includes('as total_traces'))
        return ppl(
          [SESSION, 'total_traces', 'start_time', 'end_time'],
          [['s1', 30, '2026-09-29 10:00:00', '2026-09-29 10:01:00']]
        );
      if (query.includes('as spans by traceId')) return ppl(['traceId', SESSION], [['t1', 's1']]);
      return ppl([], []);
    });
    const dataset = { id: 'd', title: 'spans', type: 'INDEX_PATTERN' };

    const result = await fetchSessions(
      { executeQuery },
      dataset as never,
      'source = spans',
      (t) => t
    );
    const mapQuery = executeQuery.mock.calls.find(([, q]) => q.includes('as spans by traceId'));
    expect(mapQuery?.[1]).toMatch(/\| head 31$/); // 30 traces + one per session of slack
    expect(result.partial).toBe(false);

    const capped = await fetchSessions(
      { executeQuery },
      dataset as never,
      'source = spans',
      (t) => t,
      { maxTraces: 10 }
    );
    expect(capped.partial).toBe(true);
  });

  it('counts error traces per session and lists only error sessions on request', async () => {
    const executeQuery = jest.fn(async (_dataset: unknown, query: string) => {
      if (query.includes('as last_seen by traceId'))
        return ppl(
          ['last_seen', 'traceId', SESSION],
          [
            ['2026-09-29 10:03:00', 't3', 's2'],
            ['2026-09-29 10:02:00', 't2', 's1'],
            ['2026-09-29 10:01:00', 't1', 's1'],
          ]
        );
      if (query.includes('error_spans')) return ppl(['error_spans', 'traceId'], [[3, 't2']]);
      if (query.includes('as total_sessions')) return ppl(['total_sessions'], [[2]]);
      if (query.includes('as last_seen')) return ppl([SESSION, 'last_seen'], [['s1', 'x']]);
      if (query.includes('as total_traces'))
        return ppl(
          [SESSION, 'total_traces', 'start_time', 'end_time'],
          [['s1', 2, '2026-09-29 10:00:00', '2026-09-29 10:01:00']]
        );
      if (query.includes('as spans by traceId'))
        return ppl(
          ['traceId', SESSION],
          [
            ['t1', 's1'],
            ['t2', 's1'],
          ]
        );
      return ppl([], []);
    });
    const dataset = { id: 'd', title: 'spans', type: 'INDEX_PATTERN' };

    const all = await fetchSessions({ executeQuery }, dataset as never, 'source = spans', (t) => t);
    expect(all.sessions[0].errorTraces).toBe(1);

    executeQuery.mockClear();
    const onlyErrors = await fetchSessions(
      { executeQuery },
      dataset as never,
      'source = spans',
      (t) => t,
      { onlyWithErrors: true, maxTraces: 3 }
    );
    // s2's only trace has no error; s1's t2 does.
    expect(onlyErrors.sessions.map((s) => s.sessionId)).toEqual(['s1']);
    expect(onlyErrors.totalSessions).toBe(1);
    expect(onlyErrors.errorsPartial).toBe(true); // 3 session traces checked, the cap
    const errorQuery = executeQuery.mock.calls.find(([, q]) => q.includes('error_spans'))?.[1];
    expect(errorQuery).toContain('traceId in ("t3", "t2", "t1")');
  });

  it('returns no sessions when no session trace has errors', async () => {
    const executeQuery = jest.fn(async () => ppl([], []));
    const result = await fetchSessions(
      { executeQuery },
      { id: 'd', title: 'spans', type: 'INDEX_PATTERN' } as never,
      'source = spans',
      (t) => t,
      { onlyWithErrors: true }
    );
    expect(result).toMatchObject({ sessions: [], totalSessions: 0, errorsPartial: false });
    expect(executeQuery).toHaveBeenCalledTimes(1);
  });
});
