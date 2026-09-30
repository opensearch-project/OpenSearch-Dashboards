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
    const executeQuery = jest.fn(async (dataset: any, query: string) => {
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
      dataset as any,
      'source = spans',
      (t) => t
    );

    expect(result.totalSessions).toBe(7);
    expect(result.sessions.map((s) => [s.sessionId, s.totalTraces])).toEqual([['s1', 2]]);
    const byQuery = (part: string) =>
      executeQuery.mock.calls.find(([, q]) => q.includes(part))?.[0];
    // The matching query keeps the time range; per-session totals drop it.
    expect(byQuery('as last_seen').timeFieldName).toBe('endTime');
    expect(byQuery('as total_traces').timeFieldName).toBeUndefined();
  });
});
