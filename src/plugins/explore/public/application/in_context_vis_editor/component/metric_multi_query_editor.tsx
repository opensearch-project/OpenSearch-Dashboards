/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiFlexGroup,
  EuiFlexItem,
  DragDropContextProps,
} from '@elastic/eui';
import { monaco } from '@osd/monaco';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { getQueryLabel } from '../../../../../data/common';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import {
  useMetricsQuerySettings,
  useExecutedStepResolution,
} from '../hooks/use_metrics_query_options';
import { PrometheusClient } from '../../pages/metrics/explore/services/prometheus_client';
import { parsePromQL } from '../../pages/metrics/promql_builder';
import type { BuilderState } from '../../pages/metrics/promql_builder';
import {
  QueryRowComponent,
  QueryRow,
  RowMode,
  initRows,
  joinRows,
  serializeRows,
  createPromQLSuggestionProvider,
  MetricsQueryOptions,
  formatStepSeconds,
} from '../../pages/metrics/query_panel';
import type { RowStepReadout } from '../../pages/metrics/query_panel';
import type { PerQueryOptions } from '../../../../../query_enhancements/common';

import '../../pages/metrics/metrics_query_panel.scss';
import { useEditorOperations } from '../hooks/use_editor_operations';

/**
 * Multi-row PromQL editor for the in-context visualization editor, mirroring the metrics page query panel
 */
