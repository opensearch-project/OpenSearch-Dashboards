/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Edge,
  EdgeProps,
  MarkerType,
  MiniMap,
  Node,
  NodeProps,
  OnEdgesChange,
  OnNodesChange,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react';
import React, { ReactNode, useCallback, useMemo } from 'react';
import type { CelestialEdge, CelestialEdgeStyleData } from '../types';
import { Breadcrumb, BreadcrumbTrail } from './BreadcrumbTrail';
import type { CelestialCardProps } from './CelestialCard/types';
import { CelestialControls } from './CelestialControls';
import { LayoutControls } from './LayoutControls';
import { CelestialNode } from './CelestialNode';
import { CelestialEdge as CelestialEdgeComponent } from './edges/CelestialEdge';
import { GlassBackground } from './GlassBackground';
import { Legend } from './Legend';
import { Loader } from './Loader/Loader';
import { t } from '../shared/i18n/t';

const defaultNodeTypes: Record<string, React.ComponentType<NodeProps<any>>> = {
  celestialNode: CelestialNode,
};

const defaultEdgeTypes: Record<string, React.ComponentType<EdgeProps<any>>> = {
  celestialEdge: CelestialEdgeComponent,
};

/**
 * Resolves `data.style.marker` into a top-level `markerEnd` so ReactFlow
 * creates SVG `<defs>` and passes the resolved URL string to edge components.
 */
function resolveEdgeMarkers(edges: Edge[]): Edge[] {
  return edges.map((edge) => {
    if (edge.markerEnd) return edge; // already set by consumer
    const style = (edge.data as any)?.style as CelestialEdgeStyleData | undefined;
    if (style?.marker === 'none') return edge; // explicitly no marker
    // Must be a concrete color value (not CSS var) since ReactFlow
    // sets it as an SVG attribute on the marker <polyline>.
    const markerColor = style?.color ?? '#b1b1b7';
    return {
      ...edge,
      markerEnd: {
        type: style?.marker === 'arrow' ? MarkerType.Arrow : MarkerType.ArrowClosed,
        color: markerColor,
        width: 20,
        height: 20,
      },
    };
  });
}

