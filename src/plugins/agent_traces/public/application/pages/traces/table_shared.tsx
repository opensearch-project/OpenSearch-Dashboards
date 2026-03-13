/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiSwitch,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment-timezone';
import { useTabResults } from '../../utils/hooks/use_tab_results';
import { useDatasetContext } from '../../context/dataset_context/dataset_context';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../types';
import { selectColumns, selectSort } from '../../utils/state_management/selectors';
import { setColumns, setSort } from '../../utils/state_management/slices/legacy/legacy_slice';
import { getLegacyDisplayedColumns } from '../../../helpers/data_table_helper';
import { SortOrder } from '../../../types/saved_agent_traces_types';
import {
  executeQueries,
  defaultPrepareQueryString,
} from '../../utils/state_management/actions/query_actions';
import {
  DOC_HIDE_TIME_COLUMN_SETTING,
  SAMPLE_SIZE_SETTING,
  AGENT_TRACES_DEFAULT_COLUMNS,
} from '../../../../common';
import { UI_SETTINGS } from '../../../../../data/public';
import { getDocViewsRegistry } from '../../legacy/discover/opensearch_dashboards_services';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../../types/doc_views_types';
import { useChangeQueryEditor } from '../../hooks';
import { traceHitToAgentSpan, unflattenSource } from './hooks/span_transforms';
import { BaseRow, spanToRow, formatTimestamp } from './hooks/tree_utils';
import { TraceHit } from './trace_details/traces/ppl_to_trace_hits';
import { selectIsLoading } from '../../utils/state_management/selectors/query_editor/query_editor';
import { RootState } from '../../utils/state_management/store';
import { useTraceMetricsContext } from './hooks/use_trace_metrics';

/** Maps UI column field names to PPL index field names */
export const PPL_SORT_FIELDS: Record<string, string> = {
  startTime: 'startTime',
  kind: '`attributes.gen_ai.operation.name`',
  latency: 'durationInNanos',
  name: 'name',
  status: '`status.code`',
};

/** Build a PPL sort clause from UI sort state */
export const buildPplSortClause = (field: string, direction: 'asc' | 'desc'): string => {
  const pplField = PPL_SORT_FIELDS[field] || (field.includes('.') ? `\`${field}\`` : field);
  const prefix = direction === 'desc' ? '- ' : '';
  return `| sort ${prefix}${pplField}`;
};

/**
 * Splits a PPL query string into the source+where portion and remaining
 * non-where commands (head, sort, dedup, eval, etc.).
 *
 * This ensures user-entered non-where commands (like `| head 1`) are placed
 * after hardcoded where clauses when assembling the final query.
 */
export const splitPplWhereAndTail = (
  queryString: string
): { whereQuery: string; tailCommands: string } => {
  const parts = queryString.split(/\s*\|\s*/);
  const whereParts: string[] = [];
  const tailParts: string[] = [];
  let tailStarted = false;

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    if (!tailStarted && (lower.startsWith('source') || lower.startsWith('where'))) {
      whereParts.push(trimmed);
    } else {
      tailStarted = true;
      tailParts.push(trimmed);
    }
  }

  return {
    whereQuery: whereParts.join(' | '),
    tailCommands: tailParts.length > 0 ? '| ' + tailParts.join(' | ') : '',
  };
};

/**
 * Checks if the main query ends with a head command (optionally followed by `from N` or `| where`).
 * Subquery brackets [...] are masked so that head inside subqueries is ignored.
 *
 * Aligned with the explore plugin's queryEndsWithHead implementation.
 */
export const queryEndsWithHead = (queryString: string): boolean => {
  const masked = queryString.replace(/\[.*?\]/g, (match) => '\0'.repeat(match.length));
  return /\|\s*head\b(\s+\d+)?(\s+from\s+\d+)?\s*(\|\s*where\b.*)?\s*$/i.test(masked);
};

/** Shared loading state */
export const TableLoadingState: React.FC<{ message: React.ReactNode }> = ({ message }) => (
  <EuiEmptyPrompt
    icon={<EuiLoadingSpinner size="xl" />}
    body={
      <EuiText size="s" color="subdued">
        {message}
      </EuiText>
    }
  />
);

/** Shared empty state */
export const TableEmptyState: React.FC<{
  title: React.ReactNode;
}> = ({ title }) => (
  <EuiEmptyPrompt
    iconType="apmTrace"
    title={<h3>{title}</h3>}
    body={
      <p>
        <FormattedMessage
          id="agentTraces.table.emptyBody"
          defaultMessage="No AI agent spans were found in the {indexName} index. Make sure your application is instrumented with OpenTelemetry and is sending spans with {attributeName} attribute."
          values={{
            indexName: <code>otel-v1-apm-span-*</code>,
            attributeName: <code>gen_ai.operation.name</code>,
          }}
        />
      </p>
    }
  />
);

