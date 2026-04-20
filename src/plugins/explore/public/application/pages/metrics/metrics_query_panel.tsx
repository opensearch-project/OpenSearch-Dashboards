/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './metrics_query_panel.scss';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
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
import { usePPLExecuteQueryAction } from '../../../components/query_panel/actions/ppl_execute_query_action';
import { useSetEditorTextWithQuery } from '../../../application/hooks';
import { useSetEditorText } from '../../../application/hooks/editor_hooks/use_set_editor_text/use_set_editor_text';
import {
  selectIsLoading,
  selectPromptToQueryIsLoading,
  selectQueryString,
} from '../../../application/utils/state_management/selectors';
import { setIsQueryEditorDirty } from '../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import { PrometheusClient } from './explore/services/prometheus_client';
import { RootState } from '../../../application/utils/state_management/store';
import { getQueryLabel } from '../../../../../data/common';
import { parsePromQL } from './promql_builder';
import type { BuilderState } from './promql_builder';
import '../../../components/query_panel/query_panel.scss';

import {
  QueryRowComponent,
  QueryRow,
  RowMode,
  initRows,
  joinRows,
  createPromQLSuggestionProvider,
} from './query_panel';

export const MetricsQueryPanel: React.FC = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const queryIsLoading = useSelector(selectIsLoading);
  const promptToQueryIsLoading = useSelector(selectPromptToQueryIsLoading);
  const isLoading = queryIsLoading || promptToQueryIsLoading;
  const dataConnectionId = useSelector((state: RootState) => state.query.dataset?.id || '');
  const reduxQuery = useSelector(selectQueryString);

  const setEditorText = useSetEditorText();
  const setEditorTextWithQuery = useSetEditorTextWithQuery();
  usePPLExecuteQueryAction(setEditorTextWithQuery);

  const client = useMemo(() => new PrometheusClient(services, dataConnectionId), [
    services,
    dataConnectionId,
  ]);

  const rowIdCounter = useRef(0);
  const nextRowId = useCallback(() => `row-${++rowIdCounter.current}`, []);

  const [rows, setRows] = useState<QueryRow[]>(() => initRows(reduxQuery, nextRowId));
  const lastDispatchedRef = useRef(reduxQuery);

  useEffect(() => {
    if (reduxQuery !== lastDispatchedRef.current) {
      lastDispatchedRef.current = reduxQuery;
      setRows(initRows(reduxQuery, nextRowId));
    }
  }, [reduxQuery, nextRowId]);

  // Sync draft text to the QueryStringManager (NOT Redux) on every keystroke so
  // that handleQuerySubmit in TopNav can read it via queryString.getQuery().query.
  const { queryString } = services.data.query;
  const syncEditorText = useCallback(
    (updatedRows: QueryRow[]) => {
      const combined = joinRows(updatedRows);
      lastDispatchedRef.current = combined;
      setEditorText(combined);
      const currentQuery = queryString.getQuery();
      queryString.setQuery({ ...currentQuery, query: combined });
      dispatch(setIsQueryEditorDirty(true));
    },
    [setEditorText, dispatch, queryString]
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
      const next = [
        ...prev,
        { id: nextRowId(), mode: 'builder' as RowMode, query: '', builderState: result.state },
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

  return (
    <EuiPanel paddingSize="s" borderRadius="none" className="exploreQueryPanel">
      <EuiFlexGroup gutterSize="none" alignItems="center" responsive={false}>
        <EuiFlexItem>
          <QueryPanelWidgets />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiDragDropContext onDragEnd={onDragEnd}>
        <EuiDroppable droppableId="queryRows" spacing="none">
          {rows.map((row, idx) => (
            <EuiDraggable
              key={row.id}
              index={idx}
              draggableId={row.id}
              customDragHandle={true}
              spacing="none"
              hasInteractiveChildren={true}
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
                  canRemove={rows.length > 1}
                  isDragging={snapshot.isDragging}
                  dragHandleProps={provided.dragHandleProps}
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
      </EuiFlexGroup>

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
