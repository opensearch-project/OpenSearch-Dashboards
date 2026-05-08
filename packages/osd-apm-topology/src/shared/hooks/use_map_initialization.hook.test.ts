/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import type { CelestialEdge, CelestialNode } from '../../types';
import { useMapInitialization } from './use_map_initialization.hook';

/**
 * Creates a mock celestial node with default properties
 */
function createMockNode(
  id: string,
  aggregatedNodeId?: string,
  additionalData: Partial<CelestialNode['data']> = {}
): CelestialNode {
  return {
    id,
    type: 'celestial',
    position: { x: 0, y: 0 },
    data: {
      id,
      title: `Node ${id}`,
      keyAttributes: {},
      aggregatedNodeId,
      isStacked: false,
      isFaded: false,
      ...additionalData,
    },
    hidden: false,
  };
}

/**
 * Creates a mock celestial edge with default properties
 */
function createMockEdge(
  id: string,
  source: string,
  target: string,
  additionalProps: Partial<CelestialEdge> = {}
): CelestialEdge {
  return {
    id,
    source,
    target,
    type: 'celestial',
    style: { opacity: 1 },
    hidden: false,
    ...additionalProps,
  };
}

describe('useMapInitialization', () => {
  describe('Node Aggregation Logic', () => {
    it('should process nodes with aggregation when siblings exist', () => {
      // Arrange - Create nodes with same aggregatedNodeId (siblings)
      const node1 = createMockNode('node1', 'agg1');
      const node2 = createMockNode('node2', 'agg1'); // Sibling of node1
      const node3 = createMockNode('node3', 'agg2'); // Different aggregate
      const nodes = [node1, node2, node3];
      const edges = [createMockEdge('edge1', 'parent', 'node1')];

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges));

      // Assert
      const processedNodes = result.current.nodes;

      // The first node in the collection should be marked as stacked
      const stackedNode = processedNodes.find((n) => n.id === 'node1');
      expect(stackedNode?.data.isStacked).toBe(true);

      // The sibling should be hidden
      const hiddenSibling = processedNodes.find((n) => n.id === 'node2');
      expect(hiddenSibling?.hidden).toBe(true);

      // Node with different aggregate should remain unchanged
      const unchangedNode = processedNodes.find((n) => n.id === 'node3');
      expect(unchangedNode?.data.isStacked).toBe(false);
      expect(unchangedNode?.hidden).toBe(false);
    });

    it('should skip aggregation for single-node collections', () => {
      // Arrange - Single node with aggregatedNodeId
      const node1 = createMockNode('node1', 'agg1');
      const nodes = [node1];
      const edges: CelestialEdge[] = [];

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges));

      // Assert - Node should remain unchanged since it has no siblings
      expect(result.current.nodes[0].data.isStacked).toBe(false);
      expect(result.current.nodes[0].hidden).toBe(false);
    });

    it('should preserve nodes without aggregation data', () => {
      // Arrange
      const node1 = createMockNode('node1'); // No aggregatedNodeId
      const node2 = createMockNode('node2', 'agg1');
      const nodes = [node1, node2];
      const edges: CelestialEdge[] = [];

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges));

      // Assert
      const preservedNode = result.current.nodes.find((n) => n.id === 'node1');
      expect(preservedNode).toEqual(node1);
    });

    it('should handle multiple aggregation groups', () => {
      // Arrange - Two groups of siblings
      const node1 = createMockNode('node1', 'agg1');
      const node2 = createMockNode('node2', 'agg1'); // Sibling of node1
      const node3 = createMockNode('node3', 'agg2');
      const node4 = createMockNode('node4', 'agg2'); // Sibling of node3
      const nodes = [node1, node2, node3, node4];
      const edges: CelestialEdge[] = [];

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges));

      // Assert
      const processedNodes = result.current.nodes;

      // Should have 4 stacked nodes (all nodes in both groups are marked as stacked)
      const stackedNodes = processedNodes.filter((n) => n.data.isStacked);
      expect(stackedNodes).toHaveLength(4);

      // Should have 2 hidden nodes (siblings)
      const hiddenNodes = processedNodes.filter((n) => n.hidden);
      expect(hiddenNodes).toHaveLength(2);

      // Should have 2 visible nodes (top-of-stack representatives)
      const visibleNodes = processedNodes.filter((n) => !n.hidden);
      expect(visibleNodes).toHaveLength(2);

      // Should have 2 top-of-stack nodes (representatives from each group)
      const topOfStackNodes = processedNodes.filter((n) => n.data.isTopOfTheStack);
      expect(topOfStackNodes).toHaveLength(2);
    });
  });

  describe('Edge Processing Logic', () => {
    it('should hide parent-to-sibling edges correctly', () => {
      // Arrange
      const parent = createMockNode('parent');
      const node1 = createMockNode('node1', 'agg1');
      const node2 = createMockNode('node2', 'agg1'); // Sibling
      const nodes = [parent, node1, node2];
      const parentToSiblingEdge = createMockEdge('edge1', 'parent', 'node2');
      const parentToStackEdge = createMockEdge('edge2', 'parent', 'node1');
      const edges = [parentToSiblingEdge, parentToStackEdge];

      // Act - Use a high topN to ensure all nodes are included
      const { result } = renderHook(() => useMapInitialization(nodes, edges, [], 20));

      // Assert
      const processedEdges = result.current.edges;
      const hiddenEdge = processedEdges.find((e) => e.id === 'edge1');
      const visibleEdge = processedEdges.find((e) => e.id === 'edge2');

      expect(hiddenEdge?.hidden).toBe(true);
      expect(visibleEdge?.hidden).toBe(false);
    });

    it('should rewire incoming edges from non-parents to stack top', () => {
      // Arrange
      const node1 = createMockNode('node1', 'agg1');
      const node2 = createMockNode('node2', 'agg1'); // Sibling
      const nodes = [node1, node2];
      const externalToSiblingEdge = createMockEdge('edge1', 'external', 'node2');
      const edges = [externalToSiblingEdge];

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges));

      // Assert
      const rewiredEdge = result.current.edges.find((e) => e.id === 'edge1');
      expect(rewiredEdge?.target).toBe('node1'); // Rewired to stack top
      expect(rewiredEdge?.data?.original).toBeDefined();
      expect(rewiredEdge?.hidden).toBe(false);
    });

    it('should hide sibling-to-child edges to avoid duplicates', () => {
      // Arrange
      const node1 = createMockNode('node1', 'agg1');
      const node2 = createMockNode('node2', 'agg1'); // Sibling
      const child = createMockNode('child');
      const nodes = [node1, node2, child];
      const siblingToChildEdge = createMockEdge('edge1', 'node2', 'child');
      const stackToChildEdge = createMockEdge('edge2', 'node1', 'child');
      const edges = [siblingToChildEdge, stackToChildEdge];

      // Act - Use a high topN to ensure all nodes are included
      const { result } = renderHook(() => useMapInitialization(nodes, edges, [], 20));

      // Assert
      const hiddenEdge = result.current.edges.find((e) => e.id === 'edge1');
      const visibleEdge = result.current.edges.find((e) => e.id === 'edge2');

      expect(hiddenEdge?.hidden).toBe(true);
      expect(visibleEdge?.hidden).toBe(false);
    });

    it('should rewire outgoing edges from siblings to external targets', () => {
      // Arrange
      const node1 = createMockNode('node1', 'agg1');
      const node2 = createMockNode('node2', 'agg1'); // Sibling
      const nodes = [node1, node2];
      const siblingToExternalEdge = createMockEdge('edge1', 'node2', 'external');
      const edges = [siblingToExternalEdge];

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges));

      // Assert
      const rewiredEdge = result.current.edges.find((e) => e.id === 'edge1');
      expect(rewiredEdge?.source).toBe('node1'); // Rewired from stack top
      expect(rewiredEdge?.data?.original).toBeDefined();
      expect(rewiredEdge?.hidden).toBe(false);
    });

    it('should handle complex edge rewiring scenarios', () => {
      // Arrange - Complex scenario with parent, siblings, children, and external nodes
      const parent = createMockNode('parent');
      const node1 = createMockNode('node1', 'agg1');
      const node2 = createMockNode('node2', 'agg1'); // Sibling
      const child = createMockNode('child');
      const external = createMockNode('external');
      const nodes = [parent, node1, node2, child, external];

      const edges = [
        createMockEdge('parent-to-node1', 'parent', 'node1'),
        createMockEdge('parent-to-node2', 'parent', 'node2'), // Should be hidden
        createMockEdge('node1-to-child', 'node1', 'child'),
        createMockEdge('node2-to-child', 'node2', 'child'), // Should be hidden
        createMockEdge('external-to-node2', 'external', 'node2'), // Should be rewired
        createMockEdge('node2-to-external', 'node2', 'external'), // Should be rewired
      ];

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges));

      // Assert
      const processedEdges = result.current.edges;

      // Parent to sibling should be hidden
      expect(processedEdges.find((e) => e.id === 'parent-to-node2')?.hidden).toBe(true);

      // Sibling to child should be hidden
      expect(processedEdges.find((e) => e.id === 'node2-to-child')?.hidden).toBe(true);

      // External to sibling should be rewired to stack top
      const externalToSibling = processedEdges.find((e) => e.id === 'external-to-node2');
      expect(externalToSibling?.target).toBe('node1');

      // Sibling to external should be rewired from stack top
      const siblingToExternal = processedEdges.find((e) => e.id === 'node2-to-external');
      expect(siblingToExternal?.source).toBe('node1');
    });

    it('should rewire multiple incoming edges to the same stack representative', () => {
      // Arrange - Test scenario: A->B, C->F, D->F, E->F where B and F are siblings
      // When B and F are stacked, A,C,D,E should all point to the node on top of the stack
      const nodeA = createMockNode('A');
      const nodeB = createMockNode('B', 'stack1');
      const nodeC = createMockNode('C');
      const nodeD = createMockNode('D');
      const nodeE = createMockNode('E');
      const nodeF = createMockNode('F', 'stack1'); // Sibling of B
      const nodes = [nodeA, nodeB, nodeC, nodeD, nodeE, nodeF];

      const edges = [
        createMockEdge('A-to-B', 'A', 'B'),
        createMockEdge('C-to-F', 'C', 'F'),
        createMockEdge('D-to-F', 'D', 'F'),
        createMockEdge('E-to-F', 'E', 'F'),
      ];

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges));

      // Assert
      const processedNodes = result.current.nodes;
      const processedEdges = result.current.edges;

      // B should be the stack representative (first in collection)
      const stackTop = processedNodes.find((n) => n.id === 'B');
      expect(stackTop?.data.isStacked).toBe(true);
      expect(stackTop?.hidden).toBe(false);

      // F should be hidden as a sibling
      const hiddenSibling = processedNodes.find((n) => n.id === 'F');
      expect(hiddenSibling?.hidden).toBe(true);

      // All external nodes (A, C, D, E) should have their edges pointing to B
      const visibleEdges = processedEdges.filter((e) => !e.hidden);
      const incomingEdges = visibleEdges.filter((e) => ['A', 'C', 'D', 'E'].includes(e.source));

      // All incoming edges should target the stack representative (B)
      expect(incomingEdges).toHaveLength(4);
      incomingEdges.forEach((edge) => {
        expect(edge.target).toBe('B');
      });

      // Verify specific edge rewiring
      const edgeFromA = processedEdges.find((e) => e.id === 'A-to-B');
      const edgeFromC = processedEdges.find((e) => e.id === 'C-to-F');
      const edgeFromD = processedEdges.find((e) => e.id === 'D-to-F');
      const edgeFromE = processedEdges.find((e) => e.id === 'E-to-F');

      // A->B should remain unchanged (already points to stack top)
      expect(edgeFromA?.target).toBe('B');
      expect(edgeFromA?.data?.original).toBeUndefined();

      // C->F, D->F, E->F should all be rewired to point to B
      expect(edgeFromC?.target).toBe('B');
      expect(edgeFromC?.data?.original).toBeDefined();
      expect(edgeFromD?.target).toBe('B');
      expect(edgeFromD?.data?.original).toBeDefined();
      expect(edgeFromE?.target).toBe('B');
      expect(edgeFromE?.data?.original).toBeDefined();
    });

    it('should consolidate multiple external connections to large sibling groups', () => {
      // Arrange - Complex scenario: A->B,C,D and M->B,E,F where B,C,D,E,F all have same aggregateId
      // All edges to siblings are rewired to point to the stack top (no duplicate hiding)
      const nodeA = createMockNode('A');
      const nodeM = createMockNode('M');
      const nodeB = createMockNode('B', 'largeStack');
      const nodeC = createMockNode('C', 'largeStack');
      const nodeD = createMockNode('D', 'largeStack');
      const nodeE = createMockNode('E', 'largeStack');
      const nodeF = createMockNode('F', 'largeStack');
      const nodes = [nodeA, nodeM, nodeB, nodeC, nodeD, nodeE, nodeF];

      const edges = [
        createMockEdge('A-to-B', 'A', 'B'),
        createMockEdge('A-to-C', 'A', 'C'),
        createMockEdge('A-to-D', 'A', 'D'),
        createMockEdge('M-to-B', 'M', 'B'),
        createMockEdge('M-to-E', 'M', 'E'),
        createMockEdge('M-to-F', 'M', 'F'),
      ];

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges));

      // Assert
      const processedNodes = result.current.nodes;
      const processedEdges = result.current.edges;

      // B should be the stack representative (first in collection)
      const stackTop = processedNodes.find((n) => n.id === 'B');
      expect(stackTop?.data.isStacked).toBe(true);
      expect(stackTop?.hidden).toBe(false);

      // C, D, E, F should all be hidden as siblings
      const hiddenSiblings = processedNodes.filter((n) => ['C', 'D', 'E', 'F'].includes(n.id));
      expect(hiddenSiblings).toHaveLength(4);
      hiddenSiblings.forEach((sibling) => {
        expect(sibling.hidden).toBe(true);
      });

      // All visible edges should target the stack representative (B)
      const visibleEdges = processedEdges.filter((e) => !e.hidden);
      const incomingEdges = visibleEdges.filter((e) => ['A', 'M'].includes(e.source));

      // Should have 2 visible incoming edges others are hidden since they would be duplicate
      expect(incomingEdges).toHaveLength(2);
      incomingEdges.forEach((edge) => {
        expect(edge.target).toBe('B');
      });

      // Verify specific edge behaviors
      const edgeAtoB = processedEdges.find((e) => e.id === 'A-to-B');
      const edgeAtoC = processedEdges.find((e) => e.id === 'A-to-C');
      const edgeAtoD = processedEdges.find((e) => e.id === 'A-to-D');
      const edgeMtoB = processedEdges.find((e) => e.id === 'M-to-B');
      const edgeMtoE = processedEdges.find((e) => e.id === 'M-to-E');
      const edgeMtoF = processedEdges.find((e) => e.id === 'M-to-F');

      // Edges already pointing to stack top should remain unchanged
      expect(edgeAtoB?.target).toBe('B');
      expect(edgeAtoB?.data?.original).toBeUndefined();
      expect(edgeMtoB?.target).toBe('B');
      expect(edgeMtoB?.data?.original).toBeUndefined();

      // Since all A connections have same parent a B, and all M connection have parent as B
      // Then we can hide other edges (no need to rewire them since those would become duplicate)
      expect(edgeAtoC?.target).toBe('C');
      expect(edgeAtoC?.hidden).toBe(true);
      expect(edgeAtoC?.data?.original).toBeUndefined();
      expect(edgeAtoD?.target).toBe('D');
      expect(edgeAtoD?.hidden).toBe(true);
      expect(edgeAtoD?.data?.original).toBeUndefined();
      expect(edgeMtoE?.target).toBe('E');
      expect(edgeMtoE?.hidden).toBe(true);
      expect(edgeMtoE?.data?.original).toBeUndefined();
      expect(edgeMtoF?.target).toBe('F');
      expect(edgeMtoF?.hidden).toBe(true);
      expect(edgeMtoF?.data?.original).toBeUndefined();

      // Verify that external nodes A and M remain visible and unchanged
      const nodeAProcessed = processedNodes.find((n) => n.id === 'A');
      const nodeMProcessed = processedNodes.find((n) => n.id === 'M');
      expect(nodeAProcessed?.hidden).toBe(false);
      expect(nodeMProcessed?.hidden).toBe(false);
      expect(nodeAProcessed?.data.isStacked).toBe(false);
      expect(nodeMProcessed?.data.isStacked).toBe(false);
    });
  });

  describe('Focus Application Logic', () => {
    it('should fade non-focused nodes when focus is applied', () => {
      // Arrange
      const node1 = createMockNode('node1');
      const node2 = createMockNode('node2');
      const node3 = createMockNode('node3');
      const nodes = [node1, node2, node3];
      const edges: CelestialEdge[] = [];
      const nodesInFocus = [node1, node2]; // Focus on first two nodes

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges, nodesInFocus));

      // Assert
      const processedNodes = result.current.nodes;
      expect(processedNodes.find((n) => n.id === 'node1')?.data.isFaded).toBe(false);
      expect(processedNodes.find((n) => n.id === 'node2')?.data.isFaded).toBe(false);
      expect(processedNodes.find((n) => n.id === 'node3')?.data.isFaded).toBe(true);
    });

    it('should adjust edge opacity based on focus connections', () => {
      // Arrange
      const node1 = createMockNode('node1');
      const node2 = createMockNode('node2');
      const node3 = createMockNode('node3');
      const nodes = [node1, node2, node3];
      const focusedEdge = createMockEdge('edge1', 'node1', 'node2');
      const unfocusedEdge = createMockEdge('edge2', 'node2', 'node3');
      const edges = [focusedEdge, unfocusedEdge];
      const nodesInFocus = [node1]; // Only focus on node1

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges, nodesInFocus));

      // Assert
      const processedEdges = result.current.edges;
      const connectedEdge = processedEdges.find((e) => e.id === 'edge1');
      const disconnectedEdge = processedEdges.find((e) => e.id === 'edge2');

      expect(connectedEdge?.style?.opacity).toBe(1); // Connected to focused node
      expect(disconnectedEdge?.style?.opacity).toBe(0.3); // Not connected to focused node
    });

    it('should return unchanged data when no focus is provided', () => {
      // Arrange
      const nodes = [createMockNode('node1'), createMockNode('node2')];
      const edges = [createMockEdge('edge1', 'node1', 'node2')];

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges, []));

      // Assert
      expect(result.current.nodes).toEqual(nodes);
      expect(result.current.edges).toEqual(edges);
    });

    it('should handle edges connected to focused nodes on either end', () => {
      // Arrange
      const node1 = createMockNode('node1');
      const node2 = createMockNode('node2');
      const node3 = createMockNode('node3');
      const nodes = [node1, node2, node3];
      const edgeFromFocused = createMockEdge('edge1', 'node1', 'node3');
      const edgeToFocused = createMockEdge('edge2', 'node3', 'node2');
      const edges = [edgeFromFocused, edgeToFocused];
      const nodesInFocus = [node1, node2]; // Focus on node1 and node2

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges, nodesInFocus));

      // Assert
      const processedEdges = result.current.edges;
      expect(processedEdges.find((e) => e.id === 'edge1')?.style?.opacity).toBe(1);
      expect(processedEdges.find((e) => e.id === 'edge2')?.style?.opacity).toBe(1);
    });

    it('should combine aggregation and focus correctly', () => {
      // Arrange - Test both aggregation and focus together
      const node1 = createMockNode('node1', 'agg1');
      const node2 = createMockNode('node2', 'agg1'); // Sibling
      const node3 = createMockNode('node3');
      const nodes = [node1, node2, node3];
      const edges: CelestialEdge[] = [];
      const nodesInFocus = [node1]; // Focus on the stack top

      // Act
      const { result } = renderHook(() => useMapInitialization(nodes, edges, nodesInFocus));

      // Assert
      const processedNodes = result.current.nodes;

      // Stack top should be focused and stacked
      const stackTop = processedNodes.find((n) => n.id === 'node1');
      expect(stackTop?.data.isStacked).toBe(true);
      expect(stackTop?.data.isFaded).toBe(false);

      // Sibling should be hidden (aggregation takes precedence)
      const sibling = processedNodes.find((n) => n.id === 'node2');
      expect(sibling?.hidden).toBe(true);

      // Other node should be faded
      const otherNode = processedNodes.find((n) => n.id === 'node3');
      expect(otherNode?.data.isFaded).toBe(true);
    });
  });
});
