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
import {
  executeQueries,
  shouldSkipQueryExecution,
  supersedeAllActiveQueries,
} from '../../query_actions';
import { ExploreServices } from '../../../../../../types';
import { detectAndSetOptimalTab } from '../../detect_optimal_tab';

/**
 * This is called when you want to run the query. It always runs: an automatic caller (not a
 * user's Run) must check `datasetRequiresExplicitRun` before dispatching it.
 */
export const runQueryActionCreator =
  (services: ExploreServices, query?: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const previousQuery = getState().query.query;
    // No tab chosen yet: the page loaded without running (e.g. a link to a dataset that needs an
    // explicit Run) and without a tab in the URL, so this first Run picks it.
    const hasActiveTab = !!getState().ui?.activeTabId;

    if (typeof query === 'string') {
      dispatch(setQueryStringWithHistory(query));
    }
    // The results and statuses are cleared for this run, so a query still running could neither
    // be shown nor stopped any more: stop it. This run only replaces runs of its own keys, and an
    // edited query's keys differ.
    supersedeAllActiveQueries();
    dispatch(clearResults());
    dispatch(clearQueryStatusMap());
    dispatch(setIsQueryEditorDirty(false));

    // Only re-detect the optimal tab when the query text actually changed, or when no tab has
    // been chosen yet. Time-only refreshes (same query) should preserve the current tab choice.
    if (query !== previousQuery || !hasActiveTab) {
      await dispatch(detectAndSetOptimalTab({ services }));
    }

    const state = getState();
    if (!shouldSkipQueryExecution(state.query)) {
      await dispatch(executeQueries({ services }));
    }

    dispatch(setQueryExecutionButtonStatus('REFRESH'));
  };
