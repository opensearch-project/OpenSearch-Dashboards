/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TreeNode,
  buildTreeFromTraceRow,
  flattenTree,
  countSpans,
  sumTokens,
  parseLatencyMs,
  parseRawTimestampMs,
  extractTimestamps,
  flattenVisibleNodes,
  calculateTimelineRange,
  TIMELINE_ROW_HEIGHT,
} from './tree_helpers';
import { TraceRow } from '../hooks/use_agent_traces';

jest.mock('../../../../services/span_categorization', () => ({
  getSpanCategory: jest.fn(() => 'OTHER'),
  getCategoryMeta: jest.fn(() => ({ color: '#ccc', bgColor: '#ccc', icon: 'dot', label: 'Other' })),
  SpanCategory: {},
}));

const makeTraceRow = (overrides: Partial<TraceRow> = {}): TraceRow => ({
  id: 'r1',
  spanId: 's1',
  traceId: 't1',
  parentSpanId: null,
  status: 'success',
  kind: 'chat',
  name: 'root',
  input: '',
  output: '',
  startTime: '',
  endTime: '',
  latency: '100ms',
  totalTokens: 10,
  totalCost: '—',
  ...overrides,
});

const makeNode = (overrides: Partial<TreeNode> = {}): TreeNode => ({
  id: 'n1',
  label: 'node1',
  ...overrides,
});

describe('tree_helpers', () => {
  describe('constants', () => {
    it('exports TIMELINE_ROW_HEIGHT', () => {
      expect(TIMELINE_ROW_HEIGHT).toBe(28);
    });
  });

  describe('buildTreeFromTraceRow', () => {
    it('converts a TraceRow to TreeNode', () => {
      const row = makeTraceRow();
      const node = buildTreeFromTraceRow(row);
      expect(node.label).toBe('root');
      expect(node.id).toBe('r1');
      expect(node.kind).toBe('chat');
      expect(node.tokens).toBe(10);
      expect(node.latency).toBe('100ms');
      expect(node.traceRow).toBe(row);
    });

    it('recursively converts children', () => {
      const child = makeTraceRow({ id: 'c1', name: 'child' });
      const row = makeTraceRow({ children: [child] });
      const node = buildTreeFromTraceRow(row);
      expect(node.children).toHaveLength(1);
      expect(node.children![0].label).toBe('child');
    });
  });

  describe('flattenTree', () => {
    it('flattens nested nodes', () => {
      const nodes: TreeNode[] = [
        makeNode({ id: 'a', children: [makeNode({ id: 'b' })] }),
        makeNode({ id: 'c' }),
      ];
      const flat = flattenTree(nodes);
      expect(flat.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    });

    it('returns empty for empty input', () => {
      expect(flattenTree([])).toEqual([]);
    });
  });

  describe('countSpans', () => {
    it('counts all nodes recursively', () => {
      const nodes: TreeNode[] = [makeNode({ children: [makeNode(), makeNode()] }), makeNode()];
      expect(countSpans(nodes)).toBe(4);
    });
  });

  describe('sumTokens', () => {
    it('sums numeric tokens recursively', () => {
      const nodes: TreeNode[] = [
        makeNode({ tokens: 5, children: [makeNode({ tokens: 3 })] }),
        makeNode({ tokens: 2 }),
      ];
      expect(sumTokens(nodes)).toBe(10);
    });

    it('ignores non-numeric tokens', () => {
      const nodes: TreeNode[] = [makeNode({ tokens: '—' }), makeNode({ tokens: 4 })];
      expect(sumTokens(nodes)).toBe(4);
    });
  });

  describe('parseLatencyMs', () => {
    it('parses ms values', () => {
      expect(parseLatencyMs('150ms')).toBe(150);
    });

    it('parses s values', () => {
      expect(parseLatencyMs('2.5s')).toBe(2500);
    });

    it('returns 0 for empty/dash', () => {
      expect(parseLatencyMs(undefined)).toBe(0);
      expect(parseLatencyMs('—')).toBe(0);
    });
  });

  describe('parseRawTimestampMs', () => {
    it('parses ISO timestamp', () => {
      const ms = parseRawTimestampMs('2025-01-01T00:00:00Z');
      expect(ms).toBe(new Date('2025-01-01T00:00:00Z').getTime());
    });

    it('normalizes space-separated timestamps', () => {
      const ms = parseRawTimestampMs('2025-01-01 12:00:00');
      expect(ms).toBeGreaterThan(0);
    });

    it('returns 0 for invalid input', () => {
      expect(parseRawTimestampMs(null)).toBe(0);
      expect(parseRawTimestampMs('')).toBe(0);
      expect(parseRawTimestampMs(123)).toBe(0);
    });
  });

  describe('extractTimestamps', () => {
    it('extracts from startTime and endTime', () => {
      const node = makeNode({
        traceRow: makeTraceRow({
          rawDocument: { startTime: '2025-01-01T00:00:00Z', endTime: '2025-01-01T00:01:00Z' },
        }),
      });
      const { startMs, endMs } = extractTimestamps(node);
      expect(startMs).toBeGreaterThan(0);
      expect(endMs).toBeGreaterThan(startMs);
    });

    it('falls back to startTime + durationInNanos', () => {
      const node = makeNode({
        traceRow: makeTraceRow({
          rawDocument: { startTime: '2025-01-01T00:00:00Z', durationInNanos: 1_000_000_000 },
        }),
      });
      const { startMs, endMs } = extractTimestamps(node);
      expect(endMs - startMs).toBeCloseTo(1000, 0);
    });

    it('returns zeros when no raw document', () => {
      const node = makeNode({ traceRow: makeTraceRow() });
      const { startMs, endMs } = extractTimestamps(node);
      expect(startMs).toBe(0);
      expect(endMs).toBe(0);
    });
  });

  describe('flattenVisibleNodes', () => {
    it('returns only top-level when nothing expanded', () => {
      const child = makeNode({ id: 'child' });
      const nodes: TreeNode[] = [makeNode({ id: 'parent', children: [child] })];
      const result = flattenVisibleNodes(nodes, new Set());
      expect(result).toHaveLength(1);
      expect(result[0].node.id).toBe('parent');
    });

    it('includes children when expanded', () => {
      const child = makeNode({ id: 'child' });
      const nodes: TreeNode[] = [makeNode({ id: 'parent', children: [child] })];
      const result = flattenVisibleNodes(nodes, new Set(['parent']));
      expect(result).toHaveLength(2);
    });
  });

  describe('calculateTimelineRange', () => {
    it('returns zeros for empty nodes', () => {
      expect(calculateTimelineRange([])).toEqual({ minMs: 0, maxMs: 0, durationMs: 0 });
    });

    it('returns zeros when no valid timestamps', () => {
      const nodes: TreeNode[] = [makeNode()];
      expect(calculateTimelineRange(nodes)).toEqual({ minMs: 0, maxMs: 0, durationMs: 0 });
    });

    it('calculates range from nodes with timestamps', () => {
      const nodes: TreeNode[] = [
        makeNode({
          traceRow: makeTraceRow({
            rawDocument: { startTime: '2025-01-01T00:00:00Z', endTime: '2025-01-01T00:01:00Z' },
          }),
        }),
      ];
      const range = calculateTimelineRange(nodes);
      expect(range.durationMs).toBe(60000);
    });
  });
});
