/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnyAction } from 'redux';
import { ExploreServices } from '../../../types';
import { RootState } from '../state_management/store';
import { executeQueries } from '../state_management/actions/query_actions';
import { clearQueryStatusMap, clearResults } from '../state_management/slices';

/**
 * Hook to handle timefilter subscription for auto-refresh only
 * Note: Time range changes do NOT auto-execute queries - users must click "Run"
 * This preserves Explore's intentional UX where users control query execution
 */
export const useTimefilterSubscription = (services: ExploreServices) => {
  const dispatch = useDispatch();
  const query = useSelector((state: RootState) => state.query);

  useEffect(() => {
    if (!services?.data?.query?.timefilter?.timefilter) return;

    const subscription = services.data.query.timefilter.timefilter
      .getAutoRefreshFetch$()
      .subscribe(() => {
        if (query.dataset) {
          dispatch(clearResults());
          dispatch(clearQueryStatusMap());
          dispatch(executeQueries({ services }) as unknown);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [services, dispatch, query]);
};
