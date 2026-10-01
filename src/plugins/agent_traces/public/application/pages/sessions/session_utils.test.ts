/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  assembleSessionRows,
  buildRootSpansQuery,
  buildSessionSpansQuery,
  buildMatchingSessionIdsQuery,
  buildSessionStatsQuery,
  buildTraceSessionMapQuery,
  formatSessionDuration,
  getSourceCommand,
  getSpanAttribute,
  parseSessionStats,
  pplResponseToRecords,
  shortenId,
  buildSessionFacetQuery,
  buildMatchingSessionCountQuery,
  withoutTimeRange,
  parseFacetBuckets,
} from './session_utils';
import { BaseRow } from '../traces/hooks/tree_utils';

const FIELD = 'attributes.gen_ai.conversation.id';

const msg = (role: string, text: string) =>
  JSON.stringify([{ role, parts: [{ type: 'text', content: text }] }]);

const root = (
  traceId: string,
  startTime: string,
  opts: Partial<BaseRow> & { userId?: string } = {}
): BaseRow => ({
  id: traceId,
  spanId: `${traceId}-root`,
  traceId,
  parentSpanId: null,
  status: 'success',
  kind: 'invoke_agent',
  name: 'POST /plan',
  input: opts.input ?? msg('user', `q-${traceId}`),
  output: opts.output ?? msg('assistant', `a-${traceId}`),
  startTime,
  endTime: startTime,
  latency: '1.00s',
  durationNanos: 1e9,
  totalTokens: opts.totalTokens ?? 100,
  inputTokens: 60,
  outputTokens: 40,
  totalCost: '—',
  rawDocument: {
    startTime,
    attributes: opts.userId ? { 'user.id': opts.userId } : {},
  },
});

