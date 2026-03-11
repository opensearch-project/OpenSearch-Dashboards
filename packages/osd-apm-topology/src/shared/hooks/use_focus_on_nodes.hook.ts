/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { CelestialNode } from '../../types';

/**
 * Custom hook that provides functionality to focus the camera on specific nodes
 * Calculates bounding box of target nodes and uses ReactFlow's fitBounds to focus on them
 *
 * @returns Function to focus on a set of nodes
 */
export const useFocusOnNodes = () => {
  const reactFlowInstance = useReactFlow();

  const focusOnNodes = useCallback(
    (nodesInFocus: CelestialNode[], layoutNodes: CelestialNode[], delay: number = 100) => {
      if (!nodesInFocus || nodesInFocus.length === 0) {
        return;
      }

      // Focus on filtered nodes after a delay to ensure layout is complete
      setTimeout(() => {
        const filteredNodeIds = new Set(nodesInFocus.map((node) => node.id));
        const filteredLayoutNodes = layoutNodes.filter((node) => filteredNodeIds.has(node.id));

        if (filteredLayoutNodes.length > 0) {
          // Calculate bounding box of filtered nodes
          const minX = Math.min(...filteredLayoutNodes.map((node) => node.position.x));
          const maxX = Math.max(
            ...filteredLayoutNodes.map((node) => node.position.x + (node.width ?? 272))
          ); // 272 is default node width
          const minY = Math.min(...filteredLayoutNodes.map((node) => node.position.y));
          const maxY = Math.max(
            ...filteredLayoutNodes.map((node) => node.position.y + (node.height ?? 156))
          ); // 156 is default node height

          // Add some padding - scale padding based on number of nodes
          const padding = (5 / filteredLayoutNodes.length) * 50;
          const focusArea = {
            x: minX - padding,
            y: minY - padding,
            width: maxX - minX + 2 * padding,
            height: maxY - minY + 2 * padding,
          };

          // Use ReactFlow's fitBounds to focus on the calculated area
          if (reactFlowInstance?.fitBounds) {
            reactFlowInstance.fitBounds(focusArea, {
              padding: 0.1,
              duration: 400,
            });
          }
        }
      }, delay);
    },
    [reactFlowInstance]
  );

  return { focusOnNodes };
};
