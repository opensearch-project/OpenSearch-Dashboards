/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isNil } from 'ramda';
import { useMemo } from 'react';
import { CelestialEdges, CelestialNodes } from 'src/types';

export interface UseTopNNodesProps {
  nodes: CelestialNodes;
  edges: CelestialEdges;
  topN: number;
}

/**
 * Custom hook that selects the top N nodes from a celestial map using topological traversal.
 *
 * The algorithm prioritizes nodes based on their position in the dependency graph:
 * 1. First, selects nodes with no incoming edges (root nodes)
 * 2. Then traverses their immediate children level by level
 * 3. Continues until topN nodes are selected
 *
 * This ensures that the most "upstream" nodes in the dependency chain are prioritized,
 * providing better visibility into the root causes of issues in the system.
 *
 * @param props - Configuration object containing nodes, edges, and topN limit
 * @param props.nodes - Array of CelestialNode objects to process
 * @param props.edges - Array of CelestialEdge objects representing connections
 * @param props.topN - Maximum number of nodes to return
 * @returns Object containing the selected nodes, remaining count, and root nodes
 *
 * @example
 * ```typescript
 * const { topNNodes, remainingCount, rootNodes } = useTopNNodes({
 *   nodes: celestialNodes,
 *   edges: celestialEdges,
 *   topN: 20
 * });
 * ```
 */
export const useTopNNodes = ({ nodes, edges, topN }: UseTopNNodesProps): CelestialNodes => {
  return useMemo(() => {
    if (nodes.length === 0 || nodes.length <= topN || topN <= 0) {
      return [...nodes];
    }

    // Build adjacency maps for efficient traversal
    const outgoingEdgesMap = buildOutgoingEdgesMap(nodes, edges);

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = findRootNodes(nodes, edges);

    // Aggregated root nodes are always canaries
    const canaryAggregatedNodeIds = new Set<string>();
    const uniqueRootNodeIds = new Set<string>();
    rootNodes.forEach((node) => {
      if (!isNil(node.data?.aggregatedNodeId)) {
        canaryAggregatedNodeIds.add(node.data.aggregatedNodeId);
        uniqueRootNodeIds.add(node.data.aggregatedNodeId);
      } else {
        uniqueRootNodeIds.add(node.id);
      }
    });
    const updatedTopN = Math.max(topN, uniqueRootNodeIds.size + canaryAggregatedNodeIds.size);

    // Perform breadth-first traversal starting from root nodes
    const selectedNodes = performTopologicalTraversal(
      rootNodes,
      outgoingEdgesMap,
      nodes,
      updatedTopN
    );

    return selectedNodes;
  }, [nodes, edges, topN]);
};

/**
 * Builds a map of outgoing edges for each node
 */
function buildOutgoingEdgesMap(
  nodes: CelestialNodes,
  edges: CelestialEdges
): Map<string, CelestialEdges> {
  const outgoingEdgesMap = new Map<string, CelestialEdges>();

  // Initialize map with empty arrays for all nodes
  nodes.forEach((node) => {
    outgoingEdgesMap.set(node.id, []);
  });

  // Populate outgoing edges
  edges.forEach((edge) => {
    const sourceEdges = outgoingEdgesMap.get(edge.source);
    if (sourceEdges) {
      sourceEdges.push(edge);
    }
  });

  return outgoingEdgesMap;
}

/**
 * Finds nodes that have no incoming edges (root nodes)
 */
function findRootNodes(nodes: CelestialNodes, edges: CelestialEdges): CelestialNodes {
  const nodesWithIncomingEdges = new Set<string>();

  // Mark all nodes that have incoming edges
  edges.forEach((edge) => {
    nodesWithIncomingEdges.add(edge.target);
  });

  // Return nodes that don't have incoming edges
  return nodes.filter((node) => !nodesWithIncomingEdges.has(node.id));
}

/**
 * Performs breadth-first traversal starting from root nodes
 */
function performTopologicalTraversal(
  rootNodes: CelestialNodes,
  outgoingEdgesMap: Map<string, CelestialEdges>,
  allNodes: CelestialNodes,
  topN: number
): CelestialNodes {
  const selectedNodes: CelestialNodes = [];
  const visited = new Set<string>();
  const queue: string[] = [];

  // Create a map for quick node lookup
  const nodeMap = new Map<string, CelestialNodes[0]>();
  allNodes.forEach((node) => {
    nodeMap.set(node.id, node);
  });

  // Start with root nodes
  rootNodes.forEach((node) => {
    if (
      !visited.has(node.id) &&
      (isNil(node.data?.aggregatedNodeId) || !visited.has(node.data?.aggregatedNodeId))
    ) {
      selectedNodes.push(node);
      if (!isNil(node.data?.aggregatedNodeId)) {
        visited.add(node.data?.aggregatedNodeId);
      } else {
        visited.add(node.id);
      }
      queue.push(node.id);
    }
  });

  // Breadth-first traversal
  while (queue.length > 0 && selectedNodes.length < topN) {
    const currentNodeId = queue.shift()!;
    const outgoingEdges = outgoingEdgesMap.get(currentNodeId) ?? [];

    // Add children to queue and selected nodes
    outgoingEdges.forEach((edge) => {
      const childNode = nodeMap.get(edge.target);
      if (childNode && !visited.has(edge.target) && selectedNodes.length < topN) {
        selectedNodes.push(childNode);
        visited.add(edge.target);
        queue.push(edge.target);
      }
    });
  }

  // Add all nodes where node.data.aggregatedNodeId is already in selectedNodes
  const selectedAggregatedNodeIds = new Set<string>();
  selectedNodes.forEach((node) => {
    if (!isNil(node.data?.aggregatedNodeId)) {
      selectedAggregatedNodeIds.add(node.data.aggregatedNodeId);
    }
  });

  allNodes.forEach((node) => {
    if (
      !isNil(node.data?.aggregatedNodeId) &&
      selectedAggregatedNodeIds.has(node.data.aggregatedNodeId) &&
      !selectedNodes.some((selectedNode) => selectedNode.id === node.id)
    ) {
      selectedNodes.push(node);
    }
  });

  return selectedNodes;
}
