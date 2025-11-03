/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { QueryPanelActionDependencies } from '../../../../services/query_panel_actions_registry';
import {
  selectQuery,
  selectOverallQueryStatus,
  selectCurrentEditorQuery,
} from '../../../../application/utils/state_management/selectors';
import { getQueryWithSource } from '../../../../application/utils/languages';

/**
 * Hook to gather all dependencies for query panel actions
 * Provides simplified context with executed query, editor query, and execution status
 *
 * @returns QueryPanelActionDependencies object with 3 fields:
 *   - query: Last executed query (includes query string, language, dataset)
 *   - resultStatus: Query execution status
 *   - queryInEditor: Current query string in the editor (may differ from executed query)
 */
export const useQueryPanelActionDependencies = (): QueryPanelActionDependencies => {
  // Get query state from Redux
  const executedQueryState = useSelector(selectQuery);
  const resultStatus = useSelector(selectOverallQueryStatus);
  const queryInEditor = useSelector(selectCurrentEditorQuery);

  return useMemo<QueryPanelActionDependencies>(
    () => ({
      query: getQueryWithSource(executedQueryState),
      resultStatus,
      queryInEditor,
    }),
    [executedQueryState, resultStatus, queryInEditor]
  );
};
