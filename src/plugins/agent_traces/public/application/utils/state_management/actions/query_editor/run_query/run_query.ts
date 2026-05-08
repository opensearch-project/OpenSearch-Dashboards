/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch, RootState } from '../../../store';
import {
  clearResults,
  setQueryStringWithHistory,
  setQueryExecutionButtonStatus,
} from '../../../slices';
import {
  clearQueryStatusMap,
  setIsQueryEditorDirty,
  incrementFetchVersion,
} from '../../../slices/query_editor/query_editor_slice';
import { executeQueries } from '../../query_actions';
import { AgentTracesServices } from '../../../../../../types';
import { detectAndSetOptimalTab } from '../../detect_optimal_tab';

/**
 * This is called when you want to run the query
 */
export const runQueryActionCreator = (services: AgentTracesServices, query?: string) => async (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  const previousQuery = getState().query.query;

  if (typeof query === 'string') {
    dispatch(setQueryStringWithHistory(query));
  }
  dispatch(clearResults());
  dispatch(clearQueryStatusMap());
  dispatch(setIsQueryEditorDirty(false));
  dispatch(incrementFetchVersion());

  await dispatch(executeQueries({ services }));

  // Only auto-detect the optimal tab when the query text has changed. When
  // only the time filter changes (query text stays the same), the user's
  // current tab choice must be preserved. Dataset changes are handled
  // separately by dataset_change_middleware, which clears activeTabId before
  // calling detectAndSetOptimalTab.
  const effectiveQuery = typeof query === 'string' ? query : previousQuery;
  if (effectiveQuery !== previousQuery) {
    await dispatch(detectAndSetOptimalTab({ services }));
  }

  dispatch(setQueryExecutionButtonStatus('REFRESH'));
};
