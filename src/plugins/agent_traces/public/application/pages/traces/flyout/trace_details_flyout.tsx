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
  EuiHealth,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiButtonIcon,
  EuiCopy,
  EuiResizableContainer,
  EuiBadge,
  EuiLink,
} from '@elastic/eui';
import { TraceRow } from '../hooks/tree_utils';
import { TraceFlowView } from '../flow/trace_flow_view';
import { parseLatencyMs } from '../trace_details/utils/span_timerange_utils';
import { getSpanCategory, getCategoryMeta } from '../../../../services/span_categorization';
import {
  TreeNode,
  buildTreeFromTraceRow,
  flattenTree,
  countSpans,
  flattenVisibleNodes,
  calculateTimelineRange,
  collectExpandableIds,
} from './tree_helpers';
import { TraceTreeView } from './trace_tree_view';
import { TimelineGantt } from './timeline_gantt';
import { useFlyoutResize } from './use_flyout_resize';
import { FlyoutDetailPanel } from './flyout_detail_panel';
import { FlyoutHistoryNav } from './flyout_history_nav';
import { FlyoutNavigation } from './trace_flyout_state';
import { readAttribute } from '../hooks/genai_message_preview';
import { SessionRow } from '../../sessions/session_utils';
import './trace_details_flyout.scss';

export interface TraceDetailsProps {
  trace: TraceRow;
  onClose: () => void;
  fullTree?: TraceRow[];
  isLoadingFullTree?: boolean;
  fullTreeError?: string;
  /** Open this trace's session (replaces this flyout with the session flyout). */
  onOpenSession?: (session: SessionRow | string) => void;
  /** Back and Forward through the flyouts the user moved between. */
  navigation?: FlyoutNavigation;
}

/** The trace's session id: the first span carrying gen_ai.conversation.id. */
export const sessionIdOf = (rows: Array<TraceRow | undefined>): string | undefined => {
  for (const row of rows) {
    const value = readAttribute(row?.rawDocument, 'gen_ai.conversation.id');
    if (typeof value === 'string' && value) return value;
  }
  return undefined;
};

export const TraceDetailsFlyout: React.FC<TraceDetailsProps> = ({
  trace,
  onClose,
  fullTree,
  isLoadingFullTree,
  fullTreeError,
  onOpenSession,
  navigation,
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
  const sessionId = useMemo(
    () => sessionIdOf([trace, ...flatNodes.map((node) => node.traceRow)]),
    [trace, flatNodes]
  );

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

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const expandAll = useCallback(
    () => setExpandedNodes(collectExpandableIds(traceTreeData)),
    [traceTreeData]
  );
  const collapseAll = useCallback(() => setExpandedNodes(new Set()), []);

  // Expand everything when the tree's spans change (a new trace, or its full tree arriving),
  // not when the same tree is sent again, so the user's expand/collapse choices stay.
  const expandableKey = useMemo(
    () => [...collectExpandableIds(traceTreeData)].sort().join(','),
    [traceTreeData]
  );
  useEffect(() => {
    expandAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandableKey]);

  const timelineVisibleSpans = useMemo(
    () => flattenVisibleNodes(traceTreeData, expandedNodes),
    [traceTreeData, expandedNodes]
  );

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
  const meta = getCategoryMeta(getSpanCategory(rootTrace));

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
        <FlyoutHistoryNav navigation={navigation} />
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiTitle size="m">
              <h2 id="trace-details-flyout">
                {i18n.translate('agentTraces.flyout.traceTitle', {
                  defaultMessage: 'Trace: {name}',
                  values: { name: rootTrace.name || '—' },
                })}
              </h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge
              className="agentTraces__categoryBadge"
              color={meta.bgColor}
              style={{ color: meta.textColor }}
            >
              {meta.label}
            </EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiHealth color={rootTrace.status === 'success' ? 'success' : 'danger'}>
              {rootTrace.status === 'success'
                ? i18n.translate('agentTraces.flyout.statusSuccess', {
                    defaultMessage: 'Success',
                  })
                : i18n.translate('agentTraces.flyout.statusError', {
                    defaultMessage: 'Error',
                  })}
            </EuiHealth>
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

          {sessionId && onOpenSession && (
            <div className="agentTracesFlyout__metaItem">
              <EuiText size="xs" className="agentTracesFlyout__metaLabel">
                {i18n.translate('agentTraces.flyout.sessionId', {
                  defaultMessage: 'SESSION ID',
                })}
              </EuiText>
              <EuiText size="xs" className="agentTracesFlyout__metaValue">
                <EuiLink
                  onClick={() => onOpenSession(sessionId)}
                  data-test-subj="agentTracesFlyoutSessionLink"
                >
                  <code>{sessionId}</code>
                </EuiLink>
              </EuiText>
            </div>
          )}

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
              {rootTrace.totalTokens || '—'}
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
                          onExpandAll={expandAll}
                          onCollapseAll={collapseAll}
                        />
                      ),
                    },
                    {
                      id: 'agent-graph',
                      name: i18n.translate('agentTraces.flyout.tabAgentGraph', {
                        defaultMessage: 'Trace Map',
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
