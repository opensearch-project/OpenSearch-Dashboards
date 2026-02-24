/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setLevels, spanToRow, buildFullSpanTree, hitsToAgentSpans, BaseRow } from './tree_utils';
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
  describe('setLevels', () => {
    it('sets levels recursively', () => {
      const rows: Array<{ level?: number; children?: any[] }> = [
        { children: [{ children: [{}] }] },
      ];
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
      const tree = buildFullSpanTree<BaseRow>(spans, (ts) => ts);

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
      const tree = buildFullSpanTree<BaseRow>(spans, (ts) => ts);

      expect(tree[0].level).toBe(0);
      expect(tree[0].children![0].level).toBe(1);
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
