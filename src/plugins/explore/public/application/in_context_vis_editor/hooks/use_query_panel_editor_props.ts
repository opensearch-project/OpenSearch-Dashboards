/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { QueryEditorProps } from '../../../components/query_panel/query_panel_editor/types';
import { useQueryBuilderState } from './use_query_builder_state';
import { EditorMode } from '../../utils/state_management/types';
import { useEditorOperations } from './use_editor_operations';

export const useQueryPanelEditorProps = (): QueryEditorProps => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryBuilder, queryState, queryEditorState } = useQueryBuilderState();
  const { switchEditorMode } = useEditorOperations();
  const isPromptMode = queryEditorState.editorMode === EditorMode.Prompt;

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
    const panelEl = domNode?.closest('.exploreResizableQueryContainer__queryPanel');
    return panelEl?.clientHeight ?? domNode?.parentElement?.clientHeight ?? 100;
  }, []);

  return {
    services,
    editorRef: queryBuilder.editorRef,
    queryState,
    queryEditorState,
    onRun,
    switchEditorMode,
    getEditorContainerHeight,
    handleEditorChange: (updates) => queryBuilder.updateQueryEditorState(updates),
    focusShortcutId: 'vis_editor_focus_query_bar',
  };
};
