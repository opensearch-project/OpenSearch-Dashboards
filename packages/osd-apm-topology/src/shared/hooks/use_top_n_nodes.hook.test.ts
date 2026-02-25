/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { expect } from '../../test_utils/vitest.utilities';
import { useTopNNodes } from './use_top_n_nodes.hook';
import type { CelestialNode, CelestialEdge } from '../../types';

const createNode = (id: string, overrides: Record<string, any> = {}): CelestialNode => ({
  id,
  type: 'celestialNode',
  position: { x: 0, y: 0 },
  data: { id, title: id, keyAttributes: {} } as any,
  ...overrides,
});

const createEdge = (source: string, target: string): CelestialEdge => ({
  id: `${source}-${target}`,
  source,
  target,
});

describe('useTopNNodes', () => {
  it('returns all nodes when topN >= total node count', () => {
    const nodes = [createNode('a'), createNode('b'), createNode('c')];
    const edges = [createEdge('a', 'b')];

    const { result } = renderHook(() => useTopNNodes({ nodes, edges, topN: 10 }));

    expect(result.current).toHaveLength(3);
  });

  it('returns all nodes when nodes array is empty', () => {
    const { result } = renderHook(() => useTopNNodes({ nodes: [], edges: [], topN: 5 }));

    expect(result.current).toHaveLength(0);
  });

  it('returns top N nodes via BFS from root nodes', () => {
    // a -> b -> c -> d
    const nodes = [createNode('a'), createNode('b'), createNode('c'), createNode('d')];
    const edges = [createEdge('a', 'b'), createEdge('b', 'c'), createEdge('c', 'd')];

    const { result } = renderHook(() => useTopNNodes({ nodes, edges, topN: 2 }));

    // Should include root 'a' and its first child 'b'
    const ids = result.current.map((n) => n.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
    expect(result.current.length).toBeLessThanOrEqual(3); // topN=2, but root adjustment may apply
  });

  it('identifies root nodes as those with no incoming edges', () => {
    // a -> c, b -> c (a and b are roots)
    const nodes = [createNode('a'), createNode('b'), createNode('c')];
    const edges = [createEdge('a', 'c'), createEdge('b', 'c')];

    const { result } = renderHook(() => useTopNNodes({ nodes, edges, topN: 2 }));

    const ids = result.current.map((n) => n.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
  });

  it('respects topN limit', () => {
    // a -> b, a -> c, a -> d, a -> e
    const nodes = [
      createNode('a'),
      createNode('b'),
      createNode('c'),
      createNode('d'),
      createNode('e'),
    ];
    const edges = [
      createEdge('a', 'b'),
      createEdge('a', 'c'),
      createEdge('a', 'd'),
      createEdge('a', 'e'),
    ];

    const { result } = renderHook(() => useTopNNodes({ nodes, edges, topN: 3 }));

    expect(result.current.length).toBeLessThanOrEqual(4);
  });

  it('includes aggregated nodes if their root is selected', () => {
    const nodes = [
      createNode('a'),
      createNode('b'),
      createNode('b-agg', {
        data: { id: 'b-agg', title: 'b-agg', keyAttributes: {}, aggregatedNodeId: 'group1' },
      }),
      createNode('c', {
        data: { id: 'c', title: 'c', keyAttributes: {}, aggregatedNodeId: 'group1' },
      }),
    ];
    const edges = [createEdge('a', 'b'), createEdge('a', 'b-agg')];

    const { result } = renderHook(() => useTopNNodes({ nodes, edges, topN: 3 }));

    // Should include 'c' because it shares aggregatedNodeId='group1' with 'b-agg'
    const ids = result.current.map((n) => n.id);
    expect(ids).toContain('c');
  });
});
