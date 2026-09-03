/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { executeQueries } from '../utils/state_management/actions/query_actions';
import { clearQueryStatusMap, clearResults } from '../utils/state_management/slices';

/**
 * Rerun the current query with partial results turned off, so an aggregation over an
 * inconsistently-mapped field returns the complete result over all indices (via a slower
 * full-document scan) instead of a partial result over just the aggregatable subset.
 *
 * Used by the partial-results warning banner. The opt-out is passed to executeQueries as a
 * per-execution thunk arg rather than stored in state, so it applies to this one run only: a later
 * time-range change or refresh reverts to the `discover:enablePartialResults` preference. Cached
 * results are cleared first, otherwise the rerun would be served the existing (partial) result for
 * the same cache key.
 */
export const useRerunWithoutPartialResults = () => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<ExploreServices>();

  return useCallback(() => {
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
    dispatch(executeQueries({ services, disablePartialResults: true }));
  }, [dispatch, services]);
};
