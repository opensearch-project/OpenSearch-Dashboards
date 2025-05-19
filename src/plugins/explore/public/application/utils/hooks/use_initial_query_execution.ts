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
    console.log('🚀 Initial Query Execution Effect: Checking conditions');
    console.log('🚀 Initial Query Execution: isInitialized:', isInitialized);
    console.log('🚀 Initial Query Execution: queryState.query available:', !!queryState.query);
    console.log('🚀 Initial Query Execution: queryState.dataset available:', !!queryState.dataset);
    console.log('🚀 Initial Query Execution: shouldSearchOnPageLoad:', shouldSearchOnPageLoad);

    if (
      !isInitialized &&
      queryState.query &&
      queryState.dataset &&
      shouldSearchOnPageLoad &&
      services
    ) {
      console.log('✅ Initial Query Execution: All conditions met, triggering execution');
      console.log('🚀 App.tsx - Triggering initial query execution on page load');
      console.log('🚀 App.tsx - Query state:', queryState);

      // Trigger initial query execution (cache keys will be stored in Redux)
      dispatch(executeQueries({ services }) as unknown);
      console.log('🚀 App.tsx - Initial query execution triggered');
      setIsInitialized(true);
    } else {
      console.log('❌ Initial Query Execution: Conditions not met');
      if (isInitialized) console.log('❌ Initial Query Execution: Already initialized');
      if (!queryState.query) console.log('❌ Initial Query Execution: No query available');
      if (!queryState.dataset) console.log('❌ Initial Query Execution: No dataset available');
      if (!shouldSearchOnPageLoad)
        console.log('❌ Initial Query Execution: shouldSearchOnPageLoad is false');
      if (!services) console.log('❌ Initial Query Execution: Services not available');
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
