/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import type { CelestialEdge, CelestialMapModel, CelestialNode } from '../../types';
import type { CollapseContext } from '../utils/raw-graph-relationships.utils';
import {
  getAggregateIds,
  getAggregateSiblingsIds,
  getChildrenNodeIds,
  getNode,
  getNodeCollectionsForAggregateIds,
  getParentNodeIds,
} from '../utils/raw-graph-relationships.utils';
import { useTopNNodes } from './use-top-n-nodes.hook';

/**
 * Custom hook for initializing and processing celestial map data.
 *
 * This hook performs two main operations:
 * 1. Node aggregation - Groups related nodes and collapses siblings to reduce visual clutter
 * 2. Focus application - Highlights specific nodes while fading others for better visibility
 *
 * @param nodes - Array of celestial nodes to be processed
 * @param edges - Array of celestial edges connecting the nodes
 * @param nodesInFocus - Optional array of nodes to highlight (others will be faded)
 *
 * @returns Processed map model with transformed nodes and edges
 */
export const useMapInitialization = (
  nodes: CelestialNode[],
  edges: CelestialEdge[],
  nodesInFocus?: CelestialNode[],
  topN: number = 20
): CelestialMapModel => {
  const topNNodes = useTopNNodes({ nodes, edges, topN });
  return useMemo(() => {
    // First pass: Apply top N node filtering
    const topNMap = collapseAllExcept(
      nodes,
      edges,
      topNNodes.map((node) => node.id)
    );

    // Second pass: Apply node aggregation to collapse sibling nodes
    const stackedMap = applyNodeAggregation(topNMap.nodes, topNMap.edges);

    // Third pass: Apply focus highlighting to emphasize specific nodes
    return applyNodesFocus(stackedMap.nodes, stackedMap.edges, nodesInFocus ?? []);
  }, [nodes, edges, nodesInFocus, topNNodes]);
};

// function applyCollapseOutsideNodes(nodes: CelestialNode[], edges: CelestialEdge[]) {
//     const nodeIdToNodeMap = new Map(nodes.map((node) => [node.id, node]));

//     // Identify nodes that are not part of an aggregate context
//     const updatedNodes = nodes.map((node) => (node.data.isDirectService ? node : { ...node, hidden: true }));

//     const updateEdges = edges.map((edge) => {
//         if (
//             nodeIdToNodeMap.get(edge.source)?.data.isDirectService &&
//             nodeIdToNodeMap.get(edge.target)?.data.isDirectService
//         ) {
//             return edge;
//         }

//         return { ...edge, hidden: true, style: { ...edge.style, opacity: 0.1 } };
//     });

//     return { nodes: updatedNodes, edges: updateEdges };
// }

/**
 * Applies node aggregation logic to collapse sibling nodes that share the same aggregate ID.
 *
 * This function identifies groups of nodes that should be visually collapsed into a single
 * representative node to reduce visual complexity. Only collections with multiple nodes
 * are processed for aggregation.
 *
 * @param nodes - Array of celestial nodes to process
 * @param edges - Array of celestial edges to process
 * @returns Map model with aggregated nodes and updated edges
 */
function applyNodeAggregation(nodes: CelestialNode[], edges: CelestialEdge[]) {
  // Extract all unique aggregate IDs from nodes that have aggregation data
  const aggregateIds = getAggregateIds(nodes);

  // Group nodes by their aggregate IDs
  const nodeCollections: CelestialNode[][] = getNodeCollectionsForAggregateIds(aggregateIds, nodes);

  let map: CelestialMapModel = { nodes, edges };

  // Process each collection that has multiple nodes (siblings to collapse)
  nodeCollections
    .filter((collection) => collection.length > 1)
    .forEach((collection) => {
      // Use the first node in the collection as the top-of-stack node
      map = collapseNodesToStack(collection[0].id, map.nodes, map.edges);
    });

  return map;
}

