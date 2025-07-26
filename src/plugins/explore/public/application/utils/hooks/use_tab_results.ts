/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../state_management/store';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { defaultPrepareQueryString } from '../state_management/actions/query_actions';

/**
 * Hook for reading tab specific result from result slice
 */
export const useTabResults = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  // Get the full state to pass to prepareQuery
  const fullState = useSelector((state: RootState) => state);

  const {
    query,
    ui: { activeTabId },
    results,
  } = fullState;

  const cacheKey = useMemo(() => {
    const activeTab = services.tabRegistry.getTab(activeTabId);
    const prepareQuery = activeTab?.prepareQuery || defaultPrepareQueryString;

    return prepareQuery(query, fullState);
  }, [query, activeTabId, services, fullState]);

  return {
    results: cacheKey ? results[cacheKey] : null,
  };
};
