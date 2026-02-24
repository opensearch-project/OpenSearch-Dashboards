/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useNodeRelationships, Visibility } from '../hooks/use-node-relationships.hook';
import type { CelestialEdge, CelestialNode } from '../../types';

export const useExpandChildren = () => {
  const { getNodes, getEdges, getNode } = useReactFlow();
  const { getOutgoingEdges, getChildrenNodes, hasOutgoingEdges } = useNodeRelationships();

  const applyExpandChildren = useCallback(
    (nodeId: string) => {
      const edgeIds = getOutgoingEdges(nodeId).map((edge) => edge.id);
      const childrenIds = getChildrenNodes(nodeId).map((child) => child.id);
      const updatedNodes = (getNodes() as CelestialNode[]).map((node) => {
        if (childrenIds.includes(node.id)) {
          return {
            ...node,
            hidden: node.data.isStacked ? !node.data.isTopOfTheStack : false,
            data: {
              ...node.data,
              isCollapsable: hasOutgoingEdges(node.id),
              isCollapsed:
                hasOutgoingEdges(node.id) && hasOutgoingEdges(node.id, Visibility.Hidden),
            },
          };
        }

        return node;
      });

      const updatedEdges = getEdges().map((edge: CelestialEdge) => {
        if (edgeIds.includes(edge.id)) {
          const target = getNode(edge.target);
          return {
            ...edge,
            hidden: target?.data.isStacked ? !target.data.isTopOfTheStack : false,
          };
        }

        return edge;
      });

      return {
        nodes: updatedNodes,
        edges: updatedEdges,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getChildrenNodes, getOutgoingEdges, getNodes, getEdges]
  );

  return applyExpandChildren;
};
