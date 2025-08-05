/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch, RootState } from '../../../store';
import {
  clearResults,
  setQueryStringWithHistory,
  setActiveTab,
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
  const {
    queryEditor: { queryExecutionButtonStatus },
  } = getState();

  if (queryExecutionButtonStatus === 'REFRESH') {
    return;
  }

  if (typeof query === 'string') {
    dispatch(setQueryStringWithHistory(query));
  }
  dispatch(clearResults());
  dispatch(clearQueryStatusMap());
  dispatch(setIsQueryEditorDirty(false));

  await dispatch(executeQueries({ services }));

  dispatch(setActiveTab(''));
  await dispatch(detectAndSetOptimalTab({ services }));
  dispatch(setQueryExecutionButtonStatus('REFRESH'));
};
