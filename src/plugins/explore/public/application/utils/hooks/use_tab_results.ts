/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../state_management/store';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { defaultPrepareQuery } from '../state_management/actions/query_actions';

/**
 * Hook for reading tab specific result from result slice
 */
export const useTabResults = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector((state: RootState) => state.ui.activeTabId);
  const results = useSelector((state: RootState) => state.results);

  const cacheKey = useMemo(() => {
    const activeTab = services.tabRegistry?.getTab(activeTabId);
    const prepareQuery = activeTab?.prepareQuery || defaultPrepareQuery;
    const queryInput = typeof query.query === 'string' ? query.query : '';
    return prepareQuery(queryInput);
  }, [query, activeTabId, services]);

  return {
    results: cacheKey ? results[cacheKey] : null,
  };
};
