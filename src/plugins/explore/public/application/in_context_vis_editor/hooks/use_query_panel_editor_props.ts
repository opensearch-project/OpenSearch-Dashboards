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
  const { queryBuilder, queryState, queryEditorState, container } = useQueryBuilderState();
  const { switchEditorMode } = useEditorOperations();
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
      if (queryBuilder.getQueryEditorState().editorMode !== EditorMode.Prompt) {
        queryBuilder.updateQueryState({ query: queryString });
      }
      container.executeAll().catch((error) => {
        services.notifications?.toasts.addError(error, {
          title: 'Query execution failed',
          toastLifeTimeMs: 2000,
        });
      });
    },
    [queryBuilder, container, services.notifications]
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
    () => [createVariableCompletionProvider(() => container.getVariableNames())],
    [container]
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
    // Typing marks the rows stale (Update); the text reaches the query state only on run.
    handleEditorChange: () => container.markStale(),
    focusShortcutId: 'vis_editor_focus_query_bar',
    completionProviders,
  };
};
