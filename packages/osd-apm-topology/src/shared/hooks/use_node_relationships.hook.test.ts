/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import type { Edge, Node } from '@xyflow/react';
import { useReactFlow, getIncomers, getOutgoers } from '@xyflow/react';
import { useNodeRelationships, Visibility } from './use_node_relationships.hook';
// Import mocked functions

// Mock @xyflow/react
jest.mock('@xyflow/react', () => ({
  useReactFlow: jest.fn(),
  getIncomers: jest.fn(),
  getOutgoers: jest.fn(),
}));

describe('useNodeRelationships', () => {
  // Mock data
  const mockNodes: Node[] = [
    {
      id: 'node-1',
      position: { x: 0, y: 0 },
      data: { label: 'Node 1' },
      hidden: false,
    },
    {
      id: 'node-2',
      position: { x: 100, y: 0 },
      data: { label: 'Node 2' },
      hidden: false,
    },
    {
      id: 'node-3',
      position: { x: 200, y: 0 },
      data: { label: 'Node 3' },
      hidden: true,
    },
    {
      id: 'node-4',
      position: { x: 300, y: 0 },
      data: { label: 'Node 4', aggregatedNodeId: 'agg-1' },
      hidden: false,
    },
    {
      id: 'node-5',
      position: { x: 400, y: 0 },
      data: { label: 'Node 5', aggregatedNodeId: 'agg-1' },
      hidden: false,
    },
  ];

  const mockEdges: Edge[] = [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      hidden: false,
    },
    {
      id: 'edge-2',
      source: 'node-2',
      target: 'node-3',
      hidden: false,
    },
    {
      id: 'edge-3',
      source: 'node-1',
      target: 'node-3',
      hidden: true,
    },
    {
      id: 'edge-4',
      source: 'node-4',
      target: 'node-5',
      hidden: false,
    },
  ];

  const mockReactFlow = {
    getNodes: jest.fn(() => mockNodes),
    getEdges: jest.fn(() => mockEdges),
    getNode: jest.fn((id: string) => mockNodes.find((node) => node.id === id)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useReactFlow as any).mockReturnValue(mockReactFlow);
    // Mock getIncomers and getOutgoers
    (getIncomers as any).mockImplementation((node: Node, nodes: Node[], edges: Edge[]) => {
      return nodes.filter((n) => edges.some((e) => e.source === n.id && e.target === node.id));
    });

    (getOutgoers as any).mockImplementation((node: Node, nodes: Node[], edges: Edge[]) => {
      return nodes.filter((n) => edges.some((e) => e.source === node.id && e.target === n.id));
    });
  });

  describe('Hook Interface', () => {
    it('should return the correct interface', () => {
      const { result } = renderHook(() => useNodeRelationships());

      expect(result.current).toEqual({
        getAggregateSiblings: expect.any(Function),
        getAggregateSiblingsCount: expect.any(Function),
        getChildrenNodes: expect.any(Function),
        getChildrenNodesCount: expect.any(Function),
        getIncomingEdges: expect.any(Function),
        getIncomingEdgesCount: expect.any(Function),
        getOutgoingEdges: expect.any(Function),
        getOutgoingEdgesCount: expect.any(Function),
        getParentNodes: expect.any(Function),
        getParentNodesCount: expect.any(Function),
        getSiblingNodes: expect.any(Function),
        getSiblingNodesCount: expect.any(Function),
        hasAggregateSiblings: expect.any(Function),
        hasChildren: expect.any(Function),
        hasIncomingEdges: expect.any(Function),
        hasOutgoingEdges: expect.any(Function),
        hasParents: expect.any(Function),
        hasSiblings: expect.any(Function),
        isAggregateNode: expect.any(Function),
      });
    });
  });

  describe('Edge Analysis', () => {
    it('should get incoming edges for a node', () => {
      const { result } = renderHook(() => useNodeRelationships());

      const incomingEdges = result.current.getIncomingEdges('node-2');
      expect(incomingEdges).toHaveLength(1);
      expect(incomingEdges[0].id).toBe('edge-1');
    });

    it('should get incoming edges with visibility filtering', () => {
      const { result } = renderHook(() => useNodeRelationships());

      // Test visible edges only
      const visibleEdges = result.current.getIncomingEdges('node-3', Visibility.Visible);
      expect(visibleEdges).toHaveLength(1);
      expect(visibleEdges[0].id).toBe('edge-2');

      // Test hidden edges only
      const hiddenEdges = result.current.getIncomingEdges('node-3', Visibility.Hidden);
      expect(hiddenEdges).toHaveLength(1);
      expect(hiddenEdges[0].id).toBe('edge-3');

      // Test all edges
      const allEdges = result.current.getIncomingEdges('node-3', Visibility.Any);
      expect(allEdges).toHaveLength(2);
    });

    it('should get outgoing edges for a node', () => {
      const { result } = renderHook(() => useNodeRelationships());

      const outgoingEdges = result.current.getOutgoingEdges('node-1');
      expect(outgoingEdges).toHaveLength(2);
      expect(outgoingEdges.map((e) => e.id)).toContain('edge-1');
      expect(outgoingEdges.map((e) => e.id)).toContain('edge-3');
    });

    it('should count incoming and outgoing edges', () => {
      const { result } = renderHook(() => useNodeRelationships());

      expect(result.current.getIncomingEdgesCount('node-2')).toBe(1);
      expect(result.current.getOutgoingEdgesCount('node-1')).toBe(2);
      expect(result.current.getIncomingEdgesCount('node-3', Visibility.Visible)).toBe(1);
    });

    it('should check if node has incoming/outgoing edges', () => {
      const { result } = renderHook(() => useNodeRelationships());

      expect(result.current.hasIncomingEdges('node-2')).toBe(true);
      expect(result.current.hasIncomingEdges('node-1')).toBe(false);
      expect(result.current.hasOutgoingEdges('node-1')).toBe(true);
      expect(result.current.hasOutgoingEdges('node-3')).toBe(false);
    });
  });

  describe('Node Relationships', () => {
    it('should get parent nodes', () => {
      const { result } = renderHook(() => useNodeRelationships());

      const parents = result.current.getParentNodes('node-2');
      expect(parents).toHaveLength(1);
      expect(parents[0].id).toBe('node-1');
    });

    it('should get children nodes', () => {
      const { result } = renderHook(() => useNodeRelationships());

      const children = result.current.getChildrenNodes('node-1');
      expect(children).toHaveLength(2);
      expect(children.map((n) => n.id)).toContain('node-2');
      expect(children.map((n) => n.id)).toContain('node-3');
    });

    it('should get sibling nodes', () => {
      const { result } = renderHook(() => useNodeRelationships());

      const siblings = result.current.getSiblingNodes('node-2');
      // node-2 and node-3 are siblings (both children of node-1)
      expect(siblings).toHaveLength(2);
      expect(siblings.map((n) => n.id)).toContain('node-2');
      expect(siblings.map((n) => n.id)).toContain('node-3');
    });

    it('should count parent, children, and sibling nodes', () => {
      const { result } = renderHook(() => useNodeRelationships());

      expect(result.current.getParentNodesCount('node-2')).toBe(1);
      expect(result.current.getChildrenNodesCount('node-1')).toBe(2);
      expect(result.current.getSiblingNodesCount('node-2')).toBe(2);
    });

    it('should check if node has parents, children, or siblings', () => {
      const { result } = renderHook(() => useNodeRelationships());

      expect(result.current.hasParents('node-2')).toBe(true);
      expect(result.current.hasParents('node-1')).toBe(false);
      expect(result.current.hasChildren('node-1')).toBe(true);
      expect(result.current.hasChildren('node-3')).toBe(false);
      expect(result.current.hasSiblings('node-2')).toBe(true);
    });
  });

  describe('Visibility Filtering', () => {
    it('should filter nodes by visibility state', () => {
      const { result } = renderHook(() => useNodeRelationships());

      // Test with visible nodes only
      const visibleChildren = result.current.getChildrenNodes('node-1', Visibility.Visible);
      expect(visibleChildren).toHaveLength(1);
      expect(visibleChildren[0].id).toBe('node-2');

      // Test with hidden nodes only
      const hiddenChildren = result.current.getChildrenNodes('node-1', Visibility.Hidden);
      expect(hiddenChildren).toHaveLength(1);
      expect(hiddenChildren[0].id).toBe('node-3');

      // Test with all nodes
      const allChildren = result.current.getChildrenNodes('node-1', Visibility.Any);
      expect(allChildren).toHaveLength(2);
    });
  });

  describe('Aggregate Node Methods', () => {
    it('should identify aggregate nodes', () => {
      const { result } = renderHook(() => useNodeRelationships());

      expect(result.current.isAggregateNode('node-4', Visibility.Any)).toBe(true);
      expect(result.current.isAggregateNode('node-5', Visibility.Any)).toBe(true);
      expect(result.current.isAggregateNode('node-1', Visibility.Any)).toBe(false);
    });

    it('should get aggregate siblings', () => {
      const { result } = renderHook(() => useNodeRelationships());

      const aggregateSiblings = result.current.getAggregateSiblings('node-4', Visibility.Any);
      expect(aggregateSiblings).toHaveLength(1);
      expect(aggregateSiblings[0].id).toBe('node-5');

      // Should exclude the original node
      const node5Siblings = result.current.getAggregateSiblings('node-5', Visibility.Any);
      expect(node5Siblings).toHaveLength(1);
      expect(node5Siblings[0].id).toBe('node-4');
    });

    it('should count aggregate siblings', () => {
      const { result } = renderHook(() => useNodeRelationships());

      expect(result.current.getAggregateSiblingsCount('node-4', Visibility.Any)).toBe(1);
      expect(result.current.getAggregateSiblingsCount('node-1', Visibility.Any)).toBe(0);
    });

    it('should check if node has aggregate siblings', () => {
      const { result } = renderHook(() => useNodeRelationships());

      expect(result.current.hasAggregateSiblings('node-4', Visibility.Any)).toBe(true);
      expect(result.current.hasAggregateSiblings('node-1', Visibility.Any)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent nodes gracefully', () => {
      const { result } = renderHook(() => useNodeRelationships());

      // Non-existent node should return empty arrays/false
      expect(result.current.getIncomingEdges('non-existent')).toEqual([]);
      expect(result.current.getOutgoingEdges('non-existent')).toEqual([]);
      expect(result.current.getParentNodes('non-existent')).toEqual([]);
      expect(result.current.getChildrenNodes('non-existent')).toEqual([]);
      expect(result.current.getSiblingNodes('non-existent')).toEqual([]);

      expect(result.current.hasIncomingEdges('non-existent')).toBe(false);
      expect(result.current.hasOutgoingEdges('non-existent')).toBe(false);
      expect(result.current.hasParents('non-existent')).toBe(false);
      expect(result.current.hasChildren('non-existent')).toBe(false);
      expect(result.current.hasSiblings('non-existent')).toBe(false);

      expect(result.current.isAggregateNode('non-existent', Visibility.Any)).toBe(false);
      expect(result.current.getAggregateSiblings('non-existent', Visibility.Any)).toEqual([]);
    });

    it('should handle nodes without aggregate data', () => {
      const { result } = renderHook(() => useNodeRelationships());

      expect(result.current.getAggregateSiblings('node-1', Visibility.Any)).toEqual([]);
      expect(result.current.getAggregateSiblingsCount('node-1', Visibility.Any)).toBe(0);
      expect(result.current.hasAggregateSiblings('node-1', Visibility.Any)).toBe(false);
    });

    it('should handle empty graph data', () => {
      // Mock empty data
      const emptyReactFlow = {
        getNodes: jest.fn(() => []),
        getEdges: jest.fn(() => []),
        getNode: jest.fn(() => undefined),
      };

      (useReactFlow as any).mockReturnValue(emptyReactFlow);

      const { result } = renderHook(() => useNodeRelationships());

      expect(result.current.getIncomingEdges('any-node')).toEqual([]);
      expect(result.current.getOutgoingEdges('any-node')).toEqual([]);
      expect(result.current.hasIncomingEdges('any-node')).toBe(false);
      expect(result.current.hasOutgoingEdges('any-node')).toBe(false);
    });
  });

  describe('Integration with React Flow utilities', () => {
    it('should call React Flow utilities correctly', () => {
      const { result } = renderHook(() => useNodeRelationships());

      // Test that getIncomers is called when getting parent nodes
      result.current.getParentNodes('node-2');
      expect(getIncomers).toHaveBeenCalled();

      // Test that getOutgoers is called when getting children nodes
      result.current.getChildrenNodes('node-1');
      expect(getOutgoers).toHaveBeenCalled();

      // Test that React Flow methods are called
      expect(mockReactFlow.getNodes).toHaveBeenCalled();
      expect(mockReactFlow.getEdges).toHaveBeenCalled();
      expect(mockReactFlow.getNode).toHaveBeenCalled();
    });
  });
});
