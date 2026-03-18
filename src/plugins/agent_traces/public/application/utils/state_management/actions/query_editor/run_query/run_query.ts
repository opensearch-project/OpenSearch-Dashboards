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
  if (typeof query === 'string') {
    dispatch(setQueryStringWithHistory(query));
  }
  dispatch(clearResults());
  dispatch(clearQueryStatusMap());
  dispatch(setIsQueryEditorDirty(false));
  dispatch(incrementFetchVersion());

  await dispatch(executeQueries({ services }));

  // Detect optimal tab after queries execute — the tab switch will
  // trigger the tabs component's onTabClick which executes the tab query
  // if results aren't cached yet.
  await dispatch(detectAndSetOptimalTab({ services }));

  dispatch(setQueryExecutionButtonStatus('REFRESH'));
};
