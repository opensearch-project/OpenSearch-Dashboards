/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dagre from '@dagrejs/dagre';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { CategorizedSpan, getCategoryMeta } from './span_categorization';

interface SpanNodeData {
  span: CategorizedSpan;
  totalDuration: number;
  [key: string]: unknown;
}

interface FlowTransformResult {
  nodes: Array<Node<SpanNodeData>>;
  edges: Edge[];
}

interface FlowTransformOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
  nodeSpacingX?: number;
  nodeSpacingY?: number;
}

const DEFAULT_OPTIONS: Required<FlowTransformOptions> = {
  direction: 'TB',
  nodeWidth: 200,
  nodeHeight: 70,
  nodeSpacingX: 50,
  nodeSpacingY: 80,
};

/**
 * Convert a categorized span tree to React Flow nodes and edges
 */
export function spansToFlow(
  spanTree: CategorizedSpan[],
  totalDuration: number,
  options: FlowTransformOptions = {}
): FlowTransformResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const nodes: Array<Node<SpanNodeData>> = [];
  const edges: Edge[] = [];

  const processSpan = (span: CategorizedSpan, parentId?: string) => {
    const node: Node<SpanNodeData> = {
      id: span.spanId || span.id,
      type: span.category.toLowerCase(),
      data: {
        span,
        totalDuration,
      },
      position: { x: 0, y: 0 }, // Will be set by layout
    };
    nodes.push(node);

    if (parentId) {
      edges.push(createEdge(parentId, node.id, false));
    }

    if (span.children && span.children.length > 0) {
      const children = span.children as CategorizedSpan[];
      children.forEach((child) => {
        processSpan(child, node.id);
      });
    }
  };

  spanTree.forEach((span) => processSpan(span));

  return applyDagreLayout(nodes, edges, opts);
}

function createEdge(sourceId: string, targetId: string, isParallel: boolean): Edge {
  const parallelColor = getCategoryMeta('TOOL').color;
  const defaultColor = getCategoryMeta('OTHER').color;
  const edgeColor = isParallel ? parallelColor : defaultColor;

  return {
    id: `${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    type: 'smoothstep',
    animated: isParallel,
    style: {
      stroke: edgeColor,
      strokeWidth: 2,
      strokeDasharray: isParallel ? '5,5' : undefined,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 12,
      height: 12,
      color: edgeColor,
    },
  };
}

/**
 * Apply dagre layout algorithm to position nodes
 */
function applyDagreLayout(
  nodes: Array<Node<SpanNodeData>>,
  edges: Edge[],
  options: FlowTransformOptions = {}
): FlowTransformResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSpacingX,
    ranksep: opts.nodeSpacingY,
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - opts.nodeWidth / 2,
        y: nodeWithPosition.y - opts.nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
