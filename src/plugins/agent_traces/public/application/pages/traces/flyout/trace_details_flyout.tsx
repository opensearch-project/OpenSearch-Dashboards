/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTabbedContent,
  EuiIcon,
  EuiBadge,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiButtonIcon,
  EuiCopy,
  EuiResizableContainer,
} from '@elastic/eui';
import { TraceRow } from '../hooks/use_agent_traces';
import { TraceFlowView } from '../flow/trace_flow_view';
import {
  TreeNode,
  buildTreeFromTraceRow,
  flattenTree,
  countSpans,
  sumTokens,
  parseLatencyMs,
  flattenVisibleNodes,
  calculateTimelineRange,
} from './tree_helpers';
import { TraceTreeView } from './trace_tree_view';
import { TimelineGantt } from './timeline_gantt';
import { useFlyoutResize } from './use_flyout_resize';
import { FlyoutDetailPanel } from './flyout_detail_panel';
import './trace_details_flyout.scss';

export interface TraceDetailsProps {
  trace: TraceRow;
  onClose: () => void;
  fullTree?: TraceRow[];
  isLoadingFullTree?: boolean;
  fullTreeError?: string;
}

export const TraceDetailsFlyout: React.FC<TraceDetailsProps> = ({
  trace,
  onClose,
  fullTree,
  isLoadingFullTree,
  fullTreeError,
}) => {
  const rootTrace = useMemo(() => {
    if (fullTree && fullTree.length > 0) return fullTree[0];
    return trace;
  }, [fullTree, trace]);

  const traceTreeData = useMemo(() => {
    if (fullTree && fullTree.length > 0) {
      return fullTree.map((root) => buildTreeFromTraceRow(root));
    }
    return [buildTreeFromTraceRow(trace)];
  }, [trace, fullTree]);

  const flatNodes = useMemo(() => flattenTree(traceTreeData), [traceTreeData]);

  const initialIndex = flatNodes.findIndex((node) => node.id === trace.id);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  useEffect(() => {
    const idx = flatNodes.findIndex((node) => node.id === trace.id);
    setSelectedNodeIndex(idx >= 0 ? idx : 0);
  }, [flatNodes, trace.id]);

  const selectedNode = flatNodes[selectedNodeIndex];
  const selectedTraceRow = selectedNode?.traceRow;

  const flowSpanTree = useMemo(() => {
    if (fullTree && fullTree.length > 0) return fullTree;
    return [trace];
  }, [trace, fullTree]);

  const flowTotalDuration = useMemo(() => parseLatencyMs(trace.latency), [trace.latency]);

  const handleFlowSelectSpan = useCallback(
    (span: TraceRow | null) => {
      if (!span) return;
      const id = span.spanId || span.id;
      const index = flatNodes.findIndex((n) => n.id === id);
      if (index >= 0) {
        setSelectedNodeIndex(index);
      }
    },
    [flatNodes]
  );

  const totalSpans = useMemo(() => countSpans(traceTreeData), [traceTreeData]);
  const totalTokens = useMemo(() => {
    const sum = sumTokens(traceTreeData);
    return sum > 0 ? sum : trace.totalTokens;
  }, [traceTreeData, trace.totalTokens]);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const allExpandable = new Set<string>();
    const collectExpandable = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          allExpandable.add(node.id);
          collectExpandable(node.children);
        }
      });
    };
    collectExpandable(traceTreeData);
    setExpandedNodes(allExpandable);
  }, [traceTreeData]);

  const timelineVisibleSpans = useMemo(() => flattenVisibleNodes(traceTreeData, expandedNodes), [
    traceTreeData,
    expandedNodes,
  ]);

  const timelineRange = useMemo(() => calculateTimelineRange(traceTreeData), [traceTreeData]);

  const { flyoutWidth, isResizingFlyout, handleFlyoutMouseDown } = useFlyoutResize();

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAncestors = (nodeId: string) => {
    const findPath = (
      nodes: TreeNode[],
      targetId: string,
      path: string[] = []
    ): string[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) return path;
        if (node.children) {
          const result = findPath(node.children, targetId, [...path, node.id]);
          if (result) return result;
        }
      }
      return null;
    };
    const ancestors = findPath(traceTreeData, nodeId);
    if (ancestors && ancestors.length > 0) {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        ancestors.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const selectNode = (nodeId: string) => {
    const index = flatNodes.findIndex((n) => n.id === nodeId);
    if (index >= 0) {
      expandAncestors(nodeId);
      setSelectedNodeIndex(index);
    }
  };

  return (
    <EuiFlyout
      className="agentTracesFlyout"
      onClose={onClose}
      ownFocus={false}
      size="l"
      aria-labelledby="trace-details-flyout"
      style={{ ...(flyoutWidth && { width: `${flyoutWidth}px` }), maxWidth: '95vw' }}
    >
      <div
        className={`agentTracesFlyout__flyoutResizer${
          isResizingFlyout ? ' agentTracesFlyout__flyoutResizer--active' : ''
        }`}
        onMouseDown={handleFlyoutMouseDown}
      />

      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiTitle size="m">
              <h2 id="trace-details-flyout">{rootTrace.name || '—'}</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color={rootTrace.status === 'success' ? 'success' : 'danger'}>
              {rootTrace.status === 'success'
                ? i18n.translate('agentTraces.flyout.statusSuccess', {
                    defaultMessage: 'SUCCESS',
                  })
                : i18n.translate('agentTraces.flyout.statusError', {
                    defaultMessage: 'ERROR',
                  })}
            </EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="s" />

        <div className="agentTracesFlyout__metaRow">
          <div className="agentTracesFlyout__metaItem">
            <EuiIcon type="clock" size="s" color="subdued" />
            <EuiText size="xs" color="subdued">
              {rootTrace.startTime || '—'}
            </EuiText>
          </div>

          <div className="agentTracesFlyout__metaItem">
            <EuiText size="xs" className="agentTracesFlyout__metaLabel">
              {i18n.translate('agentTraces.flyout.traceId', {
                defaultMessage: 'TRACE ID',
              })}
            </EuiText>
            <EuiText size="xs" className="agentTracesFlyout__metaValue">
              <code>{rootTrace.traceId || '—'}</code>
            </EuiText>
            {rootTrace.traceId && (
              <EuiCopy textToCopy={rootTrace.traceId}>
                {(copy) => (
                  <EuiButtonIcon
                    size="xs"
                    iconType="copy"
                    onClick={copy}
                    aria-label={i18n.translate('agentTraces.flyout.copyTraceId', {
                      defaultMessage: 'Copy trace ID',
                    })}
                  />
                )}
              </EuiCopy>
            )}
          </div>

          <div className="agentTracesFlyout__metaItem">
            <EuiText size="xs" className="agentTracesFlyout__metaLabel">
              {i18n.translate('agentTraces.flyout.duration', {
                defaultMessage: 'DURATION',
              })}
            </EuiText>
            <EuiText size="xs" className="agentTracesFlyout__metaValue">
              {rootTrace.latency || '—'}
            </EuiText>
          </div>

          <div className="agentTracesFlyout__metaItem">
            <EuiText size="xs" className="agentTracesFlyout__metaLabel">
              {i18n.translate('agentTraces.flyout.spans', {
                defaultMessage: 'SPANS',
              })}
            </EuiText>
            <EuiText size="xs" className="agentTracesFlyout__metaValue">
              {totalSpans}
            </EuiText>
          </div>

          <div className="agentTracesFlyout__metaItem">
            <EuiText size="xs" className="agentTracesFlyout__metaLabel">
              {i18n.translate('agentTraces.flyout.tokens', {
                defaultMessage: 'TOKENS',
              })}
            </EuiText>
            <EuiText size="xs" className="agentTracesFlyout__metaValue">
              {totalTokens || '—'}
            </EuiText>
          </div>
        </div>

        <EuiSpacer size="s" />
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiResizableContainer direction="horizontal">
          {(EuiResizablePanel, EuiResizableButton) => (
            <>
              <EuiResizablePanel initialSize={50} minSize="200px" paddingSize="none">
                {(() => {
                  const leftTabs = [
                    {
                      id: 'trace-tree',
                      name: i18n.translate('agentTraces.flyout.tabTraceTree', {
                        defaultMessage: 'Trace Tree',
                      }),
                      content: (
                        <TraceTreeView
                          traceTreeData={traceTreeData}
                          selectedNode={selectedNode}
                          expandedNodes={expandedNodes}
                          isLoadingFullTree={isLoadingFullTree}
                          fullTreeError={fullTreeError}
                          onSelectNode={selectNode}
                          onToggleExpanded={toggleExpanded}
                        />
                      ),
                    },
                    {
                      id: 'agent-graph',
                      name: i18n.translate('agentTraces.flyout.tabAgentGraph', {
                        defaultMessage: 'Agent Graph',
                      }),
                      content: (
                        <TraceFlowView
                          spanTree={flowSpanTree}
                          totalDuration={flowTotalDuration}
                          selectedSpan={selectedTraceRow || null}
                          onSelectSpan={handleFlowSelectSpan}
                          isLoading={isLoadingFullTree}
                          loadError={fullTreeError}
                        />
                      ),
                    },
                    {
                      id: 'timeline',
                      name: i18n.translate('agentTraces.flyout.tabTimeline', {
                        defaultMessage: 'Timeline',
                      }),
                      content: (
                        <TimelineGantt
                          timelineVisibleSpans={timelineVisibleSpans}
                          timelineRange={timelineRange}
                          selectedNodeId={selectedNode?.id}
                          expandedNodes={expandedNodes}
                          isLoadingFullTree={isLoadingFullTree}
                          fullTreeError={fullTreeError}
                          onSelectNode={selectNode}
                          onToggleExpanded={toggleExpanded}
                        />
                      ),
                    },
                  ];
                  return (
                    <EuiTabbedContent
                      tabs={leftTabs}
                      initialSelectedTab={leftTabs[0]}
                      size="s"
                      className="agentTracesFlyout__tabbedContent"
                    />
                  );
                })()}
              </EuiResizablePanel>

              <EuiResizableButton />

              <EuiResizablePanel initialSize={50} minSize="200px" paddingSize="none">
                <FlyoutDetailPanel
                  selectedNode={selectedNode}
                  selectedTraceRow={selectedTraceRow}
                  onSelectNode={selectNode}
                />
              </EuiResizablePanel>
            </>
          )}
        </EuiResizableContainer>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
