/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import { ExploreServices } from '../../../types';
import { RootState } from '../state_management/store';
import {
  defaultPrepareQueryString,
  executeQueries,
} from '../state_management/actions/query_actions';
import { STREAMING_MAX_HELD_ROWS } from '../state_management/actions/streaming_query_actions';
import { clearQueryStatusMap, clearResults } from '../state_management/slices';
import { QueryExecutionStatus } from '../state_management/types';
import { datasetRequiresExplicitRun } from '../requires_explicit_run';
import { isStreamingQueryAbortable } from '../streaming/streaming_abort_registry';

// The streamed results table's key and progress, while its run is still polling.
const getPollingStreamedTable = (state: RootState) => {
  let cacheKey: string;
  try {
    cacheKey = defaultPrepareQueryString(state.query);
  } catch {
    return undefined;
  }
  if (!isStreamingQueryAbortable(cacheKey)) return undefined;
  const streaming = state.queryEditor?.queryStatusMap?.[cacheKey]?.streaming;
  return streaming?.isPolling ? { cacheKey, streaming } : undefined;
};

// A refresh would supersede the queries still running, and with an interval shorter than the
// query nothing would ever render, while every restart scans the source again. The run itself,
// the table, the histogram and the tab queries each report LOADING until they settle.
const isRunInFlight = (state: RootState): boolean => {
  const streamedTable = getPollingStreamedTable(state);
  // Past the row cap the table's run only polls for status, so it doesn't hold refreshes back;
  // the page's other queries still do. `total` counts only the rows produced so far, so a client
  // that has caught up is not done.
  if (streamedTable && streamedTable.streaming.rowsFetched < STREAMING_MAX_HELD_ROWS) return true;
  return Object.entries(state.queryEditor?.queryStatusMap ?? {}).some(
    ([cacheKey, status]) =>
      cacheKey !== streamedTable?.cacheKey && status?.status === QueryExecutionStatus.LOADING
  );
};

/**
 * Hook to handle auto-refresh subscription only.
 *
 * A tick does nothing while the page's queries are still running; the next tick after they
 * settle refreshes. A Refresh or a change of the query, time range or dataset is not a tick and
 * still replaces the running queries.
 *
 * For a dataset type that requires an explicit Run (meta.requiresExplicitRun), a tick refreshes
 * only a query the user has run: one whose results are shown and that wasn't edited since. A
 * refresh interval restored from the URL or a saved query then doesn't start running queries on
 * its own; it does once the user runs the query.
 */
export const useTimefilterSubscription = (services: ExploreServices) => {
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const query = useSelector((state: RootState) => state.query);
  const hasRunCurrentQuery = useSelector(
    (state: RootState) =>
      !state.queryEditor?.isQueryEditorDirty &&
      Object.keys(state.queryEditor?.queryStatusMap ?? {}).length > 0
  );
  // Read by the tick without re-subscribing on every status change.
  const hasRunCurrentQueryRef = useRef(hasRunCurrentQuery);
  hasRunCurrentQueryRef.current = hasRunCurrentQuery;

  useEffect(() => {
    if (!services?.data?.query?.timefilter?.timefilter) return;

    const subscription = services.data.query.timefilter.timefilter
      .getAutoRefreshFetch$()
      .subscribe(() => {
        if (!query.dataset || isRunInFlight(store.getState())) return;
        if (
          !hasRunCurrentQueryRef.current &&
          datasetRequiresExplicitRun(services.data.query.queryString, query.dataset)
        ) {
          return;
        }
        dispatch(clearResults());
        dispatch(clearQueryStatusMap());
        // @ts-expect-error TS2345 TODO(ts-error): fixme
        dispatch(executeQueries({ services }) as unknown);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [services, dispatch, store, query]);
};
