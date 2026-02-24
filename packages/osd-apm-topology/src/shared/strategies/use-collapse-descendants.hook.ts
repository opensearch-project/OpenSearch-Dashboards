/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { Edge, useReactFlow } from '@xyflow/react';
import { useNodeRelationships, Visibility } from '../hooks/use-node-relationships.hook';
import type { CelestialEdge, CelestialNode } from '../../types';

export const useCollapseDescendants = () => {
  const { getNodes, getEdges } = useReactFlow();
  const {
    getIncomingEdgesCount,
    getOutgoingEdges,
    getIncomingEdges,
    getChildrenNodes,
    hasOutgoingEdges,
  } = useNodeRelationships();

  const processChildren = useCallback(
    (nodeId: string, hideNodesIds: Set<string>, hideEdgesIds: Set<string>) => {
      getOutgoingEdges(nodeId, Visibility.Visible).forEach((edge: CelestialEdge) => {
        hideEdgesIds.add(edge.id);
      });

      const children = getChildrenNodes(nodeId, Visibility.Visible).sort((a, b) => {
        return (
          getIncomingEdgesCount(a.id, Visibility.Visible) -
          getIncomingEdgesCount(b.id, Visibility.Visible)
        );
      });

      children.forEach((child) => {
        const edgeIds = getIncomingEdges(child.id, Visibility.Visible).map((edge: Edge) => edge.id);

        if (edgeIds.length === 0) {
          hideNodesIds.add(child.id);
        } else if (edgeIds.every((edgeId: string) => hideEdgesIds.has(edgeId))) {
          hideNodesIds.add(child.id);
        }
      });

      children.forEach((child) => {
        processChildren(child.id, hideNodesIds, hideEdgesIds);
      });
    },
    [getOutgoingEdges, getChildrenNodes, getIncomingEdgesCount, getIncomingEdges]
  );

  const applyCollapseDescendants = useCallback(
    (nodeId: string) => {
      const hideEdgesIds = new Set<string>();
      const hideNodesIds = new Set<string>();

      processChildren(nodeId, hideNodesIds, hideEdgesIds);

      const updatedNodes = (getNodes() as CelestialNode[]).map((node: CelestialNode) => {
        if (hideNodesIds.has(node.id)) {
          return {
            ...node,
            hidden: true,
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

      const updatedEdges = (getEdges() as CelestialEdge[]).map((edge: CelestialEdge) => {
        if (hideEdgesIds.has(edge.id)) {
          return {
            ...edge,
            hidden: true,
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
    [processChildren, getNodes, getEdges]
  );

  return applyCollapseDescendants;
};
