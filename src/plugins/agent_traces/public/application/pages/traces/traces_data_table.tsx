/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { DataTable } from '../../../components/data_table/data_table';
import { AGENT_TRACES_DEFAULT_COLUMNS } from '../../../../common';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../../types/doc_views_types';
import { TraceExpansionProvider, RowMeta } from './trace_expansion_context';
import { useTraceFlyout } from './flyout/trace_flyout_context';
import { BaseRow, LoadingState, buildFullSpanTree, hitsToAgentSpans } from './hooks/tree_utils';
import { transformPPLDataToTraceHits } from './trace_details/traces/ppl_to_trace_hits';
import { usePPLQueryDeps } from './hooks/use_ppl_query_deps';
import { TraceRow } from './hooks/use_agent_traces';
import {
  TableLoadingState,
  TableEmptyState,
  useDataTableCore,
  hitToBaseRow,
  DataTableInfoBar,
} from './table_shared';
import { getHitId } from '../../../components/data_table/table_cell/trace_utils/trace_utils';
import './traces_table.scss';

const DEFAULT_TRACE_COLUMNS = [...AGENT_TRACES_DEFAULT_COLUMNS];

/** Create a synthetic OpenSearchSearchHit from a BaseRow */
const traceRowToHit = (row: BaseRow): OpenSearchSearchHit<Record<string, any>> => ({
  _index: '',
  _id: row.spanId,
  _score: null,
  _source: row.rawDocument || {},
});