export const MetricMultiQueryPanelEditor: React.FC = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryState, queryBuilder } = useQueryBuilderState();

  const dataConnectionId = queryState.dataset?.id ?? '';
  const client = useMemo(
    () => new PrometheusClient(services, dataConnectionId),
    [services, dataConnectionId]
  );

  const languageTitle = useMemo(() => {
    const languageService = services.data.query.queryString.getLanguageService();
    return languageService.getLanguage(queryState.language)?.title ?? queryState.language;
  }, [queryState.language, services.data.query.queryString]);

  const rowIdCounter = useRef(0);
  const nextRowId = useCallback(() => `row-${++rowIdCounter.current}`, []);

  const perQueryOptions = queryState.queryOptions?.perQueryOptions;
  const perQueryOptionsRef = useRef(perQueryOptions);
  perQueryOptionsRef.current = perQueryOptions;

  const [rows, setRows] = useState<QueryRow[]>(() =>
    initRows(queryState.query, nextRowId, perQueryOptions)
  );

  // last synced query ref, re-split only when the query changes outside of this component
  const lastSyncedQueryRef = useRef(queryState.query);
  useEffect(() => {
    if (queryState.query !== lastSyncedQueryRef.current) {
      lastSyncedQueryRef.current = queryState.query;
      setRows(initRows(queryState.query, nextRowId, perQueryOptionsRef.current));
    }
  }, [queryState.query, nextRowId]);

  const syncQuery = useCallback(
    (updatedRows: QueryRow[]) => {
      const { query: combined, perQueryOptions: nextOptions } = serializeRows(updatedRows);
      queryBuilder.updateQueryOptions({ perQueryOptions: nextOptions });
      queryBuilder.updateQueryState({ query: combined });
      queryBuilder.updateQueryEditorState({ isQueryEditorDirty: true });

      if (combined === lastSyncedQueryRef.current) return;
      lastSyncedQueryRef.current = combined;
    },
    [queryBuilder]
  );

  const { maxDataPoints, onMaxDataPointsChange, getResolvedStep } =
    useMetricsQuerySettings(services);

  // Server-reported steps only line up with the rows by position, so trust them
  // only while the rows still serialize to the query that produced them.
  const executedSteps = useExecutedStepResolution();
  const executedStepsMatchRows = !!executedSteps && executedSteps.query === joinRows(rows);

  const stepReadoutFor = useCallback(
    (label: string, minStep?: string): RowStepReadout => {
      const candidate = executedStepsMatchRows ? executedSteps?.byLabel[label] : undefined;
      // The server resolved these steps against the min step in effect at run
      // time, so a since-edited min step must fall back to a fresh estimate.
      const executed =
        candidate && (candidate.minStep ?? undefined) === (minStep ?? undefined)
          ? candidate
          : undefined;
      const resolved = executed ?? getResolvedStep(minStep);
      return {
        stepLabel: formatStepSeconds(resolved?.stepSec),
        rateIntervalLabel: formatStepSeconds(resolved?.rateIntervalSec),
        isFromLastRun: !!executed,
      };
    },
    [executedSteps, executedStepsMatchRows, getResolvedStep]
  );

  const handleRun = useCallback(() => {
    queryBuilder.onQueryExecutionSubmit().catch((error) => {
      services.notifications?.toasts.addError(error, {
        title: 'Query execution failed',
        toastLifeTimeMs: 2000,
      });
    });
  }, [queryBuilder, services.notifications]);

  const updateRow = useCallback(
    (rowId: string, updates: Partial<QueryRow>) => {
      setRows((prev) => {
        const next = prev.map((r) => (r.id === rowId ? { ...r, ...updates } : r));
        syncQuery(next);
        return next;
      });
    },
    [syncQuery]
  );

  const onOptionsChange = useCallback(
    (rowId: string, options: PerQueryOptions) => {
      updateRow(rowId, { minStep: options.minStep, legendFormat: options.legendFormat });
    },
    [updateRow]
  );

  const onBuilderChange = useCallback(
    (rowId: string, query: string, builderState: BuilderState) => {
      updateRow(rowId, { query, builderState });
    },
    [updateRow]
  );

  const onCodeChange = useCallback(
    (rowId: string, query: string) => {
      updateRow(rowId, { query });
    },
    [updateRow]
  );

  const onModeChange = useCallback((rowId: string, newMode: RowMode) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        if (newMode === 'builder') {
          const result = parsePromQL(r.query);
          if (!result.canBuild) return r;
          return { ...r, mode: 'builder', builderState: result.state };
        }
        return { ...r, mode: 'code' };
      })
    );
  }, []);

  const addRow = useCallback(() => {
    const result = parsePromQL('');
    setRows((prev) => {
      const next: QueryRow[] = [
        ...prev,
        { id: nextRowId(), mode: 'builder', query: '', builderState: result.state },
      ];
      syncQuery(next);
      return next;
    });
  }, [syncQuery, nextRowId]);

  const removeRow = useCallback(
    (rowId: string) => {
      setRows((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((r) => r.id !== rowId);
        syncQuery(next);
        return next;
      });
    },
    [syncQuery]
  );

  const onDragEnd: DragDropContextProps['onDragEnd'] = useCallback(
    ({ source, destination }) => {
      if (!destination || source.index === destination.index) return;
      setRows((prev) => {
        const next = [...prev];
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        syncQuery(next);
        return next;
      });
    },
    [syncQuery]
  );

  useEffect(() => {
    const disposable = monaco.languages.registerCompletionItemProvider(
      'PROMQL',
      createPromQLSuggestionProvider(services)
    );
    return () => disposable.dispose();
  }, [services]);

  // Server steps are keyed by the labels of active (non-empty) rows only, so an
  // empty row must not borrow a neighbor's label when reading its step back.
  let activeRowSeen = 0;
  const readoutLabels = rows.map((row) => (row.query.trim() ? getQueryLabel(activeRowSeen++) : ''));

  return (
    <>
      <EuiDragDropContext onDragEnd={onDragEnd}>
        <EuiDroppable droppableId="visEditorQueryRows" spacing="none">
          {rows.map((row, idx) => (
            <EuiDraggable
              key={row.id}
              index={idx}
              draggableId={row.id}
              customDragHandle={true}
              spacing="none"
              isDragDisabled={rows.length <= 1}
            >
              {(provided, snapshot) => (
                <QueryRowComponent
                  row={row}
                  label={getQueryLabel(idx)}
                  client={client}
                  onBuilderChange={onBuilderChange}
                  onCodeChange={onCodeChange}
                  onModeChange={onModeChange}
                  onRemove={removeRow}
                  onOptionsChange={onOptionsChange}
                  onRun={handleRun}
                  languageTitle={languageTitle}
                  canRemove={rows.length > 1}
                  isDragging={snapshot.isDragging}
                  dragHandleProps={provided.dragHandleProps}
                  stepReadout={stepReadoutFor(readoutLabels[idx], row.minStep)}
                />
              )}
            </EuiDraggable>
          ))}
        </EuiDroppable>
      </EuiDragDropContext>

      <EuiFlexGroup
        gutterSize="s"
        alignItems="center"
        responsive={false}
        className="mqpAddQueryRow"
      >
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="xs"
            iconType="plusInCircle"
            onClick={addRow}
            data-test-subj="visEditorAddQueryRow"
          >
            {i18n.translate('explore.visEditorMetricsQueryPanel.addQuery', {
              defaultMessage: 'Add query',
            })}
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <MetricsQueryOptions
            maxDataPoints={maxDataPoints}
            onMaxDataPointsChange={onMaxDataPointsChange}
            resolvedMaxDataPoints={executedSteps?.maxDataPoints}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
