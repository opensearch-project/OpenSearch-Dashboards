/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { AWS_SERVICE_NODE_TYPE } from '../constants/common.constants';
import type { TopologyNode, TopologyEdge } from '../types/sdk.types';

interface GridConfig {
  nodesPerRow: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  startX: number;
  startY: number;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  nodesPerRow: 5,
  horizontalSpacing: 300,
  verticalSpacing: 100,
  startX: 0,
  startY: 0,
};

export const calculatePosition = (index: number, config: GridConfig) => ({
  x: config.startX + (index % config.nodesPerRow) * config.horizontalSpacing,
  y: config.startY + Math.floor(index / config.nodesPerRow) * config.verticalSpacing,
});

/**
 * Truncates a string to fit within a maximum length by adding an ellipsis
 *
 * @param input - The string to truncate
 * @param maxLength - The maximum allowed length
 * @returns The truncated string with ellipsis if needed, or original string if within length
 */
export const truncateToFitInWidget = (input: string, maxLength: number): string => {
  if (input.length <= maxLength) {
    return input;
  }
  return `${input.slice(0, maxLength)}...`;
};

/**
 * Populates dependency types for a given node by finding edges where it is the source node
 * and checking if target nodes have ResourceType in their keyAttributes
 *
 * @param node - The topology node to populate dependency types for
 * @param edges - Array of edges from the service map
 * @param allNodes - Array of all topology nodes to find target nodes
 * @returns Array of dependency types (ResourceType values from target nodes)
 */
export const computeDependencyTypes = (
  node: TopologyNode,
  edges: TopologyEdge[],
  allNodes: TopologyNode[]
): string[] => {
  const dependencyTypes: string[] = [];

  // Find edges where this node is the source
  const outgoingEdges = edges.filter((edge) => edge.SourceNodeId === node.NodeId);

  // For each outgoing edge, find the target node and check for ResourceType
  outgoingEdges.forEach((edge) => {
    const targetNode = allNodes.find((n) => n.NodeId === edge.DestinationNodeId);

    if (targetNode?.KeyAttributes?.ResourceType) {
      const resourceType = targetNode.KeyAttributes.ResourceType;
      // Only add unique dependency types
      if (resourceType && !dependencyTypes.includes(resourceType)) {
        dependencyTypes.push(resourceType);
      }
    }

    if (targetNode?.KeyAttributes?.Type === AWS_SERVICE_NODE_TYPE) {
      const dependencyType = targetNode.KeyAttributes?.Name;
      if (dependencyType && !dependencyTypes.includes(dependencyType)) {
        dependencyTypes.push(dependencyType);
      }
    }
  });
  return dependencyTypes;
};
