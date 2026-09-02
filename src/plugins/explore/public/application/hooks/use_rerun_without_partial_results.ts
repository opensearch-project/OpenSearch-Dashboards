/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { executeQueries } from '../utils/state_management/actions/query_actions';
import {
  clearQueryStatusMap,
  clearResults,
  setDisablePartialResults,
} from '../utils/state_management/slices';

/**
 * Rerun the current query with partial results turned off, so an aggregation over an
 * inconsistently-mapped field fails loudly instead of returning a subset of the indices.
 *
 * Used by the partial-results warning banner. The override lives in UI state rather than the
 * `discover:enablePartialResults` setting, so it applies to this query only and does not change the
 * user's preference. Cached results are cleared first, otherwise the rerun would be served the
 * existing (partial) result for the same cache key.
 */
export const useRerunWithoutPartialResults = () => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<ExploreServices>();

  return useCallback(() => {
    dispatch(setDisablePartialResults(true));
    // Clear all cached results, like a normal query run (run_query), rather than by key: one query
    // spans several cache keys (table, histogram, bucket count, tabs) and missing one would serve a
    // stale partial result. clearResults also empties the module resultsCache via the store's cache
    // middleware, so it must not be cleared directly here.
    dispatch(clearResults());
    // Also reset query statuses: executeQueries only re-runs the separate bucket-count query when
    // its status is missing/uninitialized. Clearing results without clearing status would skip it,
    // leaving bucketCount undefined and reverting the summary from "N / M buckets" to "N / M hits".
    dispatch(clearQueryStatusMap());
    // @ts-expect-error TS2345 TODO(ts-error): executeQueries' thunk arg type
    dispatch(executeQueries({ services }));
  }, [dispatch, services]);
};
