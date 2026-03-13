/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { EuiEmptyPrompt, EuiLoadingSpinner, EuiSpacer, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { CelestialMap, AgentCardNode } from '@osd/apm-topology';
import type { NodeProps } from '@xyflow/react';

import { TraceRow } from '../hooks/use_agent_traces';
import { categorizeSpanTree, CategorizedSpan } from '../../../../services/span_categorization';
import { spansToFlow } from '../../../../services/flow_transform';
import './trace_flow_view.scss';

interface TraceFlowViewProps {
  spanTree: TraceRow[];
  totalDuration: number;
  selectedSpan: TraceRow | null;
  onSelectSpan: (span: TraceRow | null) => void;
  isLoading?: boolean;
  loadError?: string;
}

// Context for passing span selection handler to custom node components
interface TraceFlowContextValue {
  onSelectSpan: (span: TraceRow | null) => void;
  spanMap: Map<string, CategorizedSpan>;
}

const TraceFlowContext = createContext<TraceFlowContextValue>({
  onSelectSpan: () => {},
  spanMap: new Map(),
});

/**
 * Custom wrapper around AgentCardNode that intercepts clicks to:
 * 1. Call onSelectSpan with the corresponding span
 * 2. Prevent CelestialMap's default viewport reset behavior via stopPropagation
 */
const TraceAgentCardNode = (props: NodeProps<any>) => {
  const { onSelectSpan, spanMap } = useContext(TraceFlowContext);

  const selectSpan = useCallback(() => {
    const span = spanMap.get(props.data.id);
    if (span) {
      onSelectSpan(span);
    }
  }, [onSelectSpan, spanMap, props.data.id]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectSpan();
    },
    [selectSpan]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation();
        selectSpan();
      }
    },
    [selectSpan]
  );

  return (
    <div onClick={handleClick} onKeyDown={handleKeyDown} role="presentation">
      <AgentCardNode {...props} />
    </div>
  );
};

const NODE_TYPES = { agentCard: TraceAgentCardNode };

export const TraceFlowView: React.FC<TraceFlowViewProps> = ({
  spanTree,
  totalDuration: _totalDuration,
  selectedSpan: _selectedSpan,
  onSelectSpan,
  isLoading,
  loadError,
}) => {
  // Categorize spans and build CelestialMap data
  const categorizedTree = useMemo(() => categorizeSpanTree(spanTree), [spanTree]);

  const { mapData, spanMap } = useMemo(() => {
    if (categorizedTree.length === 0) {
      return {
        mapData: { root: { nodes: [] as any[], edges: [] as any[] } },
        spanMap: new Map<string, CategorizedSpan>(),
      };
    }

    const { nodes, edges } = spansToFlow(categorizedTree);
    const map = new Map<string, CategorizedSpan>();

    const collectSpans = (spans: CategorizedSpan[]) => {
      for (const span of spans) {
        map.set(span.spanId || span.id, span);
        if (span.children && span.children.length > 0) {
          collectSpans(span.children as CategorizedSpan[]);
        }
      }
    };
    collectSpans(categorizedTree);

    return { mapData: { root: { nodes, edges } }, spanMap: map };
  }, [categorizedTree]);

  const contextValue = useMemo<TraceFlowContextValue>(() => ({ onSelectSpan, spanMap }), [
    onSelectSpan,
    spanMap,
  ]);

  // Deselect when clicking the ReactFlow background pane
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.react-flow__pane')) {
        onSelectSpan(null);
      }
    },
    [onSelectSpan]
  );

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
    <TraceFlowContext.Provider value={contextValue}>
      <div
        className="agentTracesFlow__container"
        role="presentation"
        onClick={handleContainerClick}
      >
        <CelestialMap
          map={mapData}
          nodeTypes={NODE_TYPES}
          layoutOptions={{ direction: 'TB', rankSeparation: 80, nodeSeparation: 40 }}
          legend={false}
          breadcrumbs={[]}
          showMinimap
          topN={Infinity}
        />
      </div>
    </TraceFlowContext.Provider>
  );
};
