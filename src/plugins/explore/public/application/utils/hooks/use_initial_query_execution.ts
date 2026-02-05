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
import { useDatasetContext } from '../../context';

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
  const { dataset: datasetFromContext, isLoading: datasetLoading } = useDatasetContext();

  const shouldSearchOnPageLoad = useMemo(() => {
    if (queryState.dataset && services?.data?.query?.queryString) {
      const datasetService = services.data.query.queryString.getDatasetService();
      const typeConfig = datasetService.getType(queryState.dataset.type);
      const datasetSearchOnLoad = typeConfig?.meta?.searchOnLoad;
      if (datasetSearchOnLoad !== undefined) {
        return datasetSearchOnLoad;
      }
    }

    return services?.uiSettings?.get('discover:searchOnPageLoad', true) ?? true;
  }, [services?.uiSettings, services?.data?.query?.queryString, queryState.dataset]);

  useEffect(() => {
    const initializePage = async () => {
      if (
        !isInitialized &&
        queryState.dataset &&
        shouldSearchOnPageLoad &&
        services &&
        !exploreId && // saved search loading and execution is handled by useInitPage()
        datasetFromContext && // Wait for dataset to be loaded by DatasetProvider
        datasetLoading === false // Wait for DatasetProvider to finish loading
      ) {
        // Add initial default query to history
        const timefilter = services?.data?.query?.timefilter?.timefilter;
        if (timefilter && queryState.query.trim()) {
          services.data.query.queryString.addToQueryHistory(queryState, timefilter.getTime());
        }
        dispatch(clearResults());
        dispatch(clearQueryStatusMap());

        // @ts-expect-error TS2345 TODO(ts-error): fixme
        await dispatch(executeQueries({ services }));
        if (!activeTabId) {
          // @ts-expect-error TS2345 TODO(ts-error): fixme
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
    datasetFromContext,
    datasetLoading,
  ]);

  return { isInitialized };
};
