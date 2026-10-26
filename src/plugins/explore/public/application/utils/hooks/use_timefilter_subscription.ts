/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ExploreServices } from '../../../types';
import { RootState } from '../state_management/store';
import {
  defaultPrepareQueryString,
  executeQueries,
} from '../state_management/actions/query_actions';
import { clearQueryStatusMap, clearResults } from '../state_management/slices';
import { datasetRequiresExplicitRun } from '../requires_explicit_run';
import { isStreamingQueryAbortable } from '../streaming/streaming_abort_registry';

/**
 * Whether the results query is still streaming. A refresh would supersede it, and when the refresh
 * interval is shorter than the query, every run is superseded before it renders anything.
 */
const isResultsQueryStreaming = (query: RootState['query']): boolean => {
  try {
    return isStreamingQueryAbortable(defaultPrepareQueryString(query));
  } catch {
    return false;
  }
};

/**
 * Hook to handle auto-refresh subscription only.
 *
 * For a dataset type that requires an explicit Run (meta.requiresExplicitRun), a tick refreshes
 * only a query the user has run: one whose results are shown and that wasn't edited since. A
 * refresh interval restored from the URL or a saved query then doesn't start running queries on
 * its own; it does once the user runs the query.
 */
export const useTimefilterSubscription = (services: ExploreServices) => {
  const dispatch = useDispatch();
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
        if (!query.dataset || isResultsQueryStreaming(query)) return;
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
  }, [services, dispatch, query]);
};
