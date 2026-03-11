/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { EuiText, EuiSwitch, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment-timezone';
import { DataTable } from '../../../components/data_table/data_table';
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
import { TraceExpansionProvider, RowMeta } from './trace_expansion_context';
import { traceHitToAgentSpan, unflattenSource } from './hooks/span_transforms';
import { BaseRow, LoadingState, spanToRow, formatTimestamp } from './hooks/tree_utils';
import { TraceHit } from './trace_details/traces/ppl_to_trace_hits';
import { TableLoadingState, TableEmptyState, queryEndsWithHead } from './table_shared';
import { selectIsLoading } from '../../utils/state_management/selectors/query_editor/query_editor';
import { RootState } from '../../utils/state_management/store';
import { getHitId } from '../../../components/data_table/table_cell/trace_utils/trace_utils';
import { useTraceMetricsContext } from './hooks/use_trace_metrics';
import { useTraceFlyout } from './flyout/trace_flyout_context';
import { TraceRow } from './hooks/use_agent_traces';
import { usePPLQueryDeps } from './hooks/use_ppl_query_deps';
import { transformPPLDataToTraceHits } from './trace_details/traces/ppl_to_trace_hits';
import { hitsToAgentSpans, buildFullSpanTree } from './hooks/tree_utils';
import './traces_table.scss';

const DEFAULT_SPAN_COLUMNS = [...AGENT_TRACES_DEFAULT_COLUMNS];

/** Convert an OpenSearchSearchHit _source to a BaseRow for metadata.
 *  The _source from OpenSearch uses flat dotted keys, so we unflatten first. */
const hitToSpanRow = (
  hit: OpenSearchSearchHit<Record<string, any>>,
  formatTs: (ts: string) => string
): BaseRow => {
  const source = unflattenSource(hit._source || {}) as TraceHit;
  const span = traceHitToAgentSpan(source, 0);
  const row = spanToRow(span, 0, formatTs);
  row.isExpandable = false;
  row.level = 0;
  return row;
};

export const SpansDataTable: React.FC = () => {
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

  // Sort state from Redux — sort changes trigger a backend PPL query re-execution
  const sortOrder = useSelector(selectSort);

  // Initialize sort to descending by time on mount if no sort is configured
  useEffect(() => {
    const timeField = dataset?.timeFieldName;
    if (sortOrder.length === 0 && timeField) {
      dispatch(setSort([[timeField, 'desc']]));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSortChange = useCallback(
    (newSort: SortOrder[]) => {
      dispatch(setSort(newSort));
      dispatch(executeQueries({ services }) as any);
    },
    [dispatch, services]
  );

  // Wrap cell text toggle
  const [wrapCellText, setWrapCellText] = useState(false);

  const { openFlyout, updateFlyoutFullTree } = useTraceFlyout();
  const { pplService, datasetParam } = usePPLQueryDeps();
  const flyoutTraceIdRef = useRef<string | null>(null);
  const spansCacheRef = useRef<Map<string, TraceRow[]>>(new Map());

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
      dispatch(setColumns(DEFAULT_SPAN_COLUMNS));
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

  // Build row metadata map from hits (flat, no tree expansion)
  const rowMetaMap = useMemo(() => {
    const map = new Map<string, RowMeta>();
    hits.forEach((hit) => {
      const row = hitToSpanRow(hit, formatTs);
      map.set(getHitId(hit), {
        level: 0,
        isExpandable: false,
        traceRow: row,
      });
    });
    return map;
  }, [hits, formatTs]);

  const getRowMeta = useCallback(
    (hitId: string): RowMeta | null => {
      return rowMetaMap.get(hitId) || null;
    },
    [rowMetaMap]
  );

  // Open flyout for a span row
  const handleRowClick = useCallback(
    async (hitId: string) => {
      const meta = getRowMeta(hitId);
      if (!meta) return;
      const traceRow = meta.traceRow as TraceRow;
      flyoutTraceIdRef.current = traceRow.traceId;
      openFlyout(traceRow);

      const cached = spansCacheRef.current.get(traceRow.traceId);
      if (cached) {
        updateFlyoutFullTree(cached, false);
        return;
      }

      // Fetch the full trace tree for the flyout
      if (pplService && datasetParam) {
        try {
          const response = await pplService.fetchTraceSpans({
            traceId: traceRow.traceId,
            dataset: datasetParam,
            limit: 1000,
          });
          const traceHits = transformPPLDataToTraceHits(response);
          const agentSpans = hitsToAgentSpans(traceHits);
          const fullTree = buildFullSpanTree(agentSpans, formatTs) as TraceRow[];
          spansCacheRef.current.set(traceRow.traceId, fullTree);
          updateFlyoutFullTree(fullTree, false);
        } catch (err) {
          updateFlyoutFullTree(undefined, false, (err as Error).message);
        }
      }
    },
    [getRowMeta, openFlyout, updateFlyoutFullTree, pplService, datasetParam, formatTs]
  );

  // No tree expansion for spans — provide a no-op context
  const expansionContextValue = useMemo(
    () => ({
      expandedRows: new Set<string>(),
      toggleExpansion: () => {},
      traceLoadingState: new Map<string, LoadingState>(),
      getRowMeta,
      onRowClick: handleRowClick,
      wrapCellText,
    }),
    [getRowMeta, handleRowClick, wrapCellText]
  );

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

  // Loading state — show during active query or before initial query has completed
  if ((isQueryLoading || !isInitialized) && hits.length === 0) {
    return (
      <TableLoadingState
        message={
          <FormattedMessage
            id="agentTraces.spansDataTable.loading"
            defaultMessage="Loading agent spans..."
          />
        }
      />
    );
  }

  if (!isQueryLoading && isInitialized && hits.length === 0) {
    return (
      <TableEmptyState
        title={
          <FormattedMessage
            id="agentTraces.spansDataTable.emptyTitle"
            defaultMessage="No agent spans found"
          />
        }
      />
    );
  }

  if (!dataset) return null;

  return (
    <TraceExpansionProvider value={expansionContextValue}>
      <div className="agentTracesTable__container">
        <EuiFlexGroup
          className="agentTracesTable__infoBar"
          alignItems="center"
          justifyContent="spaceBetween"
          gutterSize="m"
        >
          <EuiFlexItem grow={false}>
            <EuiText size="s">
              {hasHead ? (
                <FormattedMessage
                  id="agentTraces.spansDataTable.showingCountHeadOnly"
                  defaultMessage="{count} {count, plural, one {span} other {spans}} in {elapsed} ms"
                  values={{
                    count: <strong>{hits.length.toLocaleString()}</strong>,
                    elapsed: (
                      <strong>
                        {results?.elapsedMs != null ? results.elapsedMs.toLocaleString() : '—'}
                      </strong>
                    ),
                  }}
                />
              ) : (
                <FormattedMessage
                  id="agentTraces.spansDataTable.showingCount"
                  defaultMessage="{count} of {total} {totalCount, plural, one {span} other {spans}} in {elapsed} ms"
                  values={{
                    count: <strong>{hits.length.toLocaleString()}</strong>,
                    total: (
                      <strong>
                        {(traceMetrics?.filteredSpans ?? hits.length).toLocaleString()}
                      </strong>
                    ),
                    totalCount: traceMetrics?.filteredSpans ?? hits.length,
                    elapsed: (
                      <strong>
                        {results?.elapsedMs != null ? results.elapsedMs.toLocaleString() : '—'}
                      </strong>
                    ),
                  }}
                />
              )}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSwitch
              label={i18n.translate('agentTraces.spansDataTable.wrapCellText', {
                defaultMessage: 'Wrap cell text',
              })}
              checked={wrapCellText}
              onChange={(e) => setWrapCellText(e.target.checked)}
              data-test-subj="agentTracesWrapCellTextSwitch"
              compressed
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <div className="agentTracesTable__scrollContainer eui-xScrollWithShadows">
          <DataTable
            columns={displayedColumns}
            rows={hits}
            dataset={dataset}
            hits={results?.hits?.total}
            sampleSize={sampleSize}
            isShortDots={false}
            showPagination={false}
            docViewsRegistry={docViewsRegistry}
            onRemoveColumn={onRemoveColumn}
            onAddColumn={onAddColumn}
            onFilter={onAddFilter as DocViewFilterFn}
            wrapCellText={wrapCellText}
            sortOrder={sortOrder}
            onChangeSortOrder={handleSortChange}
          />
        </div>
      </div>
    </TraceExpansionProvider>
  );
};
