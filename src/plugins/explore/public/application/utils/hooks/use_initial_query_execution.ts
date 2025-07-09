/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ExploreServices } from '../../../types';
import { RootState } from '../state_management/store';
import { executeQueries } from '../state_management/actions/query_actions';
import { clearResults } from '../state_management/slices';

/**
 * Hook to handle initial query execution on page load
 */
export const useInitialQueryExecution = (services: ExploreServices) => {
  const dispatch = useDispatch();
  const queryState = useSelector((state: RootState) => state.query);
  const [isInitialized, setIsInitialized] = useState(false);

  const shouldSearchOnPageLoad = useMemo(() => {
    return services?.uiSettings?.get('discover:searchOnPageLoad', true) ?? true;
  }, [services?.uiSettings]);

  useEffect(() => {
    if (!isInitialized && queryState.dataset && shouldSearchOnPageLoad && services) {
      // Add initial default query to history
      const timefilter = services?.data?.query?.timefilter?.timefilter;
      if (timefilter && queryState.query.trim()) {
        services.data.query.queryString.addToQueryHistory(queryState, timefilter.getTime());
      }

      // Execute the initial query
      dispatch(clearResults());
      dispatch(executeQueries({ services }) as unknown);
      setIsInitialized(true);
    }
  }, [isInitialized, queryState, shouldSearchOnPageLoad, dispatch, services]);

  return { isInitialized };
};
