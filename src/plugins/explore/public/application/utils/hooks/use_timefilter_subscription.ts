/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ExploreServices } from '../../../types';
import { RootState } from '../state_management/store';
import { executeQueries } from '../state_management/actions/query_actions';
import { clearResults } from '../state_management/slices/results_slice';

/**
 * Hook to handle timefilter subscription and re-execute queries on time range changes
 * Follows discover pattern for time range change handling
 */
export const useTimefilterSubscription = (services: ExploreServices) => {
  const dispatch = useDispatch();
  const queryState = useSelector((state: RootState) => state.query);

  // TimeFilter Changes: Manual subscription to trigger Redux actions
  useEffect(() => {
    if (!services?.data?.query?.timefilter?.timefilter) return;

    const subscription = services.data.query.timefilter.timefilter
      .getTimeUpdate$()
      .subscribe(() => {
        // Only execute if we have a query and dataset
        if (queryState.query && queryState.dataset) {
          // EXPLICIT cache clear - separate cache logic
          dispatch(clearResults());
          // Execute queries - cache already cleared
          dispatch(executeQueries({ services }) as unknown);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [services, dispatch, queryState.query, queryState.dataset]);
};
