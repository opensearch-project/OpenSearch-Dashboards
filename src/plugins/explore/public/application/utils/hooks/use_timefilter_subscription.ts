/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { merge } from 'rxjs';
import { AnyAction } from 'redux';
import { ExploreServices } from '../../../types';
import { RootState } from '../state_management/store';
import { executeQueries } from '../state_management/actions/query_actions';
import { clearQueryStatusMap, clearResults } from '../state_management/slices';

/**
 * Hook to handle timefilter subscription for auto-refresh and time range changes
 */
export const useTimefilterSubscription = (services: ExploreServices) => {
  const dispatch = useDispatch();
  const query = useSelector((state: RootState) => state.query);

  useEffect(() => {
    if (!services?.data?.query?.timefilter?.timefilter) return;

    const timefilter = services.data.query.timefilter.timefilter;
    const subscription = merge(
      timefilter.getTimeUpdate$(),
      timefilter.getAutoRefreshFetch$()
    ).subscribe(() => {
      if (query.dataset) {
        dispatch(clearResults());
        dispatch(clearQueryStatusMap());
        dispatch((executeQueries({ services }) as unknown) as AnyAction);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [services, dispatch, query]);
};
