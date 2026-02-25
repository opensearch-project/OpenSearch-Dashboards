/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiText,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import './traces_table.scss';
import './flyout/trace_details_flyout.scss';
import { useTraceFlyout } from './flyout/trace_flyout_context';
import { TraceRow } from './hooks/use_agent_traces';
import { useAgentSpans, SpanRow } from './hooks/use_agent_spans';
import { useTraceMetricsContext } from './hooks/use_trace_metrics';
import { getSpanCategory, getCategoryBadgeStyle } from '../../../services/span_categorization';
import { CATEGORY_BADGE_CLASS } from './flyout/tree_helpers';
import {
  useTablePagination,
  renderStatus,
  TableLoadingState,
  TableErrorState,
  TableEmptyState,
} from './table_shared';

export const SpansTable = () => {
  const { pageIndex, pageSize, pagination: basePagination, onTableChange } = useTablePagination(0);
  const { spans, loading, error, refresh, expandSpan, spanSpansCache } = useAgentSpans(
    pageIndex,
    pageSize
  );
  const { metrics } = useTraceMetricsContext();

  const pagination = useMemo(
    () => ({
      ...basePagination,
      totalItemCount: metrics?.totalSpans ?? spans.length,
    }),
    [basePagination, metrics?.totalSpans, spans.length]
  );

  // Reset to first page when current page is beyond available results
  useEffect(() => {
    if (!loading && spans.length === 0 && pageIndex > 0) {
      // handled by useTablePagination query reset
    }
  }, [loading, spans.length, pageIndex]);

  const { openFlyout, updateFlyoutFullTree } = useTraceFlyout();
  const flyoutTraceIdRef = useRef<string | null>(null);

  // Sync full tree from cache to flyout when cache updates
  useEffect(() => {
    const traceId = flyoutTraceIdRef.current;
    if (!traceId) return;
    const cached = spanSpansCache.get(traceId);
    if (cached) {
      updateFlyoutFullTree((cached as unknown) as TraceRow[], false);
    }
  }, [spanSpansCache, updateFlyoutFullTree]);

  const handleRowClick = useCallback(
    async (item: SpanRow) => {
      flyoutTraceIdRef.current = item.traceId;
      openFlyout((item as unknown) as TraceRow);

      const cached = spanSpansCache.get(item.traceId);
      if (cached) {
        updateFlyoutFullTree((cached as unknown) as TraceRow[], false);
        return;
      }

      await expandSpan(item.traceId);
    },
    [expandSpan, spanSpansCache, openFlyout, updateFlyoutFullTree]
  );

  const columns: Array<EuiBasicTableColumn<SpanRow>> = [
    {
      field: 'startTime',
      name: i18n.translate('agentTraces.spansTable.timeColumn', { defaultMessage: 'Time' }),
      width: '200px',
      render: (time: string) => <EuiLink color="primary">{time}</EuiLink>,
    },
    {
      field: 'kind',
      name: i18n.translate('agentTraces.spansTable.kindColumn', { defaultMessage: 'Kind' }),
      render: (_kind: string, item: SpanRow) => {
        const category = getSpanCategory(item);
        const modifier = CATEGORY_BADGE_CLASS[category];
        return (
          <span
            className={`agentTracesFlyout__kindBadge agentTracesFlyout__kindBadge--${modifier}`}
            style={getCategoryBadgeStyle(category)}
          >
            {category}
          </span>
        );
      },
    },
    {
      field: 'name',
      name: i18n.translate('agentTraces.spansTable.nameColumn', { defaultMessage: 'Name' }),
      render: (name: string) => <EuiText size="s">{name}</EuiText>,
    },
    {
      field: 'status',
      width: '100px',
      name: i18n.translate('agentTraces.spansTable.statusColumn', { defaultMessage: 'Status' }),
      render: renderStatus,
    },
    {
      field: 'latency',
      width: '100px',
      name: i18n.translate('agentTraces.spansTable.latencyColumn', { defaultMessage: 'Latency' }),
      render: (latency: string) => <EuiText size="s">{latency}</EuiText>,
    },
    {
      field: 'totalTokens',
      name: i18n.translate('agentTraces.spansTable.tokensColumn', { defaultMessage: 'Tokens' }),
      render: (tokens: number | string) => <EuiText size="s">{tokens}</EuiText>,
    },
    {
      field: 'input',
      name: i18n.translate('agentTraces.spansTable.inputColumn', { defaultMessage: 'Input' }),
      width: '175px',
      render: (input: string) => (
        <EuiText size="s" className="agentTracesTable__truncatedText">
          {input}
        </EuiText>
      ),
    },
    {
      field: 'output',
      name: i18n.translate('agentTraces.spansTable.outputColumn', { defaultMessage: 'Output' }),
      width: '175px',
      render: (output: string) => (
        <EuiText size="s" className="agentTracesTable__truncatedText">
          {output}
        </EuiText>
      ),
    },
  ];

  if (loading && spans.length === 0) {
    return (
      <TableLoadingState
        message={
          <FormattedMessage
            id="agentTraces.spansTable.loadingText"
            defaultMessage="Loading agent spans..."
          />
        }
      />
    );
  }

  // upstream component will handle error state
  if (error) {
    return null;
  }

  if (spans.length === 0) {
    return (
      <TableEmptyState
        title={
          <FormattedMessage
            id="agentTraces.spansTable.emptyTitle"
            defaultMessage="No agent spans found"
          />
        }
        onRefresh={refresh}
        refreshLabel={
          <FormattedMessage id="agentTraces.spansTable.refreshButton" defaultMessage="Refresh" />
        }
      />
    );
  }

  return (
    <>
      <div className="agentTracesTable__container">
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="agentTraces.spansTable.showingCount"
            defaultMessage="Showing {count} spans"
            values={{ count: metrics?.totalSpans ?? spans.length }}
          />
        </EuiText>
        <EuiBasicTable
          items={spans}
          columns={columns}
          tableLayout="auto"
          hasActions={false}
          compressed
          loading={loading}
          pagination={pagination}
          onChange={onTableChange}
          rowProps={(item: SpanRow) => ({
            onClick: () => handleRowClick(item),
            className: 'agentTracesTable__clickableRow',
          })}
        />
      </div>
    </>
  );
};
