/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { QueryPanelActionDependencies } from '../../../../services/query_panel_actions_registry';
import {
  selectQuery,
  selectOverallQueryStatus,
} from '../../../../application/utils/state_management/selectors';
import { getQueryWithSource } from '../../../../application/utils/languages';
import { useEditorText } from '../../../../application/hooks/editor_hooks/use_editor_text/use_editor_text';

/**
 * Hook to gather all dependencies for query panel actions
 * Provides simplified context with executed query, editor query, and execution status
 *
 * @returns QueryPanelActionDependencies object with 3 fields:
 *   - query: Last executed query (includes query string, language, dataset)
 *   - resultStatus: Query execution status
 *   - queryInEditor: Current query string in the editor with source clause added (ready to execute)
 */
export const useQueryPanelActionDependencies = (): QueryPanelActionDependencies => {
  // Get query state from Redux
  const executedQueryState = useSelector(selectQuery);
  const resultStatus = useSelector(selectOverallQueryStatus);

  // Get current editor text directly from editor
  const getEditorText = useEditorText();

  // Get current editor query text
  const editorQuery = getEditorText();

  // Transform editor query to add source clause (same as executed query)
  // This ensures external plugins receive ready-to-execute queries
  const transformedEditorQuery = getQueryWithSource({
    query: editorQuery,
    language: executedQueryState.language,
    dataset: executedQueryState.dataset,
  });

  return {
    query: getQueryWithSource(executedQueryState),
    resultStatus,
    queryInEditor: transformedEditorQuery.query, // Pass the transformed query string
  };
};
