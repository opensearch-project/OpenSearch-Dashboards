/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './metrics_query_panel.scss';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { isEqual } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import {
  EuiButtonEmpty,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiProgress,
  DragDropContextProps,
} from '@elastic/eui';
import { monaco } from '@osd/monaco';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { QueryPanelWidgets } from '../../../components/query_panel/query_panel_widgets';
import { ExploreQueryPanelEditor } from '../../../components/query_panel/query_panel_editor';
import { QueryPanelGeneratedQuery } from '../../../components/query_panel/query_panel_generated_query';
import { usePPLExecuteQueryAction } from '../../../components/query_panel/actions/ppl_execute_query_action';
import { usePPLLintFixAction } from '../../../components/query_panel/actions/ppl_lint_fix_action';
import { useEditorRef, useSetEditorTextWithQuery } from '../../../application/hooks';
import { useSetEditorText } from '../../../application/hooks/editor_hooks/use_set_editor_text/use_set_editor_text';
import {
  selectDataset,
  selectIsLoading,
  selectIsPromptEditorMode,
  selectIsQueryEditorDirty,
  selectOverallQueryStatus,
  selectPromptToQueryIsLoading,
  selectQueryLanguage,
  selectQueryString,
} from '../../../application/utils/state_management/selectors';
import { setIsQueryEditorDirty } from '../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import { setQueryOptions } from '../../../application/utils/state_management/slices/query/query_slice';
import { onEditorRunActionCreator } from '../../../application/utils/state_management/actions/query_editor';
import { PrometheusClient } from './explore/services/prometheus_client';
import type { AppDispatch, RootState } from '../../../application/utils/state_management/store';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import { getQueryLabel, Query } from '../../../../../data/common';
import { parsePromQL } from './promql_builder';
import type { BuilderState } from './promql_builder';
import '../../../components/query_panel/query_panel.scss';

import type {
  PerQueryOptions,
  PromQLQuery,
  PromQLQueryOptions,
} from '../../../../../query_enhancements/common';
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
  useExecutedStepResolution,
  useMetricsQuerySettings,
  SourceQueryEditor,
} from './query_panel';
import { getSourceTypeRegistry } from '../../../services/source_type_registry';
import type { RowStepReadout } from './query_panel';

