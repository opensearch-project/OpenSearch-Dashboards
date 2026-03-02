/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Node,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  EuiButtonIcon,
  EuiEmptyPrompt,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

import { TraceRow } from '../hooks/use_agent_traces';
import {
  categorizeSpanTree,
  CategorizedSpan,
  getCategoryMeta,
  SpanCategory,
} from '../../../../services/span_categorization';
import { spansToFlow } from '../../../../services/flow_transform';
import { nodeTypes } from './node_types';
import './trace_flow_view.scss';

interface TraceFlowViewProps {
  spanTree: TraceRow[];
  totalDuration: number;
  selectedSpan: TraceRow | null;
  onSelectSpan: (span: TraceRow | null) => void;
  isLoading?: boolean;
  loadError?: string;
}

const minimapNodeColor = (node: Node): string => {
  const data = node.data as Record<string, unknown> | undefined;
  const span = data?.span as { category?: SpanCategory } | undefined;
  const category = span?.category;
  return getCategoryMeta(category || 'OTHER').color;
};

export const TraceFlowView: React.FC<TraceFlowViewProps> = ({
  spanTree,
  totalDuration,
  selectedSpan: _selectedSpan,
  onSelectSpan,
  isLoading,
  loadError,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);

  // Categorize spans and convert to flow
  const categorizedTree = useMemo(() => categorizeSpanTree(spanTree), [spanTree]);

  // Transform to React Flow nodes/edges
  useEffect(() => {
    if (categorizedTree.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: flowNodes, edges: flowEdges } = spansToFlow(categorizedTree, totalDuration, {
      direction: 'TB',
    });

    setNodes(flowNodes);
    setEdges(flowEdges);

    // Fit view after nodes are set
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: 0.1, maxZoom: 1 });
      }
    }, 100);
  }, [categorizedTree, totalDuration, setNodes, setEdges]);

  // Handle React Flow initialization
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
    setTimeout(() => {
      instance.fitView({ padding: 0.1, maxZoom: 1 });
    }, 100);
  }, []);

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data = node.data as { span?: CategorizedSpan } | undefined;
      if (data?.span) {
        onSelectSpan(data.span);
      }
    },
    [onSelectSpan]
  );

  // Handle background click (deselect)
  const onPaneClick = useCallback(() => {
    onSelectSpan(null);
  }, [onSelectSpan]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.current?.zoomOut();
  }, []);

  // Fit view
  const handleFitView = useCallback(() => {
    reactFlowInstance.current?.fitView({ padding: 0.1, maxZoom: 1 });
  }, []);

  // Minimap toggle
  const handleToggleMinimap = useCallback(() => {
    setShowMinimap((prev) => !prev);
  }, []);

  if (isLoading) {
    return (
      <div className="agentTracesFlyout__loadingPanel agentTracesFlow__loadingPanel">
        <EuiLoadingSpinner size="l" />
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="agentTraces.flowView.loadingTraceGraph"
            defaultMessage="Loading trace graph..."
          />
        </EuiText>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="agentTracesFlow__emptyState">
        <EuiEmptyPrompt
          iconType="alert"
          iconColor="danger"
          title={
            <h3>
              <FormattedMessage
                id="agentTraces.flowView.errorLoadingTraceGraph"
                defaultMessage="Failed to load trace graph"
              />
            </h3>
          }
          body={<p>{loadError}</p>}
        />
      </div>
    );
  }

  if (spanTree.length === 0) {
    return (
      <div className="agentTracesFlow__emptyState">
        <EuiText color="subdued" size="s">
          <FormattedMessage
            id="agentTraces.flowView.noSpansToDisplay"
            defaultMessage="No spans to display"
          />
        </EuiText>
      </div>
    );
  }

  return (
    <div className="agentTracesFlow__container">
      {/* Floating controls */}
      <div className="agentTracesFlow__controls">
        <EuiPanel paddingSize="none" className="agentTracesFlow__controlButton">
          <EuiButtonIcon
            size="s"
            iconType="plusInCircle"
            onClick={handleZoomIn}
            aria-label={i18n.translate('agentTraces.flowView.zoomIn', {
              defaultMessage: 'Zoom in',
            })}
            display="base"
          />
        </EuiPanel>
        <EuiPanel paddingSize="none" className="agentTracesFlow__controlButton">
          <EuiButtonIcon
            size="s"
            iconType="minusInCircle"
            onClick={handleZoomOut}
            aria-label={i18n.translate('agentTraces.flowView.zoomOut', {
              defaultMessage: 'Zoom out',
            })}
            display="base"
          />
        </EuiPanel>
        <EuiPanel paddingSize="none" className="agentTracesFlow__controlButton">
          <EuiButtonIcon
            size="s"
            iconType="expand"
            onClick={handleFitView}
            aria-label={i18n.translate('agentTraces.flowView.fitView', {
              defaultMessage: 'Fit view',
            })}
            display="base"
          />
        </EuiPanel>
        <EuiPanel paddingSize="none" className="agentTracesFlow__controlButton">
          <EuiButtonIcon
            size="s"
            iconType="mapMarker"
            onClick={handleToggleMinimap}
            aria-label={
              showMinimap
                ? i18n.translate('agentTraces.flowView.hideMinimap', {
                    defaultMessage: 'Hide minimap',
                  })
                : i18n.translate('agentTraces.flowView.showMinimap', {
                    defaultMessage: 'Show minimap',
                  })
            }
            display="base"
            color={showMinimap ? 'primary' : 'text'}
          />
        </EuiPanel>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.1,
          minZoom: 0.1,
          maxZoom: 1,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color={euiThemeVars.euiColorLightShade}
        />
        {showMinimap && (
          <MiniMap
            nodeColor={minimapNodeColor}
            maskColor={euiThemeVars.euiColorLightestShade}
            style={{
              backgroundColor: euiThemeVars.euiColorEmptyShade,
              border: `1px solid ${euiThemeVars.euiColorLightShade}`,
            }}
            pannable
            zoomable
          />
        )}
      </ReactFlow>
    </div>
  );
};
