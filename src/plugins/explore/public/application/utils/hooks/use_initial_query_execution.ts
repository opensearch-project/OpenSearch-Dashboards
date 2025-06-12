/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ExploreServices } from '../../../types';
import { RootState } from '../state_management/store';
import { executeQueries } from '../state_management/actions/query_actions';

/**
 * Hook to handle initial query execution on page load
 * Follows discover pattern for initial search behavior
 */
export const useInitialQueryExecution = (services: ExploreServices) => {
  const dispatch = useDispatch();
  const queryState = useSelector((state: RootState) => state.query);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if should search on page load (like discover)
  const shouldSearchOnPageLoad = useMemo(() => {
    return services.uiSettings.get('discover:searchOnPageLoad', true);
  }, [services.uiSettings]);

  // Initial query execution - simplified logic
  useEffect(() => {
    if (
      !isInitialized &&
      queryState.query &&
      queryState.dataset &&
      shouldSearchOnPageLoad &&
      services
    ) {
      // Trigger initial query execution (cache keys will be stored in Redux)
      dispatch(executeQueries({ services }) as unknown);

      setIsInitialized(true);
    } else {
      if (isInitialized)
        if (!queryState.query)
          if (!queryState.dataset) if (!shouldSearchOnPageLoad) if (!services) return;
    }
  }, [
    isInitialized,
    queryState.query,
    queryState.dataset,
    shouldSearchOnPageLoad,
    dispatch,
    services,
  ]);

  return { isInitialized };
};
