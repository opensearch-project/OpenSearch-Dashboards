/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// src/shared/hooks/use-dagre-layout.hook.ts
import { useCallback } from 'react';
import Dagre from '@dagrejs/dagre';
import type { CelestialNode, CelestialEdge } from '../../types';

// TB: Top to Bottom, BT: Bottom to Top, LR: Left to Right, RL: Right to Left
export type Direction = 'TB' | 'BT' | 'LR' | 'RL';

/**
 * Options for configuring the Dagre layout algorithm
 */
export interface LayoutOptions {
  direction?: Direction;
  nodeWidth?: number;
  nodeHeight?: number;
  rankSeparation?: number;
  nodeSeparation?: number;
  edgeSeparation?: number;
  marginX?: number;
  marginY?: number;
  nodesPerRow?: number; // Fixed number of nodes per row for disconnected nodes
  gridPadding?: number; // Padding between nodes in grid
}

/**
 * Complete configuration for Dagre layout with all required fields
 */
interface LayoutConfig {
  direction: Direction;
  nodeWidth: number;
  nodeHeight: number;
  rankSeparation: number;
  nodeSeparation: number;
  edgeSeparation: number;
  marginX: number;
  marginY: number;
  nodesPerRow: number;
  gridPadding: number;
}

/**
 * Default configuration values for the Dagre layout
 */
const DEFAULT_CONFIG: LayoutConfig = {
  direction: 'LR',
  nodeWidth: 272,
  nodeHeight: 156,
  rankSeparation: 200,
  nodeSeparation: 100,
  edgeSeparation: 10,
  marginX: 20,
  marginY: 20,
  nodesPerRow: 4,
  gridPadding: 50,
};

/**
 * Classifies nodes into connected and disconnected groups based on edges
 *
 * @param nodes - All nodes to classify
 * @param edges - Edges that define connections between nodes
 * @returns Object containing arrays of connected and disconnected nodes
 */
const classifyNodes = (
  nodes: CelestialNode[],
  edges: CelestialEdge[]
): {
  connectedNodes: CelestialNode[];
  disconnectedNodes: CelestialNode[];
  parentNodes: CelestialNode[];
} => {
  const connectedNodeIds = new Set<string>(edges.flatMap((edge) => [edge.source, edge.target]));

  // Find parent nodes (nodes that have children with parentId)
  const parentNodes: CelestialNode[] = nodes.filter((node) =>
    nodes.some((childNode) => childNode.parentId === node.id)
  );

  return {
    connectedNodes: nodes.filter(
      (node) => !parentNodes.includes(node) && connectedNodeIds.has(node.id)
    ),
    disconnectedNodes: nodes.filter(
      (node) => !parentNodes.includes(node) && !connectedNodeIds.has(node.id)
    ),
    parentNodes,
  };
};

/**
 * Processes connected nodes with positions from the Dagre graph
 *
 * @param nodes - Connected nodes to process
 * @param graph - Dagre graph with calculated positions
 * @returns Nodes with updated positions
 */
const processConnectedNodes = (
  nodes: CelestialNode[],
  graph: Dagre.graphlib.Graph
): CelestialNode[] => {
  return nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id);
    if (!nodeWithPosition) return node;

    // Dagre positions nodes at their center, but React Flow positions them at their top-left
    // So we need to adjust the position
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });
};

/**
 * Arranges nodes in a grid layout with fixed number per row
 *
 * @param nodes - Nodes to arrange in a grid
 * @param nodeWidth - Width of each node
 * @param nodeHeight - Height of each node
 * @param nodesPerRow - Number of nodes per row
 * @param padding - Padding between nodes
 * @returns Array of nodes with grid positions
 */
const arrangeNodesInGrid = (
  nodes: CelestialNode[],
  nodeWidth: number,
  nodeHeight: number,
  nodesPerRow: number,
  padding: number
): CelestialNode[] => {
  if (nodes.length === 0) return [];

  // Use fixed number of nodes per row
  const effectiveNodeWidth = nodeWidth + padding;

  return nodes.map((node, index) => {
    // Calculate row and column position
    const row = Math.floor(index / nodesPerRow);
    const col = index % nodesPerRow;

    // Calculate x and y coordinates
    const x = col * effectiveNodeWidth + padding;
    const y = row * (nodeHeight + padding) + padding;

    return {
      ...node,
      position: { x, y },
    };
  });
};