/** Convert an OpenSearchSearchHit _source to a BaseRow for metadata.
 *  The _source from OpenSearch uses flat dotted keys, so we unflatten first.
 *  When `markExpandable` is true, root spans (no parentSpanId) are expandable. */
export const hitToBaseRow = (
  hit: OpenSearchSearchHit<Record<string, any>>,
  formatTs: (ts: string) => string,
  options?: { markExpandable?: boolean }
): BaseRow => {
  const source = unflattenSource(hit._source || {}) as TraceHit;
  const span = traceHitToAgentSpan(source, 0);
  const row = spanToRow(span, 0, formatTs);
  row.isExpandable = options?.markExpandable ? !source.parentSpanId : false;
  row.level = 0;
  return row;
};

interface DataTableCoreOptions {
  defaultColumns: string[];
}

export const useDataTableCore = ({ defaultColumns }: DataTableCoreOptions) => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const { uiSettings } = services;
  const dispatch = useDispatch();

  const columns = useSelector(selectColumns);
  const { dataset } = useDatasetContext();
  const { results } = useTabResults();
  const isQueryLoading = useSelector(selectIsLoading);
  const { isInitialized } = useSelector((state: RootState) => state.meta);
  const { metrics: traceMetrics } = useTraceMetricsContext();
  const query = useSelector((state: RootState) => state.query);

  // When user query has head command, hide "of X total" (total is meaningless with head)
  const hasHead = useMemo(() => {
    if (query.language !== 'PPL') return false;
    try {
      return queryEndsWithHead(defaultPrepareQueryString(query));
    } catch {
      return false;
    }
  }, [query]);

  const sortOrder = useSelector(selectSort);

  useEffect(() => {
    const timeField = dataset?.timeFieldName;
    if (sortOrder.length === 0 && timeField) {
      dispatch(setSort([[timeField, 'desc']]));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSortChange = useCallback(
    (newSort: SortOrder[]) => {
      // When sort is cleared, fall back to default time desc
      const timeField = dataset?.timeFieldName;
      const effectiveSort =
        newSort.length === 0 && timeField ? [[timeField, 'desc'] as SortOrder] : newSort;
      dispatch(setSort(effectiveSort));
      dispatch(executeQueries({ services }) as any);
    },
    [dispatch, services, dataset]
  );

  // Wrap cell text toggle
  const [wrapCellText, setWrapCellText] = useState(false);

  const docViewsRegistry = useMemo(() => getDocViewsRegistry(), []);
  const sampleSize = uiSettings.get(SAMPLE_SIZE_SETTING);

  const timezone = useMemo(() => {
    const tz = uiSettings?.get('dateFormat:tz');
    if (tz && tz !== 'Browser') return tz;
    return moment.tz.guess() || moment().format('Z');
  }, [uiSettings]);

  const formatTs = useCallback((ts: string) => formatTimestamp(ts, timezone), [timezone]);

  // Initialize columns to defaults on mount if they don't contain any
  // agent traces virtual columns (e.g., first visit or migrating from old EuiTable columns).
  useEffect(() => {
    const traceOnlyVirtualColumns = ['latency', 'totalTokens', 'status'];
    const hasTraceVirtualColumns = columns.some((c) => traceOnlyVirtualColumns.includes(c));
    if (
      columns.length === 0 ||
      (columns.length === 1 && columns[0] === '_source') ||
      !hasTraceVirtualColumns
    ) {
      dispatch(setColumns(defaultColumns));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Retain previous results while a new query loads (e.g. sort change)
  const prevHitsRef = useRef<Array<OpenSearchSearchHit<Record<string, any>>>>([]);
  const hits: Array<OpenSearchSearchHit<Record<string, any>>> = useMemo(() => {
    const newHits = results?.hits?.hits || [];
    if (newHits.length > 0) {
      prevHitsRef.current = newHits;
      return newHits;
    }
    return isQueryLoading ? prevHitsRef.current : newHits;
  }, [results, isQueryLoading]);

  const displayedColumns = useMemo(() => {
    if (!dataset) return [];
    return getLegacyDisplayedColumns(
      columns,
      dataset,
      uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE),
      uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING)
    );
  }, [columns, dataset, uiSettings]);

  const onRemoveColumn = useCallback(
    (column: string) => {
      if (AGENT_TRACES_DEFAULT_COLUMNS.includes(column)) return;
      const newColumns = columns.filter((c) => c !== column);
      dispatch(setColumns(newColumns.length > 0 ? newColumns : ['_source']));
    },
    [columns, dispatch]
  );

  const onAddColumn = useCallback(
    (column: string) => {
      if (!columns.includes(column)) {
        const newColumns = columns[0] === '_source' ? [column] : [...columns, column];
        dispatch(setColumns(newColumns));
      }
    },
    [columns, dispatch]
  );

  const { onAddFilter } = useChangeQueryEditor();

  return {
    services,
    uiSettings,
    dispatch,
    dataset,
    results,
    hits,
    isQueryLoading,
    isInitialized,
    traceMetrics,
    formatTs,
    sortOrder,
    handleSortChange,
    displayedColumns,
    columns,
    onRemoveColumn,
    onAddColumn,
    hasHead,
    onAddFilter: onAddFilter as DocViewFilterFn,
    docViewsRegistry,
    sampleSize,
    wrapCellText,
    setWrapCellText,
  };
};

interface DataTableInfoBarProps {
  hasHead: boolean;
  hitsCount: number;
  totalCount: number;
  elapsedMs: number | undefined;
  entityName: 'span' | 'trace';
  wrapCellText: boolean;
  onWrapCellTextChange: (v: boolean) => void;
}

interface InfoBarCountProps {
  hasHead: boolean;
  hitsCount: number;
  totalCount: number;
  elapsedMs: number | undefined;
}

const SpanCountMessage: React.FC<InfoBarCountProps> = ({
  hasHead,
  hitsCount,
  totalCount,
  elapsedMs,
}) =>
  hasHead ? (
    <FormattedMessage
      id="agentTraces.spansDataTable.showingCountHeadOnly"
      defaultMessage="{count} {count, plural, one {span} other {spans}} in {elapsed} ms"
      values={{
        count: <strong>{hitsCount.toLocaleString()}</strong>,
        elapsed: <strong>{elapsedMs != null ? elapsedMs.toLocaleString() : '—'}</strong>,
      }}
    />
  ) : (
    <FormattedMessage
      id="agentTraces.spansDataTable.showingCount"
      defaultMessage="{count} of {total} {totalCount, plural, one {span} other {spans}} in {elapsed} ms"
      values={{
        count: <strong>{hitsCount.toLocaleString()}</strong>,
        total: <strong>{totalCount.toLocaleString()}</strong>,
        totalCount,
        elapsed: <strong>{elapsedMs != null ? elapsedMs.toLocaleString() : '—'}</strong>,
      }}
    />
  );

const TraceCountMessage: React.FC<InfoBarCountProps> = ({
  hasHead,
  hitsCount,
  totalCount,
  elapsedMs,
}) =>
  hasHead ? (
    <FormattedMessage
      id="agentTraces.tracesDataTable.showingCountHeadOnly"
      defaultMessage="{count} {count, plural, one {trace} other {traces}} in {elapsed} ms"
      values={{
        count: <strong>{hitsCount.toLocaleString()}</strong>,
        elapsed: <strong>{elapsedMs != null ? elapsedMs.toLocaleString() : '—'}</strong>,
      }}
    />
  ) : (
    <FormattedMessage
      id="agentTraces.tracesDataTable.showingCount"
      defaultMessage="{count} of {total} {totalCount, plural, one {trace} other {traces}} in {elapsed} ms"
      values={{
        count: <strong>{hitsCount.toLocaleString()}</strong>,
        total: <strong>{totalCount.toLocaleString()}</strong>,
        totalCount,
        elapsed: <strong>{elapsedMs != null ? elapsedMs.toLocaleString() : '—'}</strong>,
      }}
    />
  );

export const DataTableInfoBar: React.FC<DataTableInfoBarProps> = ({
  hasHead,
  hitsCount,
  totalCount,
  elapsedMs,
  entityName,
  wrapCellText,
  onWrapCellTextChange,
}) => {
  const CountMessage = entityName === 'span' ? SpanCountMessage : TraceCountMessage;

  return (
    <EuiFlexGroup
      className="agentTracesTable__infoBar"
      alignItems="center"
      justifyContent="spaceBetween"
      gutterSize="m"
    >
      <EuiFlexItem grow={false}>
        <EuiText size="s">
          <CountMessage
            hasHead={hasHead}
            hitsCount={hitsCount}
            totalCount={totalCount}
            elapsedMs={elapsedMs}
          />
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiSwitch
          label={
            entityName === 'span'
              ? i18n.translate('agentTraces.spansDataTable.wrapCellText', {
                  defaultMessage: 'Wrap cell text',
                })
              : i18n.translate('agentTraces.tracesDataTable.wrapCellText', {
                  defaultMessage: 'Wrap cell text',
                })
          }
          checked={wrapCellText}
          onChange={(e) => onWrapCellTextChange(e.target.checked)}
          data-test-subj="agentTracesWrapCellTextSwitch"
          compressed
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
