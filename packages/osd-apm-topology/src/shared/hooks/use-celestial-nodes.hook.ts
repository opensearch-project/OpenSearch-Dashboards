/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarkerType } from '@xyflow/react';
import { useMemo } from 'react';
import type { GetServiceMapOutput } from '../types/sdk.types';
import { TopologyNodeTransformer } from '../transformers/celestial-node.transformer';
import { TopologyNodeModel } from '../models/topology-node.model';
import type { CelestialNode, CelestialMapModel, CelestialEdge } from '../../types';

import {
  DEFAULT_GRID_CONFIG,
  calculatePosition,
  computeDependencyTypes,
} from '../utils/celestial-node.utils';

export const useCelestialNodes = (data: GetServiceMapOutput): CelestialMapModel =>
  useMemo(() => {
    const nodes: CelestialNode[] = data.Nodes.map((node: any, idx: number) => {
      const position = calculatePosition(idx, DEFAULT_GRID_CONFIG);
      const enhancedNode = {
        ...node,
        DependencyTypes: computeDependencyTypes(node, data.Edges ?? [], data.Nodes),
      };

      const model = new TopologyNodeModel(enhancedNode);

      return {
        id: node.NodeId,
        type: 'celestialNode',
        position,
        data: new TopologyNodeTransformer(model).toCelestialCard(),
        draggable: true,
        selectable: true,
        deletable: false,
      };
    });
    const edges: CelestialEdge[] =
      (data.Edges ?? []).map((edge: any) => ({
        id: edge.EdgeId,
        source: edge.SourceNodeId,
        target: edge.DestinationNodeId,
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2 },
        type: 'bezier',
        data: {
          relationship: 'Invoke',
          statistics: edge.StatisticReferences,
        },
      })) || [];
    return { nodes, edges };
  }, [data]);
