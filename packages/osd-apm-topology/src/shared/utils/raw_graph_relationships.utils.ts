/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CelestialEdge, CelestialNode } from '../../types';

/**
 * Raw Graph Relationships Utilities
 *
 * ⚠️  **Important Usage Guidelines:**
 *
 * These utilities are designed for use **BEFORE** the map is initialized with React Flow's
 * storage system. They work with raw array data structures and basic filtering operations.
 *
 * **When to use these utilities:**
 * - During map initialization/preprocessing phase
 * - Before React Flow instance is available
 * - When working with raw CelestialNode[] and CelestialEdge[] arrays
 *
 * **When to use `use-node-relationship.hook.ts` instead:**
 * - After React Flow is initialized and available
 * - For optimal performance with React Flow's internal data structures
 * - When you need advanced features like visibility filtering
 * - For post-initialization graph operations
 *
 * The `use-node-relationship.hook.ts` provides more optimal implementations using React Flow's
 * built-in utilities (getIncomers, getOutgoers, useReactFlow) and should be preferred
 * whenever possible.
 *
 * @fileoverview Graph relationship utilities for raw data before React Flow initialization
 */

/**
 * Context object containing all the relationship information needed for stack collapse operations.
 */
export interface CollapseContext {
  /** The ID of the node that will remain visible (top of the stack) */
  topOfStackNodeId: string;
  /** Array of sibling node IDs that will be hidden in the stack */
  stackSiblingIds: string[];
  /** Array of parent node IDs connected to the top-of-stack node */
  parentIds: string[];
  /** Array of child node IDs connected to the top-of-stack node */
  childrenIds: string[];
}

/**
 * Finds a node by its ID in the provided nodes array.
 *
 * @param nodeId - The unique identifier of the node to find
 * @param nodes - Array of celestial nodes to search through
 * @returns The matching node or undefined if not found
 */
export function getNode(nodeId: string, nodes: CelestialNode[]): CelestialNode | undefined {
  return nodes.find((n) => n.id === nodeId);
}

/**
 * Extracts all unique aggregate IDs from nodes that have aggregation data.
 *
 * @param nodes - Array of celestial nodes to process
 * @returns Array of unique aggregate IDs
 */
export function getAggregateIds(nodes: CelestialNode[]): string[] {
  const aggregatedIds = nodes
    .filter((n) => !!n.data.aggregatedNodeId)
    .map((n) => n.data.aggregatedNodeId!);

  return Array.from(new Set(aggregatedIds));
}

/**
 * Filters nodes that belong to a specific aggregate ID.
 *
 * @param aggregatedId - The aggregate ID to filter by
 * @param nodes - Array of celestial nodes to filter
 * @returns Array of nodes that belong to the specified aggregate ID
 */
export function getNodesByAggregateId(aggregatedId: string, nodes: CelestialNode[]) {
  return nodes.filter((node) => node.data.aggregatedNodeId === aggregatedId);
}

/**
 * Groups nodes into collections based on their aggregate IDs.
 *
 * @param aggregateIds - Array of aggregate IDs to group by
 * @param nodes - Array of celestial nodes to group
 * @returns Array of node collections, each containing nodes with the same aggregate ID
 */
export function getNodeCollectionsForAggregateIds(
  aggregateIds: string[],
  nodes: CelestialNode[]
): CelestialNode[][] {
  return aggregateIds.map((aggregatedId) => getNodesByAggregateId(aggregatedId, nodes));
}

/**
 * Finds all sibling node IDs for a given node (nodes with the same aggregate ID).
 *
 * @param nodeId - The ID of the node to find siblings for
 * @param nodes - Array of celestial nodes to search through
 * @returns Array of sibling node IDs (excluding the original node)
 */
export function getAggregateSiblingsIds(nodeId: string, nodes: CelestialNode[]): string[] {
  const node = getNode(nodeId, nodes);

  if (!node) return [];

  return nodes
    .filter((n) => n.data.aggregatedNodeId === node.data.aggregatedNodeId && n.id !== nodeId)
    .map((n) => n.id);
}

/**
 * Finds all parent node IDs for a given node by examining incoming edges.
 *
 * @param nodeId - The ID of the node to find parents for
 * @param edges - Array of celestial edges to search through
 * @returns Array of parent node IDs
 */
export function getParentNodeIds(nodeId: string, edges: CelestialEdge[]): string[] {
  return edges.filter((e) => e.target === nodeId).map((e) => e.source);
}

/**
 * Finds all child node IDs for a given node by examining outgoing edges.
 *
 * @param nodeId - The ID of the node to find children for
 * @param edges - Array of celestial edges to search through
 * @returns Array of child node IDs
 */
export function getChildrenNodeIds(nodeId: string, edges: CelestialEdge[]): string[] {
  return edges.filter((e) => e.source === nodeId).map((e) => e.target);
}
