/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import type { CelestialNode, CelestialEdge } from '../../types';

const mockNodes: Record<string, any> = {};

const mockGraphInstance = {
  setGraph: jest.fn(),
  setDefaultEdgeLabel: jest.fn(),
  setNode: jest.fn((id: string, data: any) => {
    mockNodes[id] = { ...data, x: 100, y: 100 };
  }),
  setEdge: jest.fn(),
  node: jest.fn((id: string) => mockNodes[id] || null),
};

jest.mock('@dagrejs/dagre', () => {
  const dagre = {
    graphlib: {
      Graph: jest.fn().mockImplementation(() => mockGraphInstance),
    },
    layout: jest.fn(),
  };
  return {
    __esModule: true,
    default: dagre,
  };
});

import { useCelestialLayout } from './use-celestial-layout.hook';

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

describe('useCelestialLayout', () => {
  beforeEach(() => {
    Object.keys(mockNodes).forEach((key) => delete mockNodes[key]);
  });

  it('returns getLaidOutElements function', () => {
    const { result } = renderHook(() => useCelestialLayout());
    expect(typeof result.current.getLaidOutElements).toBe('function');
  });

  it('returns empty arrays when no nodes are provided', () => {
    const { result } = renderHook(() => useCelestialLayout());
    const { nodes, edges } = result.current.getLaidOutElements([], []);

    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });

  it('applies Dagre layout to connected nodes', () => {
    const nodes = [createNode('a'), createNode('b')];
    const edges = [createEdge('a', 'b')];

    const { result } = renderHook(() => useCelestialLayout());
    const layout = result.current.getLaidOutElements(nodes, edges);

    // Nodes should have updated positions from Dagre
    expect(layout.nodes.length).toBeGreaterThan(0);
    const nodeA = layout.nodes.find((n) => n.id === 'a');
    expect(nodeA).toBeDefined();
    // Position should be adjusted from Dagre center to top-left
    expect(nodeA!.position).toBeDefined();
  });

  it('arranges disconnected nodes in grid', () => {
    const nodes = [createNode('a'), createNode('b'), createNode('c')];
    const edges: CelestialEdge[] = []; // No edges = all disconnected

    const { result } = renderHook(() => useCelestialLayout());
    const layout = result.current.getLaidOutElements(nodes, edges);

    expect(layout.nodes).toHaveLength(3);
    // Disconnected nodes should have grid positions
    const positions = layout.nodes.map((n) => n.position);
    // Each node should have a different position
    const uniquePositions = new Set(positions.map((p) => `${p.x},${p.y}`));
    expect(uniquePositions.size).toBe(3);
  });

  it('uses LR as default direction', () => {
    const nodes = [createNode('a'), createNode('b')];
    const edges = [createEdge('a', 'b')];

    const { result } = renderHook(() => useCelestialLayout());
    const layout = result.current.getLaidOutElements(nodes, edges);

    const edge = layout.edges[0];
    expect(edge.sourceHandle).toBe('source-right');
    expect(edge.targetHandle).toBe('target-left');
  });

  it('rewires edge handles for LR direction: source-right/target-left', () => {
    const nodes = [createNode('a'), createNode('b')];
    const edges = [createEdge('a', 'b')];

    const { result } = renderHook(() => useCelestialLayout());
    const layout = result.current.getLaidOutElements(nodes, edges, { direction: 'LR' });

    expect(layout.edges[0].sourceHandle).toBe('source-right');
    expect(layout.edges[0].targetHandle).toBe('target-left');
  });

  it('rewires edge handles for TB direction: source-bottom/target-top', () => {
    const nodes = [createNode('a'), createNode('b')];
    const edges = [createEdge('a', 'b')];

    const { result } = renderHook(() => useCelestialLayout());
    const layout = result.current.getLaidOutElements(nodes, edges, { direction: 'TB' });

    expect(layout.edges[0].sourceHandle).toBe('source-bottom');
    expect(layout.edges[0].targetHandle).toBe('target-top');
  });

  it('rewires edge handles for RL direction: source-left/target-right', () => {
    const nodes = [createNode('a'), createNode('b')];
    const edges = [createEdge('a', 'b')];

    const { result } = renderHook(() => useCelestialLayout());
    const layout = result.current.getLaidOutElements(nodes, edges, { direction: 'RL' });

    expect(layout.edges[0].sourceHandle).toBe('source-left');
    expect(layout.edges[0].targetHandle).toBe('target-right');
  });

  it('rewires edge handles for BT direction: source-top/target-bottom', () => {
    const nodes = [createNode('a'), createNode('b')];
    const edges = [createEdge('a', 'b')];

    const { result } = renderHook(() => useCelestialLayout());
    const layout = result.current.getLaidOutElements(nodes, edges, { direction: 'BT' });

    expect(layout.edges[0].sourceHandle).toBe('source-top');
    expect(layout.edges[0].targetHandle).toBe('target-bottom');
  });
});
