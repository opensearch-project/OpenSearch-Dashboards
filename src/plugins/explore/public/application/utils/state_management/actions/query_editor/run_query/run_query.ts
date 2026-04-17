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
} from '../../../slices/query_editor/query_editor_slice';
import { executeQueries } from '../../query_actions';
import { ExploreServices } from '../../../../../../types';
import { detectAndSetOptimalTab } from '../../detect_optimal_tab';

/**
 * This is called when you want to run the query
 */
export const runQueryActionCreator = (services: ExploreServices, query?: string) => async (
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

  // Only re-detect the optimal tab when the query text actually changed.
  // Time-only refreshes (no query param or same query) should preserve the
  // current tab choice.
  if (query !== previousQuery) {
    await dispatch(detectAndSetOptimalTab({ services }));
  }

  await dispatch(executeQueries({ services }));

  dispatch(setQueryExecutionButtonStatus('REFRESH'));
};