/**
 * Arranges parent nodes to contain their children as containers
 *
 * @param parentNodes - Parent nodes to arrange
 * @param childNodes - All child nodes (connected and disconnected)
 * @param config - Layout configuration
 * @returns Array of parent nodes with container positioning
 */
const arrangeParentNodes = (
  parentNodes: CelestialNode[],
  childNodes: CelestialNode[],
  config: LayoutConfig
): CelestialNode[] => {
  return parentNodes.map((parentNode) => {
    // Find child nodes for this parent
    const nodeChildren = childNodes.filter((childNode) => childNode.parentId === parentNode.id);

    if (nodeChildren.length > 0) {
      // Calculate bounding box for the parent node to contain all child nodes
      const childPositions = nodeChildren.map((childNode) => ({
        x: childNode.position?.x ?? 0,
        y: childNode.position?.y ?? 0,
        width: childNode.width ? Number(childNode.width) : config.nodeWidth,
        height: childNode.height ? Number(childNode.height) : config.nodeHeight,
      }));

      const minX = Math.min(...childPositions.map((pos) => pos.x));
      const minY = Math.min(...childPositions.map((pos) => pos.y));
      const maxX = Math.max(...childPositions.map((pos) => pos.x + pos.width));
      const maxY = Math.max(...childPositions.map((pos) => pos.y + pos.height));

      // Add padding around child nodes
      const padding = 20;
      let parentWidth = Math.max(maxX - minX + padding * 2, config.nodeWidth);
      const parentHeight = Math.max(maxY - minY + padding * 2, config.nodeHeight);
      let parentX = minX - padding;
      const parentY = minY - padding;

      // Check if any non-child nodes are inside the parent's bounding box
      const nonChildNodes = childNodes.filter((childNode) => childNode.parentId !== parentNode.id);

      const nodesInsideParent = nonChildNodes.filter((node) => {
        const nodeX = node.position?.x ?? 0;
        const nodeY = node.position?.y ?? 0;
        const nodeWidth = node.width ? Number(node.width) : config.nodeWidth;
        const nodeHeight = node.height ? Number(node.height) : config.nodeHeight;

        // Check if node is completely inside the parent's bounding box
        return (
          !node.hidden &&
          nodeX >= parentX &&
          nodeY >= parentY &&
          nodeX + nodeWidth <= parentX + parentWidth &&
          nodeY + nodeHeight <= parentY + parentHeight
        );
      });

      // If non-child nodes are found inside parent bounding box, move parent to avoid collision
      if (nodesInsideParent.length > 0) {
        // Shift parent node all the way to the right
        const maxXOfConflictingNodes = Math.max(
          ...nodesInsideParent.map((node) => {
            const nodeX = node.position?.x ?? 0;
            const nodeWidth = node.width ? Number(node.width) : config.nodeWidth;
            return nodeX + nodeWidth;
          })
        );

        // Shift parentX to after the rightmost conflicting node with some padding
        const shiftPadding = 50; // Additional padding after the conflicting nodes
        parentX = maxXOfConflictingNodes + shiftPadding;
        parentWidth = config.nodeWidth + 2 * padding;

        // Adjust child positions to be relative to parent
        nodeChildren.forEach((child, index) => {
          child.position = {
            x: padding,
            y: index * config.nodeHeight + padding,
          };
        });
      } else {
        nodeChildren.forEach((child) => {
          child.position = {
            x: child.position.x - parentX,
            y: child.position.y - parentY,
          };
        });
      }

      // Update the parent node to be positioned as a container
      return {
        ...parentNode,
        position: { x: parentX, y: parentY },
        width: parentWidth,
        height: parentHeight,
        style: {
          ...parentNode.style,
          width: `${parentWidth}px`,
          height: `${parentHeight}px`,
        },
      };
    }
    return parentNode;
  });
};

/**
 * Custom hook for applying celestial layout to nodes and edges
 *
 * @param defaultOptions - Default layout options
 * @returns Object containing layout functions
 */
