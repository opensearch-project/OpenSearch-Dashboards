/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback, useRef } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { DataTable } from '../../../components/data_table/data_table';
import { AGENT_TRACES_DEFAULT_COLUMNS } from '../../../../common';
import { DocViewFilterFn } from '../../../types/doc_views_types';
import { TraceExpansionProvider, RowMeta } from './trace_expansion_context';
import { LoadingState } from './hooks/tree_utils';
import {
  TableLoadingState,
  TableEmptyState,
  useDataTableCore,
  hitToBaseRow,
  DataTableInfoBar,
} from './table_shared';
import { getHitId } from '../../../components/data_table/table_cell/trace_utils/trace_utils';
import { useTraceFlyout } from './flyout/trace_flyout_context';
import { TraceRow } from './hooks/use_agent_traces';
import { usePPLQueryDeps } from './hooks/use_ppl_query_deps';
import { transformPPLDataToTraceHits } from './trace_details/traces/ppl_to_trace_hits';
import { hitsToAgentSpans, buildFullSpanTree } from './hooks/tree_utils';
import './traces_table.scss';

const DEFAULT_SPAN_COLUMNS = [...AGENT_TRACES_DEFAULT_COLUMNS];

// Stable module-level constants to avoid creating new references on every render
const EMPTY_EXPANDED_ROWS = new Set<string>();
const EMPTY_LOADING_STATE = new Map<string, LoadingState>();

export const SpansDataTable: React.FC = () => {
  const {
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
    onRemoveColumn,
    onAddColumn,
    hasHead,
    onAddFilter,
    docViewsRegistry,
    sampleSize,
    wrapCellText,
    setWrapCellText,
  } = useDataTableCore({ defaultColumns: DEFAULT_SPAN_COLUMNS });

  const { openFlyout, updateFlyoutFullTree } = useTraceFlyout();
  const { pplService, datasetParam } = usePPLQueryDeps();
  const flyoutTraceIdRef = useRef<string | null>(null);
  const spansCacheRef = useRef<Map<string, TraceRow[]>>(new Map());

  // Build row metadata map from hits (flat, no tree expansion)
  const rowMetaMap = useMemo(() => {
    const map = new Map<string, RowMeta>();
    hits.forEach((hit) => {
      const row = hitToBaseRow(hit, formatTs);
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
      expandedRows: EMPTY_EXPANDED_ROWS,
      toggleExpansion: () => {},
      traceLoadingState: EMPTY_LOADING_STATE,
      getRowMeta,
      onRowClick: handleRowClick,
      wrapCellText,
    }),
    [getRowMeta, handleRowClick, wrapCellText]
  );

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
        <DataTableInfoBar
          hasHead={hasHead}
          hitsCount={hits.length}
          totalCount={traceMetrics?.filteredSpans ?? hits.length}
          elapsedMs={results?.elapsedMs}
          entityName="span"
          wrapCellText={wrapCellText}
          onWrapCellTextChange={setWrapCellText}
        />
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
