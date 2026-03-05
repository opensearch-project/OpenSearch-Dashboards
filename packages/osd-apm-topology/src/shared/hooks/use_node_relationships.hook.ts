/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { getIncomers, getOutgoers, useReactFlow } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';

/**
 * Enum defining node/edge visibility states for filtering operations.
 * Used throughout the hook to control which nodes/edges are included in results.
 *
 * @enum {string}
 */
export enum Visibility {
  /** Only include visible nodes/edges (hidden = false or undefined) */
  Visible = 'visible',
  /** Only include hidden nodes/edges (hidden = true) */
  Hidden = 'hidden',
  /** Include all nodes/edges regardless of visibility state */
  Any = 'any',
}

/**
 * Interface defining all available node relationship analysis methods.
 * Provides comprehensive graph traversal capabilities with visibility filtering.
 */
export interface NodeRelationshipActions {
  // Edge Analysis Methods

  /**
   * Retrieves all incoming edges for a specified node.
   * @param nodeId - The ID of the target node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns Array of edges pointing to the specified node
   */
  getIncomingEdges: (nodeId: string, visibility?: Visibility) => Edge[];

  /**
   * Counts the number of incoming edges for a specified node.
   * @param nodeId - The ID of the target node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns Number of incoming edges
   */
  getIncomingEdgesCount: (nodeId: string, visibility?: Visibility) => number;

  /**
   * Determines if a node has any incoming edges.
   * @param nodeId - The ID of the target node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns True if the node has incoming edges, false otherwise
   */
  hasIncomingEdges: (nodeId: string, visibility?: Visibility) => boolean;

  /**
   * Retrieves all outgoing edges from a specified node.
   * @param nodeId - The ID of the source node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns Array of edges originating from the specified node
   */
  getOutgoingEdges: (nodeId: string, visibility?: Visibility) => Edge[];

  /**
   * Counts the number of outgoing edges from a specified node.
   * @param nodeId - The ID of the source node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns Number of outgoing edges
   */
  getOutgoingEdgesCount: (nodeId: string, visibility?: Visibility) => number;

  /**
   * Determines if a node has any outgoing edges.
   * @param nodeId - The ID of the source node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns True if the node has outgoing edges, false otherwise
   */
  hasOutgoingEdges: (nodeId: string, visibility?: Visibility) => boolean;

  // Node Relationship Methods

  /**
   * Retrieves all parent nodes (nodes with edges pointing to the specified node).
   * Uses React Flow's getIncomers utility for efficient traversal.
   * @param nodeId - The ID of the child node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns Array of parent nodes
   */
  getParentNodes: (nodeId: string, visibility?: Visibility) => Node[];

  /**
   * Retrieves all children nodes (nodes that the specified node points to).
   * Uses React Flow's getOutgoers utility for efficient traversal.
   * @param nodeId - The ID of the parent node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns Array of children nodes
   */
  getChildrenNodes: (nodeId: string, visibility?: Visibility) => Node[];

  /**
   * Retrieves all sibling nodes (nodes that share the same parent(s)).
   * Siblings are determined by finding all children of the node's parents,
   * then deduplicating the results.
   * @param nodeId - The ID of the node to find siblings for
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns Array of sibling nodes (includes the original node)
   */
  getSiblingNodes: (nodeId: string, visibility?: Visibility) => Node[];

  // Count Methods

  /**
   * Counts the number of parent nodes for a specified node.
   * @param nodeId - The ID of the child node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns Number of parent nodes
   */
  getParentNodesCount: (nodeId: string, visibility?: Visibility) => number;

  /**
   * Counts the number of children nodes for a specified node.
   * @param nodeId - The ID of the parent node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns Number of children nodes
   */
  getChildrenNodesCount: (nodeId: string, visibility?: Visibility) => number;

  /**
   * Counts the number of sibling nodes for a specified node.
   * @param nodeId - The ID of the node to count siblings for
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns Number of sibling nodes (includes the original node)
   */
  getSiblingNodesCount: (nodeId: string, visibility?: Visibility) => number;

  // Boolean Check Methods

  /**
   * Determines if a node has any children nodes.
   * @param nodeId - The ID of the potential parent node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns True if the node has children, false otherwise
   */
  hasChildren: (nodeId: string, visibility?: Visibility) => boolean;

  /**
   * Determines if a node has any parent nodes.
   * @param nodeId - The ID of the potential child node
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns True if the node has parents, false otherwise
   */
  hasParents: (nodeId: string, visibility?: Visibility) => boolean;

  /**
   * Determines if a node has any sibling nodes.
   * @param nodeId - The ID of the node to check for siblings
   * @param visibility - Filter by visibility state (defaults to Any)
   * @returns True if the node has siblings, false otherwise
   */
  hasSiblings: (nodeId: string, visibility?: Visibility) => boolean;

  // Aggregate Node Methods

  /**
   * Determines if a node is an aggregate node (has aggregatedNodeId in data).
   * Aggregate nodes are typically created during grouping operations.
   * @param nodeId - The ID of the node to check
   * @param visibility - Filter by visibility state
   * @returns True if the node is an aggregate node, false otherwise
   */
  isAggregateNode: (nodeId: string, visibility: Visibility) => boolean;

