/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ReactFlow, Node, Edge, MarkerType } from '@xyflow/react';
import {
  calculatePosition,
  DEFAULT_GRID_CONFIG,
  truncateToFitInWidget,
} from './shared/utils/celestial-node.utils';
import { WidgetNode, WidgetNodeProps } from './components/WidgetNode/WidgetNode';
import { HEALTH_DONUT_COLORS } from './components/HealthDonut';

const ARROW_SIZE = 24;
const MAX_TEXT_LENGTH = 20;

export interface CelestialMapWidgetProps {
  nodes: WidgetNodeProps[];
  edges: Edge[];
}

const nodeTypes = {
  widget: WidgetNode,
};

enum EdgeTypes {
  DIRECT = 'direct',
  INDIRECT = 'indirect',
}

export const CelestialMapWidget: React.FC<CelestialMapWidgetProps> = ({ nodes, edges }) => {
  const styledEdges = edges.map((edge) => ({
    ...edge,
    markerEnd: {
      type: MarkerType.Arrow,
      color: HEALTH_DONUT_COLORS.background,
      width: ARROW_SIZE,
      height: ARROW_SIZE,
    },
    style: {
      stroke: HEALTH_DONUT_COLORS.background,
      ...(edge.type?.toLocaleLowerCase() === EdgeTypes.INDIRECT && { strokeDasharray: '3,5' }),
    },
  }));
  const styledNodes: Array<Node<WidgetNodeProps>> = nodes.map((node, index) => {
    const nodePosition = calculatePosition(index, {
      ...DEFAULT_GRID_CONFIG,
      horizontalSpacing: 150,
    });
    return {
      id: node.id,
      type: 'widget',
      data: {
        ...node,
        title: truncateToFitInWidget(node.title, MAX_TEXT_LENGTH),
        subtitle: truncateToFitInWidget(node.subtitle ?? node.type, MAX_TEXT_LENGTH),
        isSource: edges.some((edge) => edge.source === node.id),
        isTarget: edges.some((edge) => edge.target === node.id),
      },
      position: {
        x: nodePosition.x,
        y: nodePosition.y,
      },
    };
  });
  return (
    <div className="osd:h-full osd:w-full">
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
      />
    </div>
  );
};

// eslint-disable-next-line import/no-default-export
export default CelestialMapWidget;
