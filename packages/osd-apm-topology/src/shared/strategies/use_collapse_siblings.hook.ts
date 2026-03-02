/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useNodeRelationships } from '../hooks/use_node_relationships.hook';
import type { CelestialEdge, CelestialNode } from '../../types';

export const useCollapseSiblings = () => {
  const { getNodes, getEdges } = useReactFlow();
  const { getAggregateSiblings, getParentNodes, getChildrenNodes } = useNodeRelationships();

  const applyCollapseSiblings = useCallback(
    (nodeId: string) => {
      const siblings = getAggregateSiblings(nodeId);
      const siblingIds = siblings.map((sibling) => sibling.id);

      // Update current nodes in the graph
      const updatedNodes = (getNodes() as CelestialNode[]).map((node) => {
        // hide all siblings of same type
        if (siblingIds.includes(node.id)) {
          return {
            ...node,
            hidden: true,
            data: {
              ...node.data,
              isStacked: true,
            },
          };
        }

        // if node is clicked node mark it as stacked
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              isStacked: true,
              isTopOfTheStack: true,
            },
          };
        }

        return node;
      });

      const parents = getParentNodes(nodeId);
      const parentIds = parents.map((parent) => parent.id);
      const children = getChildrenNodes(nodeId);
      const childrenIds = children.map((child) => child.id);

      const updatedEdges = getEdges().map((edge: CelestialEdge) => {
        // hide all edges coming from the same parent, we will only show the one between parent and nodeId
        if (parentIds.includes(edge.source) && siblingIds.includes(edge.target)) {
          return {
            ...edge,
            hidden: true,
          };
        }

        // if siblings have edges coming from other parents, we will want to rewire edge
        // clicked node id (clicked node is visible node in the aggregated stack)
        if (!parentIds.includes(edge.source) && siblingIds.includes(edge.target)) {
          return {
            ...edge,
            target: nodeId,
            hidden: false,
            data: {
              original: { ...edge },
            },
          };
        }

        // hide all edges connecting siblings that with clicked node children, because those are collapsed
        // and exist as edges coming from clicked node, that will be visible node in the stack
        if (siblingIds.includes(edge.source) && childrenIds.includes(edge.target)) {
          return {
            ...edge,
            hidden: true,
          };
        }

        // if siblings connect to other children than those of the clicked node,
        // we will rewire outgoing edge such that clicked node is the source
        if (siblingIds.includes(edge.source) && !childrenIds.includes(edge.target)) {
          return {
            ...edge,
            source: nodeId,
            hidden: false,
            data: {
              original: { ...edge },
            },
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

  return applyCollapseSiblings;
};
