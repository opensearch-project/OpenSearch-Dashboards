/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import { useNodeRelationships, Visibility } from './use_node_relationships.hook';

/**
 * Custom hook for managing node clustering states in React Flow diagrams
 *
 * This hook provides utilities to determine various clustering states of nodes:
 * - Stacking: Visual grouping of sibling nodes
 * - Collapsing/Expanding: Hiding/showing child node hierarchies
 * - State transitions: Determining what actions are available for each node
 *
 * The hook works with the node relationship system to understand:
 * - Which nodes can be stacked together (siblings)
 * - Which nodes have expandable/collapsible children
 * - Current visibility states of related nodes
 *
 * @returns Object containing state checking functions for different clustering operations
 */
export const useNodeClustering = () => {
  // React Flow hook for accessing node data
  const { getNode } = useReactFlow();

  // Node relationships hook for understanding node hierarchies and connections
  const {
    hasOutgoingEdges,
    getAggregateSiblingsCount,
    hasAggregateSiblings,
    getChildrenNodes,
    hasChildren,
  } = useNodeRelationships();

  /**
   * Determines if a node is currently in a stacked state
   *
   * A node is considered stacked when:
   * - It's marked as stacked in its data
   * - It's the top node of a stack (visible representative)
   * - It has hidden aggregate siblings (other nodes in the stack)
   *
   * @param nodeId - The ID of the node to check
   * @returns True if the node is currently stacked with hidden siblings
   */
  const isStacked = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);

      if (!node) return false;

      // Node must be marked as stacked and be the top of the stack
      if (node.data.isStacked && node.data.isTopOfTheStack) {
        return hasAggregateSiblings(nodeId, Visibility.Hidden);
      }

      return false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getNode, getAggregateSiblingsCount]
  );

  /**
   * Determines if a node can be stacked (collapsed with its siblings)
   *
   * A node is stackable when:
   * - It's not already the top of a stack
   * - It has visible aggregate siblings that can be grouped together
   *
   * @param nodeId - The ID of the node to check
   * @returns True if the node can be stacked with its siblings
   */
  const isStackable = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);

      if (!node) return false;

      // Node can be stacked if it's not already top of stack and has visible siblings
      return !node.data.isTopOfTheStack && hasAggregateSiblings(nodeId, Visibility.Visible);
    },
    [hasAggregateSiblings, getNode]
  );

  /**
   * Determines if a node is in a collapsed state
   *
   * A node is collapsed when:
   * - It has no visible outgoing edges (children are hidden)
   * - But it does have hidden outgoing edges (children exist but are not shown)
   *
   * @param nodeId - The ID of the node to check
   * @returns True if the node has hidden children (is collapsed)
   */
  const isCollapsed = useCallback(
    (nodeId: string) => {
      // If node has visible edges, it's not collapsed
      if (hasOutgoingEdges(nodeId, Visibility.Visible)) return false;

      // Node is collapsed if it has hidden edges (hidden children)
      return hasOutgoingEdges(nodeId, Visibility.Hidden);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasOutgoingEdges, hasChildren, getChildrenNodes]
  );

  /**
   * Determines if a node is in an expanded state
   *
   * A node is expanded when:
   * - It has visible outgoing edges (some children are shown)
   * - If it has hidden children, they must all be stacked (not individually collapsed)
   *
   * @param nodeId - The ID of the node to check
   * @returns True if the node is showing its children in an expanded state
   */
  const isExpanded = useCallback(
    (nodeId: string) => {
      // Must have visible edges to be considered expanded
      if (!hasOutgoingEdges(nodeId, Visibility.Visible)) return false;

      // If there are hidden children, they must all be stacked (not individually collapsed)
      if (hasChildren(nodeId, Visibility.Hidden)) {
        return getChildrenNodes(nodeId, Visibility.Hidden).every((n) => n.data.isStacked);
      }

      // If all children are visible, node is expanded
      return true;
    },
    [hasOutgoingEdges, hasChildren, getChildrenNodes]
  );

  /**
   * Determines if a node can be expanded (has hidden children to show)
   *
   * A node is expandable when it has hidden outgoing edges,
   * meaning there are child nodes that could be revealed.
   *
   * @param nodeId - The ID of the node to check
   * @returns True if the node has hidden children that can be expanded
   */
  const isExpandable = useCallback(
    (nodeId: string) => {
      return hasOutgoingEdges(nodeId, Visibility.Hidden);
    },
    [hasOutgoingEdges]
  );

  /**
   * Determines if a node can be collapsed (has visible children to hide)
   *
   * A node is collapsable when it has visible outgoing edges,
   * meaning there are child nodes that could be hidden.
   *
   * @param nodeId - The ID of the node to check
   * @returns True if the node has visible children that can be collapsed
   */
  const isCollapsable = useCallback(
    (nodeId: string) => {
      return hasOutgoingEdges(nodeId, Visibility.Visible);
    },
    [hasOutgoingEdges]
  );

  // Return all clustering state functions
  return {
    isStacked,
    isStackable,
    isCollapsed,
    isCollapsable,
    isExpanded,
    isExpandable,
  };
};
