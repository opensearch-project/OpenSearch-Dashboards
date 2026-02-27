/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AgentTracesServices } from '../../../types';
import { RootState } from '../state_management/store';
import { executeQueries } from '../state_management/actions/query_actions';
import { clearQueryStatusMap, clearResults } from '../state_management/slices';

/**
 * Hook to handle auto-refresh subscription only
 */
export const useTimefilterSubscription = (services: AgentTracesServices) => {
  const dispatch = useDispatch();
  const hasDataset = useSelector((state: RootState) => !!state.query.dataset);

  useEffect(() => {
    if (!services?.data?.query?.timefilter?.timefilter) return;

    const subscription = services.data.query.timefilter.timefilter
      .getAutoRefreshFetch$()
      .subscribe(() => {
        if (hasDataset) {
          dispatch(clearResults());
          dispatch(clearQueryStatusMap());
          dispatch(executeQueries({ services }) as unknown);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [services, dispatch, hasDataset]);
};