/**
 * Applies focus highlighting to specific nodes while fading others.
 *
 * When nodes are provided for focus, this function:
 * - Marks non-focused nodes as faded
 * - Reduces opacity of edges not connected to focused nodes
 * - Maintains full visibility for focused nodes and their connections
 *
 * @param nodes - Array of celestial nodes to process
 * @param edges - Array of celestial edges to process
 * @param nodesInFocus - Optional array of nodes to highlight
 * @returns Map model with focus styling applied
 */
function applyNodesFocus(
  nodes: CelestialNode[],
  edges: CelestialEdge[],
  nodesInFocus?: CelestialNode[]
) {
  // Create a Set of focused node IDs for efficient lookup
  const filteredNodeIds = new Set(nodesInFocus?.map((node: CelestialNode) => node.id));

  // If no nodes are specified for focus, return the original data unchanged
  if (!nodesInFocus || nodesInFocus.length === 0) {
    return { nodes, edges };
  }

  // Update nodes to mark non-focused ones as faded
  const updatedNodes = nodes.map((node: CelestialNode) => ({
    ...node,
    data: {
      ...node.data,
      isFaded: !filteredNodeIds.has(node.id),
    },
  }));

  // Update edges to reduce opacity for those not connected to focused nodes
  const updatedEdges = edges.map((edge: CelestialEdge) => ({
    ...edge,
    style: {
      ...edge.style,
      // Full opacity if either source or target node is in focus, otherwise reduced opacity
      opacity: filteredNodeIds.has(edge.source) || filteredNodeIds.has(edge.target) ? 1 : 0.3,
    },
  }));

  return { nodes: updatedNodes, edges: updatedEdges };
}

/**
 * Processes nodes for stack collapse by hiding siblings and marking the top-of-stack node.
 *
 * @param nodes - Array of celestial nodes to process
 * @param context - Collapse context containing relationship information
 * @returns Array of processed nodes with stack modifications applied
 */
function processNodesForStack(nodes: CelestialNode[], context: CollapseContext): CelestialNode[] {
  return nodes.map((node: CelestialNode) => {
    // Hide all sibling nodes (same aggregate ID, different node ID)
    if (context.stackSiblingIds.includes(node.id)) {
      return {
        ...node,
        hidden: true,
        data: {
          ...node.data,
          isStacked: true,
        },
      };
    }

    // Mark the top-of-stack node as stacked to indicate it represents multiple nodes
    if (node.id === context.topOfStackNodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          isStacked: true,
          isTopOfTheStack: true,
        },
      };
    }

    return node;
  });
}

/**
 * Hides edges from shared parents to sibling nodes (keeps only parent -> top-of-stack).
 *
 * @param edge - The edge to potentially modify
 * @param context - Collapse context containing relationship information
 * @returns Modified edge or original edge if no changes needed
 */
function hideParentToSiblingEdges(edge: CelestialEdge, context: CollapseContext): CelestialEdge {
  if (context.parentIds.includes(edge.source) && context.stackSiblingIds.includes(edge.target)) {
    return { ...edge, hidden: true };
  }
  return edge;
}

/**
 * Rewires incoming edges from non-parents to point to the top-of-stack node.
 *
 * @param edge - The edge to potentially modify
 * @param context - Collapse context containing relationship information
 * @returns Modified edge or original edge if no changes needed
 */
function rewireIncomingEdgesToStackTop(
  edge: CelestialEdge,
  context: CollapseContext
): CelestialEdge {
  if (!context.parentIds.includes(edge.source) && context.stackSiblingIds.includes(edge.target)) {
    return {
      ...edge,
      target: context.topOfStackNodeId,
      hidden: false,
      data: { original: { ...edge } },
    };
  }
  return edge;
}

/**
 * Hides edges from stack siblings to the top-of-stack node's children (avoids duplicate connections).
 *
 * @param edge - The edge to potentially modify
 * @param context - Collapse context containing relationship information
 * @returns Modified edge or original edge if no changes needed
 */
function hideStackSiblingToChildEdges(
  edge: CelestialEdge,
  context: CollapseContext
): CelestialEdge {
  if (context.stackSiblingIds.includes(edge.source) && context.childrenIds.includes(edge.target)) {
    return { ...edge, hidden: true };
  }
  return edge;
}