export const useCelestialLayout = (defaultOptions?: LayoutOptions) => {
  /**
   * Applies celestial layout to nodes and edges
   *
   * @param nodes - Nodes to layout
   * @param edges - Edges to consider for layout
   * @param options - Layout options to override defaults
   * @returns Object containing laid out nodes and rewired edges based on layout direction
   */
  const getLaidOutElements = useCallback(
    (nodes: CelestialNode[], edges: CelestialEdge[], options?: LayoutOptions) => {
      // Skip layout if no nodes
      if (!nodes.length) return { nodes, edges };

      // Merge default options with provided options
      const config: LayoutConfig = {
        ...DEFAULT_CONFIG,
        ...defaultOptions,
        ...options,
      };

      // Classify nodes into connected and disconnected groups
      const { connectedNodes, disconnectedNodes, parentNodes } = classifyNodes(nodes, edges);

      // Create a new directed graph for connected nodes
      const graph = new Dagre.graphlib.Graph();

      // Set graph direction and default edge settings
      graph.setGraph({
        rankdir: config.direction,
        nodesep: config.nodeSeparation,
        ranksep: config.rankSeparation,
        edgesep: config.edgeSeparation,
        marginx: config.marginX,
        marginy: config.marginY,
      });

      // Default to assign a new object as a label for each edge
      graph.setDefaultEdgeLabel(() => ({}));

      // Add connected nodes to the graph with their dimensions
      connectedNodes
        .filter((node) => !node.hidden)
        .forEach((node) => {
          const width = node.width ? Number(node.width) : config.nodeWidth;
          const height = node.height ? Number(node.height) : config.nodeHeight;
          graph.setNode(node.id, { width, height });
        });

      // Add edges to the graph
      edges
        .filter((edge) => !edge.hidden)
        .forEach((edge) => {
          graph.setEdge(edge.source, edge.target);
        });

      // Apply the layout for connected nodes
      if (connectedNodes.length > 0) {
        Dagre.layout(graph);
      }

      // Position connected nodes according to celestial layout
      const laidOutConnectedNodes = processConnectedNodes(connectedNodes, graph);

      // Calculate grid layout for disconnected nodes with fixed number per row
      const laidOutDisconnectedNodes = arrangeNodesInGrid(
        disconnectedNodes,
        config.nodeWidth,
        config.nodeHeight,
        config.nodesPerRow,
        config.gridPadding
      );

      // Find the maximum y-coordinate of connected nodes to position disconnected nodes below them
      let maxY = 0;
      if (laidOutConnectedNodes.length > 0) {
        maxY = Math.max(
          ...laidOutConnectedNodes.map(
            (node) => node.position.y + (node.height ? Number(node.height) : config.nodeHeight)
          )
        );
        maxY += config.rankSeparation; // Add some spacing
      }

      // Adjust y-coordinates of disconnected nodes to position them below connected nodes
      const adjustedDisconnectedNodes = laidOutDisconnectedNodes.map((node) => ({
        ...node,
        position: {
          ...node.position,
          y: node.position.y + maxY,
        },
      }));

      // Adjust positions for parent nodes to contain their children
      const allChildNodes = [...laidOutConnectedNodes, ...adjustedDisconnectedNodes];
      const adjustedParentNodes = arrangeParentNodes(parentNodes, allChildNodes, config);

      // Combine connected and disconnected nodes
      const allLaidOutNodes = [
        ...adjustedParentNodes,
        ...laidOutConnectedNodes,
        ...adjustedDisconnectedNodes,
      ];

      // Rewire edges based on the layout direction
      const rewiredEdges = edges.map((edge) => {
        // Create a new edge object to avoid mutating the original
        const newEdge = { ...edge };

        // Set source and target handles based on layout direction
        if (config.direction === 'TB' || config.direction === 'BT') {
          // For vertical layouts (top-to-bottom or bottom-to-top)
          newEdge.sourceHandle = config.direction === 'TB' ? 'source-bottom' : 'source-top';
          newEdge.targetHandle = config.direction === 'TB' ? 'target-top' : 'target-bottom';
        } else {
          // For horizontal layouts (left-to-right or right-to-left)
          newEdge.sourceHandle = config.direction === 'LR' ? 'source-right' : 'source-left';
          newEdge.targetHandle = config.direction === 'LR' ? 'target-left' : 'target-right';
        }

        return newEdge;
      });

      return { nodes: allLaidOutNodes, edges: rewiredEdges };
    },
    [defaultOptions]
  );

  return { getLaidOutElements };
};
