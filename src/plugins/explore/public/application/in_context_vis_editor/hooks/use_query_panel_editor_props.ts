/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { QueryEditorProps } from '../../../components/query_panel/query_panel_editor/types';
import { useQueryBuilderState } from './use_query_builder_state';
import { EditorMode } from '../../utils/state_management/types';
import { useEditorOperations } from './use_editor_operations';
import { createVariableCompletionProvider } from '../utils/variable_completion_provider';

export const useQueryPanelEditorProps = (): QueryEditorProps & { editorKey: number } => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryBuilder, queryState, queryEditorState } = useQueryBuilderState();
  const { switchEditorMode } = useEditorOperations();
  const isPromptMode = queryEditorState.editorMode === EditorMode.Prompt;

  const previousEditorModeRef = useRef(queryEditorState.editorMode);

  // use this editorKey to force monaco editor to mount/unmount only for Prompt -> Query
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    const previous = previousEditorModeRef.current;
    const current = queryEditorState.editorMode;

    if (previous === EditorMode.Prompt && current === EditorMode.Query) {
      setEditorKey((key) => key + 1);
    }

    previousEditorModeRef.current = current;
  }, [queryEditorState.editorMode]);

  const onRun = useCallback(
    (queryString: string) => {
      if (!isPromptMode) {
        queryBuilder.updateQueryState({ query: queryString });
      }
      queryBuilder.onQueryExecutionSubmit().catch((error) => {
        services.notifications?.toasts.addError(error, {
          title: 'Query execution failed',
          toastLifeTimeMs: 2000,
        });
      });
    },
    [isPromptMode, queryBuilder, services.notifications]
  );

  const getEditorContainerHeight = useCallback((domNode: HTMLElement | null) => {
    // Grow the editor height with its line counts, only for vis editor
    const panelEl =
      domNode?.closest('.multiTabsPanel') ??
      domNode?.closest('.exploreResizableQueryContainer__queryPanel');

    return Math.min(panelEl?.clientHeight ?? domNode?.parentElement?.clientHeight ?? 100, 100);
  }, []);

  // Contribute dashboard variable (`${var}`) suggestions as a completion extension so the
  // shared query editor need not know about the dashboard-variables feature.
  const completionProviders = useMemo(
    () => [createVariableCompletionProvider(() => queryBuilder.getVariableNames())],
    [queryBuilder]
  );

  return {
    editorKey,
    services,
    editorRef: queryBuilder.editorRef,
    queryState,
    queryEditorState,
    onRun,
    switchEditorMode,
    getEditorContainerHeight,
    handleEditorChange: (updates) => queryBuilder.updateQueryEditorState(updates),
    focusShortcutId: 'vis_editor_focus_query_bar',
    completionProviders,
  };
};