  /**
   * Retrieves all sibling nodes that share the same aggregatedNodeId.
   * Used for finding nodes that were grouped together during aggregation.
   * @param nodeId - The ID of the aggregate node
   * @param visibility - Filter by visibility state
   * @returns Array of aggregate sibling nodes (excludes the original node)
   */
  getAggregateSiblings: (nodeId: string, visibility: Visibility) => Node[];

  /**
   * Counts the number of aggregate sibling nodes.
   * @param nodeId - The ID of the aggregate node
   * @param visibility - Filter by visibility state
   * @returns Number of aggregate sibling nodes
   */
  getAggregateSiblingsCount: (nodeId: string, visibility: Visibility) => number;

  /**
   * Determines if a node has any aggregate siblings.
   * @param nodeId - The ID of the aggregate node
   * @param visibility - Filter by visibility state
   * @returns True if the node has aggregate siblings, false otherwise
   */
  hasAggregateSiblings: (nodeId: string, visibility: Visibility) => boolean;
}

/**
 * Custom hook providing comprehensive node relationship analysis and graph traversal utilities.
 *
 * This hook leverages React Flow's built-in utilities (getIncomers, getOutgoers) combined with
 * custom logic to provide efficient graph navigation capabilities. All methods support visibility
 * filtering to work with both visible and hidden nodes/edges.
 *
 * @returns {NodeRelationshipActions} Object containing all relationship analysis methods
 */