describe('session_utils', () => {
  describe('query builders', () => {
    it('selects matching session ids with the user filter, most recent first', () => {
      expect(
        buildMatchingSessionIdsQuery('source = otel-v1-apm-span-* | where serviceName = "a"', 50)
      ).toBe(
        'source = otel-v1-apm-span-* | where serviceName = "a" | where isnotnull(`attributes.gen_ai.conversation.id`) | stats max(endTime) as last_seen by `attributes.gen_ai.conversation.id` | sort - last_seen | head 50'
      );
    });

    it('computes unfiltered stats for the selected sessions', () => {
      expect(buildSessionStatsQuery('source = otel-v1-apm-span-*', ['s1', 's2'])).toBe(
        'source = otel-v1-apm-span-* | where `attributes.gen_ai.conversation.id` in ("s1", "s2") | stats distinct_count(traceId) as total_traces, min(startTime) as start_time, max(endTime) as end_time by `attributes.gen_ai.conversation.id` | sort - start_time'
      );
    });

    it('escapes ids in IN lists', () => {
      expect(buildTraceSessionMapQuery('source = x', ['a"b', 'c'])).toContain('in ("a\\"b", "c")');
      expect(buildRootSpansQuery('source = x', ['t1'])).toContain(
        'where parentSpanId = "" and traceId in ("t1")'
      );
      expect(buildSessionSpansQuery('source = x', ['t1', 't2'], 10)).toBe(
        'source = x | where traceId in ("t1", "t2") | head 10'
      );
    });

    it('maps every trace to its session with a sized limit', () => {
      // One row per (trace, session) pair; the limit is sized by the caller, never a fixed head.
      expect(buildTraceSessionMapQuery('source = x', ['s1'], 42)).toBe(
        'source = x | where `attributes.gen_ai.conversation.id` in ("s1") | stats count() as spans by traceId, `attributes.gen_ai.conversation.id` | head 42'
      );
      expect(buildRootSpansQuery('source = x', ['t1', 't2'])).toContain('| head 2');
    });

    it('extracts the source command', () => {
      expect(getSourceCommand('source = idx | where a = 1')).toBe('source = idx');
      expect(getSourceCommand('source = idx')).toBe('source = idx');
    });
  });

  describe('pplResponseToRecords', () => {
    it('parses JDBC datarows', () => {
      const records = pplResponseToRecords({
        schema: [{ name: 'a' }, { name: 'b' }],
        datarows: [
          [1, 'x'],
          [2, 'y'],
        ],
      });
      expect(records).toEqual([
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
      ]);
    });

    it('parses data_frame fields', () => {
      const records = pplResponseToRecords({
        type: 'data_frame',
        body: {
          fields: [
            { name: 'a', values: [1, 2] },
            { name: 'b', values: ['x', 'y'] },
          ],
          size: 2,
        },
      });
      expect(records).toEqual([
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
      ]);
    });

    it('returns [] for empty or unknown responses', () => {
      expect(pplResponseToRecords(undefined)).toEqual([]);
      expect(pplResponseToRecords({ type: 'data_frame', body: { fields: [], size: 0 } })).toEqual(
        []
      );
    });
  });

  describe('getSpanAttribute', () => {
    it('reads flat dotted, nested and top-level flattened keys', () => {
      expect(getSpanAttribute({ attributes: { 'user.id': 'u1' } }, 'user.id')).toBe('u1');
      expect(getSpanAttribute({ attributes: { user: { id: 'u2' } } }, 'user.id')).toBe('u2');
      expect(getSpanAttribute({ 'attributes.user.id': 'u3' }, 'user.id')).toBe('u3');
      expect(getSpanAttribute({ attributes: {} }, 'user.id')).toBeUndefined();
    });
  });

  describe('assembleSessionRows', () => {
    const stats = parseSessionStats([
      {
        [FIELD]: 's1',
        total_traces: 2,
        start_time: '2026-09-28 22:17:18.659',
        end_time: '2026-09-28 22:17:27.692',
      },
      { [FIELD]: 's2', total_traces: 1, start_time: '2026-09-28 22:00:00', end_time: '' },
      { [FIELD]: null, total_traces: 5 },
    ]);

    it('drops rows without a session id', () => {
      expect(stats.map((s) => s.sessionId)).toEqual(['s1', 's2']);
    });

    it('picks first input and last output by trace start time and sums tokens', () => {
      const traceToSession = new Map([
        ['t2', 's1'],
        ['t1', 's1'],
        ['t3', 's2'],
      ]);
      const rows = assembleSessionRows(stats, traceToSession, [
        root('t2', '2026-09-28 22:17:25', { totalTokens: 50, userId: 'user-9' }),
        root('t1', '2026-09-28 22:17:18', { totalTokens: 100 }),
        root('t3', '2026-09-28 22:00:00', { totalTokens: '—', input: '—', output: '—' }),
      ]);

      expect(rows[0]).toMatchObject({
        sessionId: 's1',
        totalTraces: 2,
        totalTokens: 150,
        firstMessage: 'q-t1',
        lastMessage: 'a-t2',
        userId: 'user-9',
        traceIds: ['t1', 't2'],
        durationMs: 9033,
      });
      // No tokens, no text, invalid end time
      expect(rows[1]).toMatchObject({
        sessionId: 's2',
        totalTokens: null,
        firstMessage: '',
        lastMessage: '',
        userId: null,
        durationMs: 0,
      });
    });
  });

  describe('assembleSessionRows trace ids', () => {
    it('keeps traces without a root span, ordered by root start where known', () => {
      const stats = parseSessionStats([
        { [FIELD]: 's1', total_traces: 3, start_time: '2026-09-28 22:00:00', end_time: '' },
      ]);
      const traceToSession = new Map([
        ['t-noroot', 's1'],
        ['t2', 's1'],
        ['t1', 's1'],
      ]);
      const rows = assembleSessionRows(stats, traceToSession, [
        root('t2', '2026-09-28 22:00:05', {}),
        root('t1', '2026-09-28 22:00:01', {}),
      ]);
      expect(rows[0].traceIds).toEqual(['t1', 't2', 't-noroot']);
    });
  });

  describe('formatting', () => {
    it('formats session durations', () => {
      expect(formatSessionDuration(0)).toBe('—');
      expect(formatSessionDuration(3200)).toBe('3.2s');
      expect(formatSessionDuration((42 * 60 + 5) * 1000)).toBe('42m:05s');
      expect(formatSessionDuration((2 * 3600 + 48 * 60) * 1000)).toBe('2h:48m');
    });

    it('shortens long ids', () => {
      expect(shortenId('9c229eb8-3a5a-4b1c-9d33-aa12bc0cd891')).toBe('9c229eb8...d891');
      expect(shortenId('short')).toBe('short');
      expect(shortenId('sess_4c6af3f740894eac', 12, 0)).toBe('sess_4c6af3f...');
    });
  });
});

describe('session facets', () => {
  it('counts distinct sessions per facet value under the user query', () => {
    expect(buildSessionFacetQuery('source = spans | where a = 1', 'serviceName')).toBe(
      'source = spans | where a = 1 | where isnotnull(`attributes.gen_ai.conversation.id`) and isnotnull(`serviceName`) | stats distinct_count(`attributes.gen_ai.conversation.id`) as sessions by `serviceName` | sort - sessions | head 10'
    );
  });

  it('parses stats records into fields-panel buckets', () => {
    expect(
      parseFacetBuckets(
        [
          { serviceName: 'travel-planner', sessions: 3 },
          { serviceName: 'weather-agent', sessions: 1 },
          { serviceName: null, sessions: 5 },
        ],
        'serviceName'
      )
    ).toEqual([
      { value: 'travel-planner', display: 'travel-planner', count: 3, percent: 75 },
      { value: 'weather-agent', display: 'weather-agent', count: 1, percent: 25 },
    ]);
  });
});

describe('session totals', () => {
  it('counts sessions matching the query', () => {
    expect(buildMatchingSessionCountQuery('source = spans')).toBe(
      'source = spans | where isnotnull(`attributes.gen_ai.conversation.id`) | stats distinct_count(`attributes.gen_ai.conversation.id`) as total_sessions'
    );
  });

  it('drops only the time field from the dataset', () => {
    expect(withoutTimeRange({ id: 'd', title: 't', timeFieldName: 'endTime' })).toEqual({
      id: 'd',
      title: 't',
    });
  });
});