export const MetricsQueryPanel: React.FC = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch: AppDispatch = useDispatch();
  const queryIsLoading = useSelector(selectIsLoading);
  const promptToQueryIsLoading = useSelector(selectPromptToQueryIsLoading);
  const isLoading = queryIsLoading || promptToQueryIsLoading;
  const dataConnectionId = useSelector((state: RootState) => state.query.dataset?.id || '');
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const reduxQuery = useSelector(selectQueryString);
  const isQueryEditorDirty = useSelector(selectIsQueryEditorDirty);

  const editorRef = useEditorRef();
  const setEditorText = useSetEditorText();
  const setEditorTextWithQuery = useSetEditorTextWithQuery();
  usePPLExecuteQueryAction(setEditorTextWithQuery);
  usePPLLintFixAction(setEditorTextWithQuery);

  const handleRun = useCallback(() => {
    const editorText =
      editorRef.current?.getValue() ??
      String(services.data.query.queryString.getQuery().query || '');
    dispatch(onEditorRunActionCreator(services, editorText));
  }, [dispatch, services, editorRef]);

  const queryLanguage = useSelector(selectQueryLanguage);
  const dataset = useSelector(selectDataset);
  const languageTitle = useMemo(() => {
    return getSourceTypeRegistry().getLanguageLabel(queryLanguage, dataset);
  }, [queryLanguage, dataset]);

  // The PromQL builder rows list metrics and labels through the source's metrics resource client.
  const resourceClientId = getSourceTypeRegistry().getMetricsResourceClientId(dataset);
  const client = useMemo(
    () => new PrometheusClient(services, dataConnectionId, resourceClientId ?? 'prometheus'),
    [services, dataConnectionId, resourceClientId]
  );

  // A registered source's language gets the source's own editor (or a single code editor) in
  // place of the PromQL rows. PromQL keeps the rows unless the source brings its own editor or
  // has no metrics resource client for the builder to call.
  const sourceQueryEditor = useMemo(
    () => getSourceTypeRegistry().getLanguageSettings(queryLanguage, dataset)?.metricsQueryEditor,
    [queryLanguage, dataset]
  );
  const usesPromQLRows = getSourceTypeRegistry().usesPromQLRows(queryLanguage, dataset);

  const rowIdCounter = useRef(0);
  const nextRowId = useCallback(() => `row-${++rowIdCounter.current}`, []);

  const reduxPerQueryOptions = useSelector(
    (state: RootState) =>
      (state.query.queryOptions as PromQLQueryOptions | undefined)?.perQueryOptions
  );
  const perQueryOptionsRef = useRef(reduxPerQueryOptions);
  perQueryOptionsRef.current = reduxPerQueryOptions;

  // The rows parse the query as PromQL, so they're only built while they are shown.
  const [rows, setRows] = useState<QueryRow[]>(() =>
    usesPromQLRows ? initRows(reduxQuery, nextRowId, reduxPerQueryOptions) : []
  );
  const lastDispatchedRef = useRef(reduxQuery);
  const previousReduxQueryRef = useRef(reduxQuery);
  const rowsShownRef = useRef(usesPromQLRows);

  useEffect(() => {
    const queryChanged = reduxQuery !== previousReduxQueryRef.current;
    previousReduxQueryRef.current = reduxQuery;
    // Switching back to the rows (e.g. from another language) rebuilds them from the query.
    const rowsJustShown = usesPromQLRows && !rowsShownRef.current;
    rowsShownRef.current = usesPromQLRows;
    // Keep local drafts until a query is loaded or run, even if its text is unchanged.
    if (!rowsJustShown && !queryChanged && isQueryEditorDirty) return;

    lastDispatchedRef.current = reduxQuery;
    if (!usesPromQLRows) return;

    setRows((currentRows) => {
      const serialized = serializeRows(currentRows);
      const optionsMatch = serialized.perQueryOptions.every(
        (options, index) =>
          options.minStep === reduxPerQueryOptions?.[index]?.minStep &&
          options.legendFormat === reduxPerQueryOptions?.[index]?.legendFormat
      );
      if (!rowsJustShown && serialized.query === reduxQuery && optionsMatch) return currentRows;
      return initRows(reduxQuery, nextRowId, reduxPerQueryOptions);
    });
  }, [reduxQuery, reduxPerQueryOptions, isQueryEditorDirty, nextRowId, usesPromQLRows]);

  // Sync draft text to the QueryStringManager (NOT Redux) on every keystroke so
  // that handleQuerySubmit in TopNav can read it via queryString.getQuery().query.
  const { queryString } = services.data.query;
  const syncEditorText = useCallback(
    (updatedRows: QueryRow[]) => {
      const { query: combined, perQueryOptions } = serializeRows(updatedRows);
      const currentQuery = queryString.getQuery() as PromQLQuery;
      queryString.setQuery({
        query: combined,
        queryOptions: { ...currentQuery.queryOptions, perQueryOptions },
      } as Partial<Query>);
      if (!isEqual(perQueryOptions, perQueryOptionsRef.current)) {
        dispatch(setQueryOptions({ perQueryOptions }));
      }
      dispatch(setIsQueryEditorDirty(true));
      if (combined === lastDispatchedRef.current) return;
      lastDispatchedRef.current = combined;
      setEditorText(combined);
    },
    [setEditorText, dispatch, queryString]
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

  // Same as syncEditorText, for a source's single editor: the text as typed, no per-row options.
  const syncSourceQuery = useCallback(
    (query: string) => {
      queryString.setQuery({ query } as Partial<Query>);
      dispatch(setIsQueryEditorDirty(true));
      if (query === lastDispatchedRef.current) return;
      lastDispatchedRef.current = query;
      setEditorText(query);
    },
    [setEditorText, dispatch, queryString]
  );

  // A source editor may run a query it hasn't passed to onChange yet.
  const runSourceQuery = useCallback(
    (query?: string) => {
      if (query !== undefined) syncSourceQuery(query);
      const text = query ?? String(queryString.getQuery().query || '');
      dispatch(onEditorRunActionCreator(services, text));
    },
    [syncSourceQuery, queryString, dispatch, services]
  );

  const queryOptions = useSelector((state: RootState) => state.query.queryOptions);
  const onSourceQueryOptionsChange = useCallback(
    (options: Record<string, unknown>) => {
      const currentQuery = queryString.getQuery() as PromQLQuery;
      queryString.setQuery({
        queryOptions: { ...currentQuery.queryOptions, ...options },
      } as Partial<Query>);
      dispatch(setQueryOptions(options));
    },
    [queryString, dispatch]
  );
  const overallStatus = useSelector(selectOverallQueryStatus);
  const sourceQueryStatus = useMemo(
    () => ({
      isRunning: overallStatus.status === QueryExecutionStatus.LOADING,
      error:
        overallStatus.status === QueryExecutionStatus.ERROR
          ? overallStatus.error?.message?.details ||
            overallStatus.error?.message?.reason ||
            overallStatus.error?.error
          : undefined,
    }),
    [overallStatus]
  );

  const updateRow = useCallback(
    (rowId: string, updates: Partial<QueryRow>) => {
      setRows((prev) => {
        const next = prev.map((r) => (r.id === rowId ? { ...r, ...updates } : r));
        syncEditorText(next);
        return next;
      });
    },
    [syncEditorText]
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
      syncEditorText(next);
      return next;
    });
  }, [syncEditorText, nextRowId]);

  const removeRow = useCallback(
    (rowId: string) => {
      setRows((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((r) => r.id !== rowId);
        syncEditorText(next);
        return next;
      });
    },
    [syncEditorText]
  );

  const onDragEnd: DragDropContextProps['onDragEnd'] = useCallback(
    ({ source, destination }) => {
      if (!destination || source.index === destination.index) return;
      setRows((prev) => {
        const next = [...prev];
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        syncEditorText(next);
        return next;
      });
    },
    [syncEditorText]
  );

  useEffect(() => {
    const disposable = monaco.languages.registerCompletionItemProvider(
      'PROMQL',
      createPromQLSuggestionProvider(services)
    );
    return () => disposable.dispose();
  }, [services]);

  // Entering AI mode should start with an empty prompt rather than inheriting
  // the builder's PromQL text from the shared editor state. The prompt editor
  // mounts on a later frame, so retry via requestAnimationFrame until the ref
  // is populated — self-terminating, no arbitrary delay.
  useEffect(() => {
    if (!isPromptMode) return;
    let rafId = 0;
    const tryClear = () => {
      if (editorRef.current) {
        editorRef.current.setValue('');
        return;
      }
      rafId = requestAnimationFrame(tryClear);
    };
    tryClear();
    return () => cancelAnimationFrame(rafId);
  }, [isPromptMode, editorRef]);

  // Server steps are keyed by the labels of active (non-empty) rows only, so an
  // empty row must not borrow a neighbor's label when reading its step back.
  let activeRowSeen = 0;
  const readoutLabels = rows.map((row) => (row.query.trim() ? getQueryLabel(activeRowSeen++) : ''));

  return (
    <EuiPanel paddingSize="s" borderRadius="none" className="exploreQueryPanel">
      <EuiFlexGroup gutterSize="none" alignItems="center" responsive={false}>
        <EuiFlexItem>
          <QueryPanelWidgets />
        </EuiFlexItem>
      </EuiFlexGroup>

      {isPromptMode ? (
        <div className="exploreQueryPanel__editorsWrapper">
          <ExploreQueryPanelEditor />
          <QueryPanelGeneratedQuery />
        </div>
      ) : !usesPromQLRows ? (
        <SourceQueryEditor
          editor={sourceQueryEditor}
          reduxQuery={reduxQuery}
          isDirty={isQueryEditorDirty}
          onQueryChange={syncSourceQuery}
          onRun={runSourceQuery}
          languageId={queryLanguage}
          languageTitle={languageTitle}
          dataset={dataset}
          data={services.data}
          queryOptions={queryOptions}
          onQueryOptionsChange={onSourceQueryOptionsChange}
          status={sourceQueryStatus}
        />
      ) : (
        <>
          <EuiDragDropContext onDragEnd={onDragEnd}>
            <EuiDroppable droppableId="queryRows" spacing="none">
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
                      label={readoutLabels[idx]}
                      positionLabel={getQueryLabel(idx)}
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
              <EuiButtonEmpty size="xs" iconType="plusInCircle" onClick={addRow}>
                {i18n.translate('explore.metricsQueryPanel.addQuery', {
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
      )}

      {isLoading && (
        <EuiProgress
          size="xs"
          color="accent"
          position="absolute"
          data-test-subj="exploreQueryPanelIsLoading"
        />
      )}
    </EuiPanel>
  );
};
