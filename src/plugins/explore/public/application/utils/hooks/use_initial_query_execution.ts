/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ExploreServices } from '../../../types';
import { RootState } from '../state_management/store';
import { executeQueries } from '../state_management/actions/query_actions';
import { clearResults, clearQueryStatusMap, setIsInitialized } from '../state_management/slices';
import { detectAndSetOptimalTab } from '../state_management/actions/detect_optimal_tab';
import { selectActiveTabId } from '../state_management/selectors';
import { useCurrentExploreId } from './use_current_explore_id';

/**
 * Hook to handle initial query execution on page load
 * TODO: refactor this hook to combine it with useInitPage()
 */
export const useInitialQueryExecution = (services: ExploreServices) => {
  const dispatch = useDispatch();
  const { isInitialized } = useSelector((state: RootState) => state.meta);
  const queryState = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector(selectActiveTabId);
  const exploreId = useCurrentExploreId();

  const shouldSearchOnPageLoad = useMemo(() => {
    return services?.uiSettings?.get('discover:searchOnPageLoad', true) ?? true;
  }, [services?.uiSettings]);

  useEffect(() => {
    const initializePage = async () => {
      if (
        !isInitialized &&
        queryState.dataset &&
        shouldSearchOnPageLoad &&
        services &&
        !exploreId // saved search loading and execution is handled by useInitPage()
      ) {
        // Add initial default query to history
        const timefilter = services?.data?.query?.timefilter?.timefilter;
        if (timefilter && queryState.query.trim()) {
          services.data.query.queryString.addToQueryHistory(queryState, timefilter.getTime());
        }
        dispatch(clearResults());
        dispatch(clearQueryStatusMap());

        await dispatch(executeQueries({ services }));
        if (!activeTabId) {
          dispatch(detectAndSetOptimalTab({ services }));
        }
        dispatch(setIsInitialized(true));
      }
    };

    initializePage();
  }, [
    isInitialized,
    queryState,
    activeTabId,
    shouldSearchOnPageLoad,
    dispatch,
    services,
    exploreId,
  ]);

  return { isInitialized };
};