export const TracesDataTable: React.FC = () => {
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
  } = useDataTableCore({ defaultColumns: DEFAULT_TRACE_COLUMNS });

  const { pplService, datasetParam } = usePPLQueryDeps();
  const { openFlyout, updateFlyoutFullTree } = useTraceFlyout();

  // Build row metadata map from hits
  const rowMetaMap = useMemo(() => {
    const map = new Map<string, RowMeta>();
    hits.forEach((hit) => {
      const traceRow = hitToBaseRow(hit, formatTs, { markExpandable: true });
      map.set(getHitId(hit), {
        level: traceRow.level || 0,
        isExpandable: !!traceRow.isExpandable,
        traceRow,
      });
    });
    return map;
  }, [hits, formatTs]);

  // Tree expansion state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [childHitsMap, setChildHitsMap] = useState<
    Map<string, Array<OpenSearchSearchHit<Record<string, any>>>>
  >(new Map());
  const [childMetaMap, setChildMetaMap] = useState<Map<string, Map<string, RowMeta>>>(new Map());
  const [traceLoadingState, setTraceLoadingState] = useState<Map<string, LoadingState>>(new Map());
  const inFlightRef = useRef<Set<string>>(new Set());
  const traceSpansCacheRef = useRef<Map<string, BaseRow[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const flyoutTraceIdRef = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pendingScrollRestoreRef = useRef<number | null>(null);

  // Abort in-flight fetches on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Reset tree expansion and caches when hits change (e.g. sort re-query)
  useEffect(() => {
    abortControllerRef.current?.abort();
    setExpandedRows(new Set());
    setChildHitsMap(new Map());
    setChildMetaMap(new Map());
    setTraceLoadingState(new Map());
    traceSpansCacheRef.current.clear();
    inFlightRef.current.clear();
  }, [hits]);

  // Sync full tree to flyout
  useEffect(() => {
    const traceId = flyoutTraceIdRef.current;
    if (!traceId) return;
    const cached = traceSpansCacheRef.current.get(traceId);
    if (cached) {
      updateFlyoutFullTree(cached as TraceRow[], false);
    }
  }, [childHitsMap, updateFlyoutFullTree]);

  // Show error state in flyout when fetch fails
  useEffect(() => {
    const traceId = flyoutTraceIdRef.current;
    if (!traceId) return;
    const loadState = traceLoadingState.get(traceId);
    if (loadState && !loadState.loading && loadState.error) {
      updateFlyoutFullTree(undefined, false, loadState.error);
    }
  }, [traceLoadingState, updateFlyoutFullTree]);

  const expandTrace = useCallback(
    async (traceId: string) => {
      if (traceSpansCacheRef.current.has(traceId)) return;
      if (inFlightRef.current.has(traceId)) return;
      if (!pplService || !datasetParam) return;

      inFlightRef.current.add(traceId);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setTraceLoadingState((prev) => {
        const next = new Map(prev);
        next.set(traceId, { loading: true, error: null });
        return next;
      });

      try {
        const response = await pplService.fetchTraceSpans(
          { traceId, dataset: datasetParam, limit: 1000 },
          controller.signal
        );

        const traceHits = transformPPLDataToTraceHits(response);
        const agentSpans = hitsToAgentSpans(traceHits);
        const fullTree = buildFullSpanTree(agentSpans, formatTs);
        traceSpansCacheRef.current.set(traceId, fullTree);

        // Build child hits and metadata for displaying expanded rows
        const childRows: BaseRow[] = [];
        const flattenTree = (rows: BaseRow[]) => {
          for (const row of rows) {
            childRows.push(row);
            if (row.children && row.children.length > 0) {
              flattenTree(row.children);
            }
          }
        };
        flattenTree(fullTree);

        const newChildHits = childRows
          .filter((r) => r.parentSpanId) // exclude root (already in parent hits)
          .map((r) => traceRowToHit(r));
        const newChildMeta = new Map<string, RowMeta>();
        childRows.forEach((r) => {
          newChildMeta.set(r.spanId, {
            level: r.level || 0,
            isExpandable: !!(r.children && r.children.length > 0),
            traceRow: r,
          });
        });

        setChildHitsMap((prev) => {
          const next = new Map(prev);
          next.set(traceId, newChildHits);
          return next;
        });
        setChildMetaMap((prev) => {
          const next = new Map(prev);
          next.set(traceId, newChildMeta);
          return next;
        });
        setTraceLoadingState((prev) => {
          const next = new Map(prev);
          next.set(traceId, { loading: false, error: null });
          return next;
        });
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
        setTraceLoadingState((prev) => {
          const next = new Map(prev);
          next.set(traceId, {
            loading: false,
            error: (err as Error).message || 'Failed to fetch trace spans',
          });
          return next;
        });
      } finally {
        inFlightRef.current.delete(traceId);
      }
    },
    [pplService, datasetParam, formatTs]
  );

  const toggleExpansion = useCallback(
    async (e: React.MouseEvent, id: string, traceId: string) => {
      e.stopPropagation();

      // Save scroll position before expansion changes the DOM
      if (scrollContainerRef.current) {
        pendingScrollRestoreRef.current = scrollContainerRef.current.scrollTop;
      }

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

  // Combined getRowMeta that checks both root-level and child metadata
  const getRowMeta = useCallback(
    (hitId: string): RowMeta | null => {
      const rootMeta = rowMetaMap.get(hitId);
      if (rootMeta) return rootMeta;

      // Search child meta maps
      for (const meta of childMetaMap.values()) {
        const childMeta = meta.get(hitId);
        if (childMeta) return childMeta;
      }
      return null;
    },
    [rowMetaMap, childMetaMap]
  );

  // Build visible rows: root hits (already sorted by backend) + expanded children after parents
  const visibleRows = useMemo(() => {
    const result: Array<OpenSearchSearchHit<Record<string, any>>> = [];

    const addRowAndChildren = (hit: OpenSearchSearchHit<Record<string, any>>, hitId: string) => {
      result.push(hit);

      if (!expandedRows.has(hitId)) return;

      const meta = getRowMeta(hitId);
      if (!meta) return;

      const traceId = meta.traceRow.traceId;
      const fullTree = traceSpansCacheRef.current.get(traceId);
      if (!fullTree) return;

      // Find this node in the full tree and add its children
      const findAndAddChildren = (rows: BaseRow[]) => {
        for (const row of rows) {
          if (row.spanId === meta.traceRow.spanId) {
            if (row.children && row.children.length > 0) {
              const addTreeChildren = (children: BaseRow[]) => {
                for (const child of children) {
                  const childHit = traceRowToHit(child);
                  addRowAndChildren(childHit, child.spanId);
                }
              };
              addTreeChildren(row.children);
            }
            return true;
          }
          if (row.children && findAndAddChildren(row.children)) return true;
        }
        return false;
      };

      findAndAddChildren(fullTree);
    };

    hits.forEach((hit) => {
      const id = getHitId(hit);
      const meta = rowMetaMap.get(id);
      const hitId = meta?.traceRow.id || id;
      addRowAndChildren(hit, hitId);
    });

    return result;
  }, [hits, expandedRows, rowMetaMap, getRowMeta]);

  // Restore scroll position after expansion/collapse changes the DOM.
  // useLayoutEffect fires synchronously after DOM mutations but before
  // the browser paints, so the user never sees the scroll jump.
  useLayoutEffect(() => {
    if (pendingScrollRestoreRef.current !== null && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = pendingScrollRestoreRef.current;
      pendingScrollRestoreRef.current = null;
    }
  }, [visibleRows]);

  // Open flyout for a row by its hit ID
  const handleRowClick = useCallback(
    async (hitId: string) => {
      const meta = getRowMeta(hitId);
      if (!meta) return;
      const traceRow = meta.traceRow as TraceRow;
      flyoutTraceIdRef.current = traceRow.traceId;
      openFlyout(traceRow);

      const cached = traceSpansCacheRef.current.get(traceRow.traceId);
      if (cached) {
        updateFlyoutFullTree(cached as TraceRow[], false);
        return;
      }

      await expandTrace(traceRow.traceId);
    },
    [getRowMeta, openFlyout, updateFlyoutFullTree, expandTrace]
  );

  const expansionContextValue = useMemo(
    () => ({
      expandedRows,
      toggleExpansion,
      traceLoadingState,
      getRowMeta,
      onRowClick: handleRowClick,
      wrapCellText,
      hasExpandableRows: true,
    }),
    [expandedRows, toggleExpansion, traceLoadingState, getRowMeta, handleRowClick, wrapCellText]
  );

  // Loading state — show during active query or before initial query has completed
  if ((isQueryLoading || !isInitialized) && hits.length === 0) {
    return (
      <TableLoadingState
        message={
          <FormattedMessage
            id="agentTraces.tracesDataTable.loading"
            defaultMessage="Loading agent traces..."
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
            id="agentTraces.tracesDataTable.emptyTitle"
            defaultMessage="No agent traces found"
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
          totalCount={traceMetrics?.filteredTraces ?? hits.length}
          elapsedMs={results?.elapsedMs}
          entityName="trace"
          wrapCellText={wrapCellText}
          onWrapCellTextChange={setWrapCellText}
        />
        <div
          ref={scrollContainerRef}
          className="agentTracesTable__scrollContainer eui-xScrollWithShadows"
        >
          <DataTable
            columns={displayedColumns}
            rows={visibleRows}
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
