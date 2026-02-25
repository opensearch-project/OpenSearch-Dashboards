/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Edge, useReactFlow } from '@xyflow/react';
import { useCallback, useMemo } from 'react';
import { useNodeRelationships } from '../../shared/hooks/use_node_relationships.hook';
import { useCollapseSiblings } from '../../shared/strategies/use_collapse_siblings.hook';
import { useExpandSiblings } from '../../shared/strategies/use_expand_siblings.hook';
import { useExpandChildren } from '../../shared/strategies/use_expand_children.hook';
import { useCollapseDescendants } from '../../shared/strategies/use_collapse_descendants.hook';

/**
 * Custom hook that provides context menu actions for node manipulation
 *
 * This hook encapsulates the logic for various node operations that can be triggered
 * from context menus or action buttons. It handles:
 * - Expanding/collapsing sibling nodes (stacking/unstacking)
 * - Expanding children nodes (showing hidden descendants)
 * - Collapsing descendant nodes (hiding child hierarchies)
 *
 * All actions update the React Flow state and optionally close the context menu.
 *
 * @param nodeId - The ID of the node these actions will operate on
 * @param onClose - Optional callback to close the context menu after action execution
 * @returns Object containing all available action handlers
 */
export const useContextMenuActions = (nodeId: string, onClose?: () => void) => {
  // React Flow state setters for updating nodes and edges
  const { setNodes, setEdges } = useReactFlow();

  // Hook for checking node relationship properties
  const { isAggregateNode } = useNodeRelationships();

  // Strategy hooks for different node manipulation operations
  const applyCollapseSiblings = useCollapseSiblings();
  const applyExpandSiblings = useExpandSiblings();
  const applyExpandChildren = useExpandChildren();
  const applyCollapseDescendants = useCollapseDescendants();

  /**
   * Expands sibling nodes (unstacking operation)
   *
   * This action reveals sibling nodes that were previously stacked/collapsed together.
   * Only works on aggregate nodes that have siblings to expand.
   *
   * @param event - Mouse event from the action trigger
   */
  const onExpandSiblings = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();

      // Only expand siblings if this is an aggregate node with siblings
      if (isAggregateNode(nodeId)) {
        const { nodes, edges } = applyExpandSiblings(nodeId);

        setNodes(nodes);
        setEdges(edges as Edge[]);
      }

      onClose?.();
    },
    [nodeId, onClose, applyExpandSiblings, setNodes, setEdges, isAggregateNode]
  );

  /**
   * Collapses sibling nodes (stacking operation)
   *
   * This action groups sibling nodes together into a visual stack,
   * hiding individual siblings while maintaining their relationships.
   * Only works on aggregate nodes that have siblings to collapse.
   *
   * @param event - Mouse event from the action trigger
   */
  const onCollapseSiblings = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();

      // Only collapse siblings if this is an aggregate node with siblings
      if (isAggregateNode(nodeId)) {
        const { nodes, edges } = applyCollapseSiblings(nodeId);

        setNodes(nodes);
        setEdges(edges);
      }

      onClose?.();
    },
    [nodeId, onClose, applyCollapseSiblings, setNodes, setEdges, isAggregateNode]
  );

  /**
   * Expands child nodes
   *
   * This action reveals child nodes that were previously hidden/collapsed.
   * Shows the immediate children of the target node, making them visible
   * in the diagram along with their connecting edges.
   *
   * @param event - Mouse event from the action trigger
   */
  const onExpandChildren = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();

      // Apply the expand children strategy and update React Flow state
      const { nodes, edges } = applyExpandChildren(nodeId);

      setNodes(nodes);
      setEdges(edges);

      onClose?.();
    },
    [nodeId, applyExpandChildren, onClose, setNodes, setEdges]
  );

  /**
   * Collapses descendant nodes
   *
   * This action hides all descendant nodes (children, grandchildren, etc.)
   * of the target node, effectively collapsing the entire subtree.
   * Useful for simplifying complex hierarchical diagrams.
   *
   * @param event - Mouse event from the action trigger
   */
  const onCollapseDescendants = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();

      // Apply the collapse descendants strategy and update React Flow state
      const { nodes, edges } = applyCollapseDescendants(nodeId);

      setNodes(nodes);
      setEdges(edges);

      onClose?.();
    },
    [nodeId, applyCollapseDescendants, onClose, setNodes, setEdges]
  );

  // Memoize the returned object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      onExpandSiblings,
      onCollapseSiblings,
      onExpandChildren,
      onCollapseDescendants,
    }),
    [onExpandSiblings, onCollapseSiblings, onExpandChildren, onCollapseDescendants]
  );
};