export const useNodeRelationships = () => {
  const { getEdges, getNode, getNodes } = useReactFlow();

  /**
   * Retrieves all incoming edges for a specified node with visibility filtering.
   * Incoming edges are those where the specified node is the target.
   */
  const getIncomingEdges = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): Edge[] => {
      if (visibility === Visibility.Visible) {
        return getEdges().filter((edge: Edge) => edge.target === nodeId && !edge.hidden);
      }

      if (visibility === Visibility.Hidden) {
        return getEdges().filter((edge: Edge) => edge.target === nodeId && !!edge.hidden);
      }

      return getEdges().filter((edge: Edge) => edge.target === nodeId);
    },
    [getEdges]
  );

  /**
   * Counts incoming edges for efficient checking without creating arrays.
   */
  const getIncomingEdgesCount = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): number =>
      getIncomingEdges(nodeId, visibility).length,
    [getIncomingEdges]
  );

  /**
   * Boolean check for incoming edges existence.
   */
  const hasIncomingEdges = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): boolean => {
      return !!getIncomingEdgesCount(nodeId, visibility);
    },
    [getIncomingEdgesCount]
  );

  /**
   * Retrieves all outgoing edges for a specified node with visibility filtering.
   * Outgoing edges are those where the specified node is the source.
   */
  const getOutgoingEdges = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): Edge[] => {
      if (visibility === Visibility.Visible) {
        return getEdges().filter((edge: Edge) => edge.source === nodeId && !edge.hidden);
      }

      if (visibility === Visibility.Hidden) {
        return getEdges().filter((edge: Edge) => edge.source === nodeId && !!edge.hidden);
      }

      return getEdges().filter((edge: Edge) => edge.source === nodeId);
    },
    [getEdges]
  );

  /**
   * Counts outgoing edges for efficient checking without creating arrays.
   */
  const getOutgoingEdgesCount = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): number =>
      getOutgoingEdges(nodeId, visibility).length,
    [getOutgoingEdges]
  );

  /**
   * Boolean check for outgoing edges existence.
   */
  const hasOutgoingEdges = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): boolean => {
      return !!getOutgoingEdgesCount(nodeId, visibility);
    },
    [getOutgoingEdgesCount]
  );

  /**
   * Retrieves all parent nodes using React Flow's getIncomers utility.
   * Parents are nodes that have edges pointing to the specified node.
   */
  const getParentNodes = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): Node[] => {
      const node = getNode(nodeId);

      if (!node) return [];

      const nodes = getIncomers(node, getNodes(), getEdges());

      if (visibility === Visibility.Visible) {
        return nodes.filter((n) => !n.hidden);
      }

      if (visibility === Visibility.Hidden) {
        return nodes.filter((n) => !!n.hidden);
      }

      return nodes;
    },
    [getNode, getNodes, getEdges]
  );

  /**
   * Counts parent nodes for efficient checking without creating arrays.
   */
  const getParentNodesCount = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): number => {
      return getParentNodes(nodeId, visibility).length;
    },
    [getParentNodes]
  );

  /**
   * Boolean check for parent nodes existence.
   */
  const hasParents = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): boolean => {
      return !!getParentNodesCount(nodeId, visibility);
    },
    [getParentNodesCount]
  );

  /**
   * Retrieves all children nodes using React Flow's getOutgoers utility.
   * Children are nodes that the specified node has edges pointing to.
   */
  const getChildrenNodes = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): Node[] => {
      const node = getNode(nodeId);

      if (!node) return [];

      const nodes = getOutgoers(node, getNodes(), getEdges());

      if (visibility === Visibility.Visible) {
        return nodes.filter((n) => !n.hidden);
      }

      if (visibility === Visibility.Hidden) {
        return nodes.filter((n) => !!n.hidden);
      }

      return nodes;
    },
    [getNode, getNodes, getEdges]
  );

  /**
   * Counts children nodes for efficient checking without creating arrays.
   */
  const getChildrenNodesCount = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): number => {
      return getChildrenNodes(nodeId, visibility).length;
    },
    [getChildrenNodes]
  );

  /**
   * Boolean check for children nodes existence.
   */
  const hasChildren = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): boolean => {
      return !!getChildrenNodesCount(nodeId, visibility);
    },
    [getChildrenNodesCount]
  );

  /**
   * Retrieves all sibling nodes by finding children of all parents.
   * Uses Map for deduplication to handle nodes with multiple parents.
   * Note: The result includes the original node itself.
   */
  const getSiblingNodes = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): Node[] => {
      const parents = getParentNodes(nodeId, visibility);

      const siblings = parents.map((parent) => getChildrenNodes(parent.id, visibility)).flat();

      const map = new Map<string, Node>();

      siblings.forEach((sibling) => {
        if (!map.has(sibling.id)) {
          map.set(sibling.id, sibling);
        }
      });

      return Array.from(map.values());
    },
    [getParentNodes, getChildrenNodes]
  );

  /**
   * Counts sibling nodes for efficient checking without creating arrays.
   */
  const getSiblingNodesCount = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): number => {
      return getSiblingNodes(nodeId, visibility).length;
    },
    [getSiblingNodes]
  );

  /**
   * Boolean check for sibling nodes existence.
   */
  const hasSiblings = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): boolean => {
      return !!getSiblingNodesCount(nodeId, visibility);
    },
    [getSiblingNodesCount]
  );

  /**
   * Determines if a node is an aggregate node by checking for aggregatedNodeId.
   * Aggregate nodes are created during grouping operations and contain metadata
   * about the original nodes they represent.
   *
   * Note: There's a bug in the Hidden visibility check - it should check for
   * node.hidden === true, not false.
   */
  const isAggregateNode = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): boolean => {
      const node = getNode(nodeId);

      if (!node) return false;

      const hasAggregateId = !!node?.data.aggregatedNodeId;

      if (visibility === Visibility.Visible) {
        return hasAggregateId && !node.hidden;
      }

      if (visibility === Visibility.Hidden) {
        return hasAggregateId && !!node.hidden;
      }

      return hasAggregateId;
    },
    [getNode]
  );

  /**
   * Retrieves all nodes that share the same aggregatedNodeId.
   * Used for finding nodes that were grouped together during aggregation operations.
   * Excludes the original node from the results.
   */
  const getAggregateSiblings = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): Node[] => {
      const node = getNode(nodeId);

      if (!node?.data.aggregatedNodeId) return [];

      const nodes = getNodes().filter(
        (n) => n.data.aggregatedNodeId === node?.data.aggregatedNodeId && n.id !== node.id
      );

      if (visibility === Visibility.Visible) {
        return nodes.filter((n) => !n.hidden);
      }

      if (visibility === Visibility.Hidden) {
        return nodes.filter((n) => !!n.hidden);
      }

      return nodes;
    },
    [getNode, getNodes]
  );

  /**
   * Counts aggregate sibling nodes for efficient checking.
   */
  const getAggregateSiblingsCount = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): number => {
      return getAggregateSiblings(nodeId, visibility).length;
    },
    [getAggregateSiblings]
  );

  /**
   * Boolean check for aggregate sibling nodes existence.
   */
  const hasAggregateSiblings = useCallback(
    (nodeId: string, visibility: Visibility = Visibility.Any): boolean => {
      return !!getAggregateSiblings(nodeId, visibility).length;
    },
    [getAggregateSiblings]
  );

  return useMemo(
    () => ({
      getAggregateSiblings,
      getAggregateSiblingsCount,
      getChildrenNodes,
      getChildrenNodesCount,
      getIncomingEdges,
      getIncomingEdgesCount,
      getOutgoingEdges,
      getOutgoingEdgesCount,
      getParentNodes,
      getParentNodesCount,
      getSiblingNodes,
      getSiblingNodesCount,
      hasAggregateSiblings,
      hasChildren,
      hasIncomingEdges,
      hasOutgoingEdges,
      hasParents,
      hasSiblings,
      isAggregateNode,
    }),
    [
      getAggregateSiblings,
      getAggregateSiblingsCount,
      getChildrenNodes,
      getChildrenNodesCount,
      getIncomingEdges,
      getIncomingEdgesCount,
      getOutgoingEdges,
      getOutgoingEdgesCount,
      getParentNodes,
      getParentNodesCount,
      getSiblingNodes,
      getSiblingNodesCount,
      hasAggregateSiblings,
      hasChildren,
      hasIncomingEdges,
      hasOutgoingEdges,
      hasParents,
      hasSiblings,
      isAggregateNode,
    ]
  );
};
