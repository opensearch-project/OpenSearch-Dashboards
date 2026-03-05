/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CollapseContext } from './raw_graph_relationships.utils';
import {
  getNode,
  getAggregateIds,
  getNodesByAggregateId,
  getNodeCollectionsForAggregateIds,
  getAggregateSiblingsIds,
  getParentNodeIds,
  getChildrenNodeIds,
} from './raw_graph_relationships.utils';
import type { CelestialNode, CelestialEdge } from '../../types';

// Mock test data
const createMockNode = (id: string, aggregatedNodeId?: string | null): CelestialNode => ({
  id,
  type: 'default',
  position: { x: 0, y: 0 },
  data: {
    id,
    title: `Node ${id}`,
    keyAttributes: {},
    aggregatedNodeId,
  },
});

const createMockEdge = (id: string, source: string, target: string): CelestialEdge => ({
  id,
  source,
  target,
});

describe('raw-graph-relationships.utils', () => {
  describe('getNode', () => {
    const mockNodes: CelestialNode[] = [
      createMockNode('node1'),
      createMockNode('node2'),
      createMockNode('node3'),
    ];

    it('should find existing node by ID', () => {
      const result = getNode('node2', mockNodes);
      expect(result).toBeDefined();
      expect(result?.id).toBe('node2');
    });

    it('should return undefined for non-existent node', () => {
      const result = getNode('nonexistent', mockNodes);
      expect(result).toBeUndefined();
    });

    it('should handle empty array', () => {
      const result = getNode('node1', []);
      expect(result).toBeUndefined();
    });
  });

  describe('getAggregateIds', () => {
    it('should extract unique aggregate IDs from nodes', () => {
      const mockNodes: CelestialNode[] = [
        createMockNode('node1', 'group1'),
        createMockNode('node2', 'group2'),
        createMockNode('node3', 'group1'),
        createMockNode('node4'), // no aggregatedNodeId
      ];

      const result = getAggregateIds(mockNodes);
      expect(result).toEqual(['group1', 'group2']);
    });

    it('should deduplicate duplicate aggregate IDs', () => {
      const mockNodes: CelestialNode[] = [
        createMockNode('node1', 'group1'),
        createMockNode('node2', 'group1'),
        createMockNode('node3', 'group1'),
      ];

      const result = getAggregateIds(mockNodes);
      expect(result).toEqual(['group1']);
    });

    it('should handle nodes without aggregatedNodeId', () => {
      const mockNodes: CelestialNode[] = [
        createMockNode('node1'),
        createMockNode('node2', null),
        createMockNode('node3'),
      ];

      const result = getAggregateIds(mockNodes);
      expect(result).toEqual([]);
    });

    it('should handle empty array', () => {
      const result = getAggregateIds([]);
      expect(result).toEqual([]);
    });
  });

  describe('getNodesByAggregateId', () => {
    const mockNodes: CelestialNode[] = [
      createMockNode('node1', 'group1'),
      createMockNode('node2', 'group2'),
      createMockNode('node3', 'group1'),
      createMockNode('node4'), // no aggregatedNodeId
    ];

    it('should filter nodes by aggregate ID correctly', () => {
      const result = getNodesByAggregateId('group1', mockNodes);
      expect(result).toHaveLength(2);
      expect(result.map((n) => n.id)).toEqual(['node1', 'node3']);
    });

    it('should return empty array for no matches', () => {
      const result = getNodesByAggregateId('nonexistent', mockNodes);
      expect(result).toEqual([]);
    });

    it('should handle empty nodes array', () => {
      const result = getNodesByAggregateId('group1', []);
      expect(result).toEqual([]);
    });
  });

  describe('getNodeCollectionsForAggregateIds', () => {
    const mockNodes: CelestialNode[] = [
      createMockNode('node1', 'group1'),
      createMockNode('node2', 'group2'),
      createMockNode('node3', 'group1'),
      createMockNode('node4', 'group3'),
    ];

    it('should group nodes correctly by aggregate IDs', () => {
      const aggregateIds = ['group1', 'group2'];
      const result = getNodeCollectionsForAggregateIds(aggregateIds, mockNodes);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(2); // group1 has 2 nodes
      expect(result[1]).toHaveLength(1); // group2 has 1 node
      expect(result[0].map((n) => n.id)).toEqual(['node1', 'node3']);
      expect(result[1].map((n) => n.id)).toEqual(['node2']);
    });

    it('should handle empty aggregate IDs array', () => {
      const result = getNodeCollectionsForAggregateIds([], mockNodes);
      expect(result).toEqual([]);
    });

    it('should handle empty nodes array', () => {
      const result = getNodeCollectionsForAggregateIds(['group1'], []);
      expect(result).toEqual([[]]);
    });
  });

  describe('getAggregateSiblingsIds', () => {
    const mockNodes: CelestialNode[] = [
      createMockNode('node1', 'group1'),
      createMockNode('node2', 'group1'),
      createMockNode('node3', 'group1'),
      createMockNode('node4', 'group2'),
      createMockNode('node5'), // no aggregatedNodeId
    ];

    it('should find siblings with same aggregate ID (excluding original)', () => {
      const result = getAggregateSiblingsIds('node1', mockNodes);
      expect(result).toEqual(['node2', 'node3']);
    });

    it('should return empty array for non-existent node', () => {
      const result = getAggregateSiblingsIds('nonexistent', mockNodes);
      expect(result).toEqual([]);
    });

    it('should return empty array for node with no siblings', () => {
      const result = getAggregateSiblingsIds('node4', mockNodes);
      expect(result).toEqual([]);
    });

    it('should handle node without aggregatedNodeId', () => {
      const result = getAggregateSiblingsIds('node5', mockNodes);
      expect(result).toEqual([]);
    });

    it('should handle empty nodes array', () => {
      const result = getAggregateSiblingsIds('node1', []);
      expect(result).toEqual([]);
    });
  });

  describe('getParentNodeIds', () => {
    const mockEdges: CelestialEdge[] = [
      createMockEdge('edge1', 'parent1', 'child1'),
      createMockEdge('edge2', 'parent2', 'child1'),
      createMockEdge('edge3', 'parent1', 'child2'),
      createMockEdge('edge4', 'child1', 'grandchild1'),
    ];

    it('should find parent nodes via incoming edges', () => {
      const result = getParentNodeIds('child1', mockEdges);
      expect(result).toEqual(['parent1', 'parent2']);
    });

    it('should find single parent', () => {
      const result = getParentNodeIds('child2', mockEdges);
      expect(result).toEqual(['parent1']);
    });

    it('should return empty array when no parents exist', () => {
      const result = getParentNodeIds('parent1', mockEdges);
      expect(result).toEqual([]);
    });

    it('should handle empty edges array', () => {
      const result = getParentNodeIds('child1', []);
      expect(result).toEqual([]);
    });
  });

  describe('getChildrenNodeIds', () => {
    const mockEdges: CelestialEdge[] = [
      createMockEdge('edge1', 'parent1', 'child1'),
      createMockEdge('edge2', 'parent1', 'child2'),
      createMockEdge('edge3', 'parent2', 'child1'),
      createMockEdge('edge4', 'child1', 'grandchild1'),
    ];

    it('should find child nodes via outgoing edges', () => {
      const result = getChildrenNodeIds('parent1', mockEdges);
      expect(result).toEqual(['child1', 'child2']);
    });

    it('should find single child', () => {
      const result = getChildrenNodeIds('child1', mockEdges);
      expect(result).toEqual(['grandchild1']);
    });

    it('should return empty array when no children exist', () => {
      const result = getChildrenNodeIds('grandchild1', mockEdges);
      expect(result).toEqual([]);
    });

    it('should handle empty edges array', () => {
      const result = getChildrenNodeIds('parent1', []);
      expect(result).toEqual([]);
    });
  });

  describe('CollapseContext interface', () => {
    it('should have correct structure', () => {
      const context: CollapseContext = {
        topOfStackNodeId: 'node1',
        stackSiblingIds: ['node2', 'node3'],
        parentIds: ['parent1'],
        childrenIds: ['child1'],
      };

      expect(context.topOfStackNodeId).toBe('node1');
      expect(context.stackSiblingIds).toEqual(['node2', 'node3']);
      expect(context.parentIds).toEqual(['parent1']);
      expect(context.childrenIds).toEqual(['child1']);
    });
  });

  describe('Integration scenarios', () => {
    it('should work together for complex graph relationships', () => {
      const mockNodes: CelestialNode[] = [
        createMockNode('service1', 'loadbalancer-group'),
        createMockNode('service2', 'loadbalancer-group'),
        createMockNode('service3', 'database-group'),
        createMockNode('service4', 'database-group'),
        createMockNode('gateway'),
      ];

      const mockEdges: CelestialEdge[] = [
        createMockEdge('edge1', 'gateway', 'service1'),
        createMockEdge('edge2', 'gateway', 'service2'),
        createMockEdge('edge3', 'service1', 'service3'),
        createMockEdge('edge4', 'service2', 'service4'),
      ];

      // Test aggregate grouping
      const aggregateIds = getAggregateIds(mockNodes);
      expect(aggregateIds).toEqual(['loadbalancer-group', 'database-group']);

      // Test sibling relationships
      const service1Siblings = getAggregateSiblingsIds('service1', mockNodes);
      expect(service1Siblings).toEqual(['service2']);

      // Test parent-child relationships
      const service1Parents = getParentNodeIds('service1', mockEdges);
      expect(service1Parents).toEqual(['gateway']);

      const service1Children = getChildrenNodeIds('service1', mockEdges);
      expect(service1Children).toEqual(['service3']);
    });
  });
});
