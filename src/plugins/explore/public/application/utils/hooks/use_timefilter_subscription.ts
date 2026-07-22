/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ExploreServices } from '../../../types';
import { RootState } from '../state_management/store';
import { executeQueries } from '../state_management/actions/query_actions';
import { clearQueryStatusMap, clearResults } from '../state_management/slices';

/**
 * Hook to handle auto-refresh subscription only
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
          // @ts-expect-error TS2345 TODO(ts-error): fixme
          dispatch(executeQueries({ services }) as unknown);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [services, dispatch, query]);
};
