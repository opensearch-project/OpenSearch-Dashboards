/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  formatTimestamp,
  setLevels,
  spanToRow,
  buildFullSpanTree,
  hitsToAgentSpans,
} from './tree_utils';
import { AgentSpan } from './span_transforms';

const makeSpan = (overrides: Partial<AgentSpan> = {}): AgentSpan => ({
  spanId: 'span-1',
  traceId: 'trace-1',
  parentSpanId: null,
  name: 'test',
  kind: 'chat',
  operationName: 'chat',
  startTime: '2025-01-01 00:00:00',
  endTime: '2025-01-01 00:00:01',
  durationNanos: 1_000_000_000,
  statusCode: 0,
  statusMessage: '',
  serviceName: 'svc',
  genAiSystem: 'openai',
  genAiRequestModel: 'gpt-4',
  genAiInputTokens: 10,
  genAiOutputTokens: 20,
  genAiTotalTokens: 30,
  input: 'hello',
  output: 'world',
  rawDocument: {},
  ...overrides,
});

describe('tree_utils', () => {
  describe('formatTimestamp', () => {
    it('formats UTC timestamp in the given timezone', () => {
      const result = formatTimestamp('2025-01-01 12:00:00', 'America/New_York');
      expect(result).toBe('01/01/2025, 7:00:00.000 AM');
    });

    it('returns dash for empty timestamp', () => {
      expect(formatTimestamp('', 'UTC')).toBe('—');
    });

    it('returns dash for invalid timestamp', () => {
      expect(formatTimestamp('not-a-date', 'UTC')).toBe('—');
    });

    it('preserves millisecond precision', () => {
      const result = formatTimestamp('2025-06-15 08:30:45.789', 'UTC');
      expect(result).toContain('.789');
    });
  });

  describe('setLevels', () => {
    it('sets levels recursively', () => {
      const rows: any[] = [{ children: [{ children: [{}] }] }];
      setLevels(rows, 0);
      expect(rows[0].level).toBe(0);
      expect(rows[0].children![0].level).toBe(1);
      expect(rows[0].children![0].children![0].level).toBe(2);
    });
  });

  describe('spanToRow', () => {
    it('converts AgentSpan to BaseRow', () => {
      const span = makeSpan();
      const fmt = (ts: string) => `formatted:${ts}`;
      const row = spanToRow(span, 0, fmt);

      expect(row.spanId).toBe('span-1');
      expect(row.status).toBe('success');
      expect(row.startTime).toBe('formatted:2025-01-01 00:00:00');
      expect(row.totalTokens).toBe(30);
    });

    it('marks error status for statusCode >= 2', () => {
      const span = makeSpan({ statusCode: 2 });
      const row = spanToRow(span, 0, (ts) => ts);
      expect(row.status).toBe('error');
    });

    it('computes totalTokens from input+output when total is null', () => {
      const span = makeSpan({ genAiTotalTokens: null, genAiInputTokens: 5, genAiOutputTokens: 3 });
      const row = spanToRow(span, 0, (ts) => ts);
      expect(row.totalTokens).toBe(8);
    });
  });

  describe('buildFullSpanTree', () => {
    it('builds a tree from flat spans', () => {
      const spans = [
        makeSpan({ spanId: 'root', parentSpanId: null }),
        makeSpan({ spanId: 'child', parentSpanId: 'root' }),
      ];
      const tree = buildFullSpanTree(spans, (ts) => ts);

      expect(tree).toHaveLength(1);
      expect(tree[0].spanId).toBe('root');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children![0].spanId).toBe('child');
    });

    it('sets levels correctly', () => {
      const spans = [
        makeSpan({ spanId: 'root', parentSpanId: null }),
        makeSpan({ spanId: 'child', parentSpanId: 'root' }),
      ];
      const tree = buildFullSpanTree(spans, (ts) => ts);

      expect(tree[0].level).toBe(0);
      expect(tree[0].children![0].level).toBe(1);
    });

    it('sorts children earliest-first using rawDocument.startTime', () => {
      const spans = [
        makeSpan({ spanId: 'root', parentSpanId: null }),
        makeSpan({
          spanId: 'late',
          parentSpanId: 'root',
          rawDocument: { startTime: '2025-01-01 00:00:10' },
        }),
        makeSpan({
          spanId: 'early',
          parentSpanId: 'root',
          rawDocument: { startTime: '2025-01-01 00:00:01' },
        }),
        makeSpan({
          spanId: 'mid',
          parentSpanId: 'root',
          rawDocument: { startTime: '2025-01-01 00:00:05' },
        }),
      ];
      const tree = buildFullSpanTree(spans, (ts) => ts);
      const childIds = tree[0].children!.map((c) => c.spanId);
      expect(childIds).toEqual(['early', 'mid', 'late']);
    });

    it('handles spans without rawDocument.startTime in sort', () => {
      const spans = [
        makeSpan({ spanId: 'root', parentSpanId: null }),
        makeSpan({
          spanId: 'has-time',
          parentSpanId: 'root',
          rawDocument: { startTime: '2025-01-01 00:00:01' },
        }),
        makeSpan({
          spanId: 'no-time',
          parentSpanId: 'root',
          rawDocument: {},
        }),
      ];
      const tree = buildFullSpanTree(spans, (ts) => ts);
      // Should not throw; span without startTime sorts to beginning (time 0)
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children![0].spanId).toBe('no-time');
      expect(tree[0].children![1].spanId).toBe('has-time');
    });

    it('treats orphan spans as roots', () => {
      const spans = [
        makeSpan({ spanId: 'a', parentSpanId: 'missing' }),
        makeSpan({ spanId: 'b', parentSpanId: null }),
      ];
      const tree = buildFullSpanTree(spans, (ts) => ts);
      expect(tree).toHaveLength(2);
    });
  });

  describe('hitsToAgentSpans', () => {
    it('converts trace hits to agent spans', () => {
      const hits = [{ spanId: 's1', traceId: 't1', name: 'test', startTime: '2025-01-01' }];
      const result = hitsToAgentSpans(hits as any);
      expect(result).toHaveLength(1);
      expect(result[0].spanId).toBe('s1');
    });
  });
});
