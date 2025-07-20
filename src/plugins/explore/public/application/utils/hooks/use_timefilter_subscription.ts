/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ExploreServices } from '../../../types';
import { RootState } from '../state_management/store';
import { runQueryActionCreator } from '../state_management/actions/query_editor';

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
          dispatch(runQueryActionCreator(services, query.query));
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [services, dispatch, query]);
};
