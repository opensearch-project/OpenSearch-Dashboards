/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { spansToFlow } from './flow_transform';
import { CategorizedSpan } from './span_categorization';

// @ts-expect-error TS2322 TODO(ts-error): fixme
const makeSpan = (overrides: Partial<CategorizedSpan> = {}): CategorizedSpan => ({
  id: 'span-1',
  spanId: 'span-1',
  traceId: 'trace-1',
  parentSpanId: null,
  status: 'success',
  kind: 'invoke_agent',
  name: 'TestAgent',
  input: '',
  output: '',
  startTime: '',
  endTime: '',
  latency: '100ms',
  durationNanos: 100_000_000,
  totalTokens: 10,
  totalCost: '—',
  category: 'AGENT',
  categoryLabel: 'Agent',
  categoryColor: '#0077cc',
  displayName: 'TestAgent',
  ...overrides,
});

describe('spansToFlow', () => {
  it('returns empty arrays for empty input', () => {
    const result = spansToFlow([]);
    expect(result).toEqual({ nodes: [], edges: [] });
  });

  it('creates a single node for a single span', () => {
    const span = makeSpan();
    const { nodes, edges } = spansToFlow([span]);

    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);
    expect(nodes[0]).toEqual({
      id: 'span-1',
      type: 'agentCard',
      position: { x: 0, y: 0 },
      data: {
        id: 'span-1',
        title: 'TestAgent',
        nodeKind: 'agent',
        duration: 100,
        latency: '100ms',
        status: undefined,
      },
    });
  });

  it('maps all span categories to correct node kinds', () => {
    const categories = [
      { category: 'AGENT', expected: 'agent' },
      { category: 'LLM', expected: 'llm' },
      { category: 'TOOL', expected: 'tool' },
      { category: 'EMBEDDINGS', expected: 'embeddings' },
      { category: 'RETRIEVAL', expected: 'retrieval' },
      { category: 'OTHER', expected: 'other' },
    ] as const;

    categories.forEach(({ category, expected }) => {
      const span = makeSpan({ id: `span-${category}`, spanId: `span-${category}`, category });
      const { nodes } = spansToFlow([span]);
      expect(nodes[0].data.nodeKind).toBe(expected);
    });
  });

  it('creates edges from parent to child', () => {
    const parent = makeSpan({ id: 'parent', spanId: 'parent' });
    const child = makeSpan({
      id: 'child',
      spanId: 'child',
      parentSpanId: 'parent',
      category: 'LLM',
    });
    parent.children = [child];

    const { nodes, edges } = spansToFlow([parent]);

    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({
      id: 'parent-child',
      source: 'parent',
      target: 'child',
      type: 'celestialEdge',
      data: { style: { type: 'solid', marker: 'arrowClosed' } },
    });
  });

  it('handles nested children recursively', () => {
    const grandchild = makeSpan({
      id: 'gc',
      spanId: 'gc',
      category: 'TOOL',
    });
    const child = makeSpan({
      id: 'child',
      spanId: 'child',
      category: 'LLM',
      children: [grandchild],
    });
    const root = makeSpan({ id: 'root', spanId: 'root', children: [child] });

    const { nodes, edges } = spansToFlow([root]);

    expect(nodes).toHaveLength(3);
    expect(edges).toHaveLength(2);
    expect(nodes.map((n) => n.id)).toEqual(['root', 'child', 'gc']);
    expect(edges.map((e) => e.id)).toEqual(['root-child', 'child-gc']);
  });

  it('handles multiple root spans', () => {
    const root1 = makeSpan({ id: 'r1', spanId: 'r1' });
    const root2 = makeSpan({ id: 'r2', spanId: 'r2', category: 'LLM' });

    const { nodes, edges } = spansToFlow([root1, root2]);

    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(0);
  });

  it('uses id as fallback when spanId is empty', () => {
    const span = makeSpan({ id: 'fallback-id', spanId: '' });
    const { nodes } = spansToFlow([span]);
    expect(nodes[0].id).toBe('fallback-id');
  });

  it('uses displayName for title, falling back to name then Unknown', () => {
    const withDisplay = makeSpan({ displayName: 'Custom Name', name: 'Raw Name' });
    const withName = makeSpan({ displayName: '', name: 'Raw Name' });
    const withNeither = makeSpan({ displayName: '', name: '' });

    expect(spansToFlow([withDisplay]).nodes[0].data.title).toBe('Custom Name');
    expect(spansToFlow([withName]).nodes[0].data.title).toBe('Raw Name');
    expect(spansToFlow([withNeither]).nodes[0].data.title).toBe('Unknown');
  });

  it('converts durationNanos to duration in milliseconds', () => {
    const cases = [
      { durationNanos: 250_000_000, expected: 250 },
      { durationNanos: 1_500_000_000, expected: 1500 },
      { durationNanos: 120_000_000_000, expected: 120000 },
      { durationNanos: 500_000, expected: 0.5 },
    ];

    cases.forEach(({ durationNanos, expected }) => {
      const span = makeSpan({ durationNanos });
      const { nodes } = spansToFlow([span]);
      expect(nodes[0].data.duration).toBe(expected);
    });
  });

  it('sets duration to undefined when durationNanos is zero or negative', () => {
    const zeroDuration = makeSpan({ durationNanos: 0 });
    const negativeDuration = makeSpan({ durationNanos: -1 });

    expect(spansToFlow([zeroDuration]).nodes[0].data.duration).toBeUndefined();
    expect(spansToFlow([negativeDuration]).nodes[0].data.duration).toBeUndefined();
  });

  it('sets status to error only when span status is error', () => {
    const errorSpan = makeSpan({ status: 'error' });
    const successSpan = makeSpan({ status: 'success' });

    expect(spansToFlow([errorSpan]).nodes[0].data.status).toBe('error');
    expect(spansToFlow([successSpan]).nodes[0].data.status).toBeUndefined();
  });
});
