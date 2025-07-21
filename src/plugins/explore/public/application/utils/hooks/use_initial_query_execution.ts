/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ExploreServices } from '../../../types';
import { RootState } from '../state_management/store';
import { executeQueries } from '../state_management/actions/query_actions';
import { clearResults, clearQueryStatusMap } from '../state_management/slices';
import { detectAndSetOptimalTab } from '../state_management/actions/detect_optimal_tab';

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
    const initializePage = async () => {
      if (!isInitialized && queryState.dataset && shouldSearchOnPageLoad && services) {
        // Add initial default query to history
        const timefilter = services?.data?.query?.timefilter?.timefilter;
        if (timefilter && queryState.query.trim()) {
          services.data.query.queryString.addToQueryHistory(queryState, timefilter.getTime());
        }
        dispatch(clearResults());
        dispatch(clearQueryStatusMap());

        await dispatch(executeQueries({ services }));
        dispatch(detectAndSetOptimalTab({ services }));
        setIsInitialized(true);
      }
    };

    initializePage();
  }, [isInitialized, queryState, shouldSearchOnPageLoad, dispatch, services]);

  return { isInitialized };
};
