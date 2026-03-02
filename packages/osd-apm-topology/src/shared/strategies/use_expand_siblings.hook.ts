/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useNodeRelationships } from '../hooks/use_node_relationships.hook';
import type { CelestialEdge, CelestialNode } from '../../types';

export const useExpandSiblings = () => {
  const { getNodes, getEdges } = useReactFlow();
  const { getAggregateSiblings, getParentNodes, getChildrenNodes } = useNodeRelationships();

  const applyExpandSiblings = useCallback(
    (nodeId: string) => {
      const siblings = getAggregateSiblings(nodeId);
      const siblingsIds = siblings.map((sibling) => sibling.id);

      const updatedNodes = (getNodes() as CelestialNode[]).map((node) => {
        if (siblingsIds.includes(node.id)) {
          return {
            ...node,
            hidden: false,
            data: {
              ...node.data,
              isStacked: false,
            },
          };
        }

        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              isStacked: false,
              isTopOfTheStack: false,
            },
          };
        }

        return node;
      });

      const parents = getParentNodes(nodeId) as CelestialNode[];
      const parentIds = parents.map((parent) => parent.id);
      const children = getChildrenNodes(nodeId) as CelestialNode[];
      const childrenIds = children.map((child) => child.id);

      const updatedEdges = getEdges().map((edge: CelestialEdge) => {
        if (siblingsIds.includes(edge.source) && childrenIds.includes(edge.target)) {
          return {
            ...edge,
            hidden: false,
          };
        }

        if (parentIds.includes(edge.source) && siblingsIds.includes(edge.target)) {
          return {
            ...edge,
            hidden: false,
          };
        }

        // if edge was rewired during collapse of the node
        if ((edge.source === nodeId || edge.target === nodeId) && edge.data?.original) {
          return {
            ...edge.data?.original,
            hidden: false,
          };
        }

        return edge;
      });

      return {
        nodes: updatedNodes,
        edges: updatedEdges,
      };
    },
    [getAggregateSiblings, getParentNodes, getChildrenNodes, getNodes, getEdges]
  );

  return applyExpandSiblings;
};