/**
 * Rewires outgoing edges from stack siblings to use the top-of-stack node as source.
 *
 * @param edge - The edge to potentially modify
 * @param context - Collapse context containing relationship information
 * @returns Modified edge or original edge if no changes needed
 */
function rewireOutgoingEdgesFromStackTop(
  edge: CelestialEdge,
  context: CollapseContext
): CelestialEdge {
  if (context.stackSiblingIds.includes(edge.source) && !context.childrenIds.includes(edge.target)) {
    return {
      ...edge,
      source: context.topOfStackNodeId,
      hidden: false,
      data: { original: { ...edge } },
    };
  }
  return edge;
}

/**
 * Processes edges for stack collapse by applying all edge transformation rules.
 *
 * @param edges - Array of celestial edges to process
 * @param context - Collapse context containing relationship information
 * @returns Array of processed edges with stack modifications applied
 */
function processEdgesForStack(edges: CelestialEdge[], context: CollapseContext): CelestialEdge[] {
  return edges.map((edge) => {
    // Apply each edge transformation rule in sequence
    let processedEdge = hideParentToSiblingEdges(edge, context);
    processedEdge = rewireIncomingEdgesToStackTop(processedEdge, context);
    processedEdge = hideStackSiblingToChildEdges(processedEdge, context);
    processedEdge = rewireOutgoingEdgesFromStackTop(processedEdge, context);

    return processedEdge;
  });
}

/**
 * Collapses sibling nodes into a single stack with the specified node as the top-of-stack.
 *
 * This function performs the core aggregation logic by:
 * 1. Hiding all sibling nodes (nodes with the same aggregate ID)
 * 2. Marking the top-of-stack node as "stacked" to indicate it represents multiple nodes
 * 3. Rewiring edges to maintain proper connectivity through the top-of-stack node
 * 4. Preserving original edge data for potential restoration
 *
 * Edge rewiring logic:
 * - Hides edges between parents and hidden siblings
 * - Redirects incoming edges from other parents to the top-of-stack node
 * - Hides edges from siblings to the top-of-stack node's children
 * - Redirects outgoing edges from siblings to use the top-of-stack node as source
 *
 * @param topOfStackNodeId - The ID of the node to use as the top-of-stack (visible) node
 * @param nodes - Array of celestial nodes to process
 * @param edges - Array of celestial edges to process
 * @returns Map model with collapsed stack and rewired edges
 */
function collapseNodesToStack(
  topOfStackNodeId: string,
  nodes: CelestialNode[],
  edges: CelestialEdge[]
): CelestialMapModel {
  const node = getNode(topOfStackNodeId, nodes);

  // Early return if the top-of-stack node doesn't exist
  if (!node) return { nodes, edges };

  // Create context with all relationship information needed for stack operations
  const context: CollapseContext = {
    topOfStackNodeId,
    stackSiblingIds: getAggregateSiblingsIds(topOfStackNodeId, nodes),
    parentIds: getParentNodeIds(topOfStackNodeId, edges),
    childrenIds: getChildrenNodeIds(topOfStackNodeId, edges),
  };

  // Process nodes and edges using the extracted functions
  const updatedNodes = processNodesForStack(nodes, context);
  const updatedEdges = processEdgesForStack(edges, context);

  return {
    nodes: updatedNodes,
    edges: updatedEdges,
  };
}

function collapseAllExcept(
  nodes: CelestialNode[],
  edges: CelestialEdge[],
  doNotCollapseIds: string[]
): CelestialMapModel {
  const doNoCollapseList = new Set(doNotCollapseIds);

  const updatedNodes = nodes.map((node) =>
    doNoCollapseList.has(node.id) ? node : { ...node, hidden: true }
  );
  const updatedEdges = edges.map((edge) => {
    if (doNoCollapseList.has(edge.source) && doNoCollapseList.has(edge.target)) {
      return edge;
    }

    return { ...edge, hidden: true };
  });

  return { nodes: updatedNodes, edges: updatedEdges };
}