interface MapContainerProps {
  nodes: Array<Node<CelestialCardProps>>;
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<CelestialCardProps>>;
  onEdgesChange: OnEdgesChange<Edge>;
  isLoading?: boolean;
  breadcrumbs: Breadcrumb[];
  onBreadcrumbClick: (breadcrumb: Breadcrumb, index: number) => void;
  onEdgeClick: (event: any, edge: CelestialEdge) => void;
  emptyState?: ReactNode;
  hotspot?: ReactNode;
  numMatches?: number;
  /** Custom node type components. Merged with built-in defaults. */
  nodeTypes?: Record<string, React.ComponentType<NodeProps<any>>>;
  /** Custom edge type components. Merged with built-in defaults. */
  edgeTypes?: Record<string, React.ComponentType<EdgeProps<any>>>;
  /** Custom legend content. `false` hides legend. `undefined` shows default APM legend. */
  legend?: ReactNode | false;
  /** Show the ReactFlow minimap overlay. Default: false */
  showMinimap?: boolean;
  /** Show SLI/SLO entries in the default legend. Default: false */
  showSliSlo?: boolean;
  /** Whether the host page is in dark mode */
  isDarkMode?: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  nodes,
  edges,
  isLoading,
  onNodesChange,
  onEdgesChange,
  breadcrumbs,
  onBreadcrumbClick,
  onEdgeClick,
  emptyState,
  hotspot,
  numMatches,
  nodeTypes: consumerNodeTypes,
  edgeTypes: consumerEdgeTypes,
  legend,
  showMinimap,
  showSliSlo,
  isDarkMode,
}) => {
  const reactFlowInstance = useReactFlow();
  const mergedNodeTypes = useMemo(() => ({ ...defaultNodeTypes, ...consumerNodeTypes }), [
    consumerNodeTypes,
  ]);
  const mergedEdgeTypes = useMemo(() => ({ ...defaultEdgeTypes, ...consumerEdgeTypes }), [
    consumerEdgeTypes,
  ]);
  const resolvedEdges = useMemo(() => resolveEdgeMarkers(edges), [edges]);

  const renderLegend = () => {
    if (legend === false) return null;
    if (legend !== undefined) {
      return <Legend>{legend}</Legend>;
    }
    return <Legend showSliSlo={showSliSlo} />;
  };

  /** Focus camera on a clicked node */
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const width = node.measured?.width ?? node.width ?? 272;
      const height = node.measured?.height ?? node.height ?? 156;
      const padding = 50;
      reactFlowInstance.fitBounds(
        {
          x: node.position.x - padding,
          y: node.position.y - padding,
          width: width + 2 * padding,
          height: height + 2 * padding,
        },
        { padding: 0.3, duration: 400 }
      );
    },
    [reactFlowInstance]
  );

  /** Focus camera on the midpoint between an edge's source and target nodes */
  const handleEdgeClickWithFocus = useCallback(
    (event: any, edge: CelestialEdge) => {
      // Fire the consumer callback first
      onEdgeClick(event, edge);

      const sourceNode = reactFlowInstance.getNode(edge.source);
      const targetNode = reactFlowInstance.getNode(edge.target);
      if (sourceNode && targetNode) {
        const sWidth = sourceNode.measured?.width ?? sourceNode.width ?? 272;
        const sHeight = sourceNode.measured?.height ?? sourceNode.height ?? 156;
        const tWidth = targetNode.measured?.width ?? targetNode.width ?? 272;
        const tHeight = targetNode.measured?.height ?? targetNode.height ?? 156;

        const minX = Math.min(sourceNode.position.x, targetNode.position.x);
        const minY = Math.min(sourceNode.position.y, targetNode.position.y);
        const maxX = Math.max(sourceNode.position.x + sWidth, targetNode.position.x + tWidth);
        const maxY = Math.max(sourceNode.position.y + sHeight, targetNode.position.y + tHeight);
        const padding = 50;

        reactFlowInstance.fitBounds(
          {
            x: minX - padding,
            y: minY - padding,
            width: maxX - minX + 2 * padding,
            height: maxY - minY + 2 * padding,
          },
          { padding: 0.1, duration: 400 }
        );
      }
    },
    [reactFlowInstance, onEdgeClick]
  );

  return (
    <div
      className={`osd:flex osd:flex-col osd:h-full osd:overflow-hidden osd:rounded-2xl osd:relative`}
    >
      <div className="osd:absolute osd:top-2 osd:left-0 osd:flex osd:z-1000">
        <BreadcrumbTrail
          breadcrumbs={breadcrumbs}
          onBreadcrumbClick={onBreadcrumbClick}
          hotspot={hotspot}
        />
      </div>
      {numMatches !== undefined && (
        <div className="osd:absolute osd:top-[14px] osd:right-4 osd:flex osd:z-1000">
          <div className="osd:inline-flex osd:items-center osd:px-3 osd:py-1.5 osd:rounded-lg osd:text-sm osd:bg-blue-50 osd:text-black osd:border-2 osd:border-blue-500">
            {numMatches} {numMatches === 1 ? t('matchForFilter') : t('matchesForFilter')}
          </div>
        </div>
      )}
      <div className="osd:relative osd:flex-grow">
        {isLoading && (
          <GlassBackground>
            <Loader />
          </GlassBackground>
        )}
        {!isLoading && nodes?.length === 0 && (
          <div className="osd:bg-container-default osd:absolute osd:inset-0 osd:flex osd:items-center osd:justify-center osd:z-10">
            {emptyState}
          </div>
        )}
        {/* Controls and Legend stacked in top-right corner - moved outside ReactFlow */}
        <div className="osd:absolute osd:top-15 osd:right-4 osd:flex osd:flex-col osd:items-center osd:gap-4 osd:z-50">
          {renderLegend()}
          <CelestialControls />
          <LayoutControls />
        </div>
        <ReactFlow
          nodes={nodes}
          edges={resolvedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClickWithFocus}
          minZoom={0}
          fitView
          nodeTypes={mergedNodeTypes}
          edgeTypes={mergedEdgeTypes}
          proOptions={{ hideAttribution: true }}
          className="osd:w-full osd:h-full osd:z-1"
        >
          {showMinimap && (
            <MiniMap
              nodeStrokeWidth={3}
              nodeStrokeColor={isDarkMode ? '#424650' : '#B4B4BB'}
              nodeColor={(node: any) => {
                const status = node.data?.health?.status ?? node.data?.status;
                if (status === 'breached' || status === 'critical' || status === 'error')
                  return '#D13313';
                if (status === 'recovered' || status === 'warning') return '#FF9900';
                return isDarkMode ? '#424650' : '#B4B4BB';
              }}
              bgColor={isDarkMode ? '#151D26' : '#FFFFFF'}
              maskColor={isDarkMode ? 'rgba(35, 43, 55, 0.6)' : 'rgba(235, 235, 240, 0.6)'}
              pannable
              zoomable
              style={{ borderRadius: 8 }}
            />
          )}
        </ReactFlow>
      </div>
    </div>
  );
};
