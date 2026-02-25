/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiBadge,
  EuiButtonIcon,
  EuiText,
  EuiLink,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { useTraceFlyout } from './flyout/trace_flyout_context';
import { useAgentTraces, TraceRow, getChildrenFromFullTree } from './hooks/use_agent_traces';
import { useTraceMetricsContext } from './hooks/use_trace_metrics';
import { getSpanCategory, getCategoryMeta } from '../../../services/span_categorization';
import {
  useTablePagination,
  renderStatus,
  TableLoadingState,
  TableEmptyState,
} from './table_shared';
import './traces_table.scss';

export const TracesTable = () => {
  const { pageIndex, pageSize, pagination: basePagination, onTableChange } = useTablePagination(0);
  const {
    traces,
    loading,
    error,
    refresh,
    expandTrace,
    traceSpansCache,
    traceLoadingState,
  } = useAgentTraces(pageIndex, pageSize);
  const { metrics } = useTraceMetricsContext();

  const pagination = useMemo(
    () => ({
      ...basePagination,
      totalItemCount: metrics?.totalTraces ?? traces.length,
    }),
    [basePagination, metrics?.totalTraces, traces.length]
  );

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { openFlyout, updateFlyoutFullTree } = useTraceFlyout();
  const flyoutTraceIdRef = useRef<string | null>(null);

  // Sync full tree from cache to flyout when cache updates
  useEffect(() => {
    const traceId = flyoutTraceIdRef.current;
    if (!traceId) return;
    const cached = traceSpansCache.get(traceId);
    if (cached) {
      updateFlyoutFullTree(cached, false);
    }
  }, [traceSpansCache, updateFlyoutFullTree]);

  // Show error state in flyout when fetch fails (network error, etc.)
  useEffect(() => {
    const traceId = flyoutTraceIdRef.current;
    if (!traceId) return;
    const loadState = traceLoadingState.get(traceId);
    if (loadState && !loadState.loading && loadState.error) {
      updateFlyoutFullTree(undefined, false, loadState.error);
    }
  }, [traceLoadingState, updateFlyoutFullTree]);

  const toggleRowExpansion = useCallback(
    async (e: React.MouseEvent, id: string, traceId: string) => {
      e.stopPropagation();

      if (expandedRows.has(id)) {
        setExpandedRows((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return;
      }

      await expandTrace(traceId);
      setExpandedRows((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    },
    [expandedRows, expandTrace]
  );

  const handleRowClick = useCallback(
    async (item: TraceRow) => {
      flyoutTraceIdRef.current = item.traceId;
      openFlyout(item);

      const cached = traceSpansCache.get(item.traceId);
      if (cached) {
        updateFlyoutFullTree(cached, false);
        return;
      }

      await expandTrace(item.traceId);
    },
    [expandTrace, traceSpansCache, openFlyout, updateFlyoutFullTree]
  );

  // Flatten tree structure for display, respecting expanded state
  const getVisibleRows = useMemo(() => {
    const visible: TraceRow[] = [];

    const addRowAndChildren = (row: TraceRow, parentExpanded: boolean) => {
      if (parentExpanded || row.level === 0) {
        visible.push(row);
      }

      if (!expandedRows.has(row.id)) return;

      const fullTree = traceSpansCache.get(row.traceId);
      const children =
        fullTree && row.level === 0 ? getChildrenFromFullTree(fullTree, row.spanId) : row.children;

      if (children && children.length > 0) {
        children.forEach((child) => addRowAndChildren(child, true));
      }
    };

    traces.forEach((row) => addRowAndChildren(row, true));
    return visible;
  }, [traces, expandedRows, traceSpansCache]);

  const columns: Array<EuiBasicTableColumn<TraceRow>> = [
    {
      field: 'startTime',
      name: i18n.translate('agentTraces.tracesTable.timeColumn', { defaultMessage: 'Time' }),
      width: '200px',
      render: (time: string) => <EuiLink color="primary">{time}</EuiLink>,
    },
    {
      field: 'kind',
      name: i18n.translate('agentTraces.tracesTable.kindColumn', { defaultMessage: 'Kind' }),
      render: (_kind: string, item: TraceRow) => {
        const isTraceLoading = traceLoadingState.get(item.traceId)?.loading;
        return (
          <div
            className="agentTracesTable__kindCell"
            style={item.level ? { paddingLeft: `${item.level * 20}px` } : undefined}
          >
            {item.isExpandable && !isTraceLoading && (
              <EuiButtonIcon
                size="xs"
                iconType={expandedRows.has(item.id) ? 'arrowDown' : 'arrowRight'}
                onClick={(e: React.MouseEvent) => toggleRowExpansion(e, item.id, item.traceId)}
                aria-label={
                  expandedRows.has(item.id)
                    ? i18n.translate('agentTraces.tracesTable.collapse', {
                        defaultMessage: 'Collapse',
                      })
                    : i18n.translate('agentTraces.tracesTable.expand', {
                        defaultMessage: 'Expand',
                      })
                }
                color="subdued"
                iconSize="s"
              />
            )}
            {item.isExpandable && isTraceLoading && (
              <span className="agentTracesTable__spinnerWrapper">
                <EuiLoadingSpinner size="s" />
              </span>
            )}
            {!item.isExpandable && <span className="agentTracesTable__expandSpacer" />}
            {(() => {
              const category = getSpanCategory(item);
              const meta = getCategoryMeta(category);
              return (
                <EuiBadge className="agentTraces__categoryBadge" color={meta.color}>
                  {meta.label}
                </EuiBadge>
              );
            })()}
          </div>
        );
      },
    },
    {
      field: 'name',
      name: i18n.translate('agentTraces.tracesTable.nameColumn', { defaultMessage: 'Name' }),
      render: (name: string) => <EuiText size="s">{name}</EuiText>,
    },
    {
      field: 'status',
      width: '100px',
      name: i18n.translate('agentTraces.tracesTable.statusColumn', { defaultMessage: 'Status' }),
      render: renderStatus,
    },
    {
      field: 'latency',
      width: '100px',
      name: i18n.translate('agentTraces.tracesTable.latencyColumn', {
        defaultMessage: 'Latency',
      }),
      render: (latency: string) => <EuiText size="s">{latency}</EuiText>,
    },
    {
      field: 'totalTokens',
      name: i18n.translate('agentTraces.tracesTable.tokensColumn', { defaultMessage: 'Tokens' }),
      render: (tokens: number | string) => <EuiText size="s">{tokens}</EuiText>,
    },
    {
      field: 'input',
      name: i18n.translate('agentTraces.tracesTable.inputColumn', { defaultMessage: 'Input' }),
      width: '175px',
      render: (input: string) => (
        <EuiText size="s" className="agentTracesTable__truncatedText">
          {input}
        </EuiText>
      ),
    },
    {
      field: 'output',
      name: i18n.translate('agentTraces.tracesTable.outputColumn', { defaultMessage: 'Output' }),
      width: '175px',
      render: (output: string) => (
        <EuiText size="s" className="agentTracesTable__truncatedText">
          {output}
        </EuiText>
      ),
    },
  ];

  if (loading && traces.length === 0) {
    return (
      <TableLoadingState
        message={
          <FormattedMessage
            id="agentTraces.tracesTable.loading"
            defaultMessage="Loading agent traces..."
          />
        }
      />
    );
  }

  // upstream component will handle error state
  if (error) {
    return null;
  }

  if (traces.length === 0) {
    return (
      <TableEmptyState
        title={
          <FormattedMessage
            id="agentTraces.tracesTable.emptyTitle"
            defaultMessage="No agent traces found"
          />
        }
        onRefresh={refresh}
        refreshLabel={
          <FormattedMessage id="agentTraces.tracesTable.refreshButton" defaultMessage="Refresh" />
        }
      />
    );
  }

  return (
    <div className="agentTracesTable__container">
      <EuiText size="s" color="subdued">
        <FormattedMessage
          id="agentTraces.tracesTable.showingCount"
          defaultMessage="Showing {count} traces"
          values={{ count: metrics?.totalTraces ?? traces.length }}
        />
      </EuiText>
      <EuiBasicTable
        items={getVisibleRows}
        columns={columns}
        tableLayout="auto"
        hasActions={false}
        compressed
        loading={loading}
        pagination={pagination}
        onChange={onTableChange}
        rowProps={(item: TraceRow) => ({
          onClick: () => handleRowClick(item),
          className: 'agentTracesTable__clickableRow',
        })}
      />
    </div>
  );
};
