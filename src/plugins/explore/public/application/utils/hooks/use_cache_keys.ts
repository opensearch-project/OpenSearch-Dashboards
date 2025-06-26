/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { RootState } from '../state_management/store';
import { defaultPrepareQuery } from '../state_management/actions/query_actions';
import { ExploreServices } from '../../../types';

/**
 * Hook to compute cache key for default components (histogram, sidebar, etc.)
 * Uses defaultPrepareQuery to prepare the query
 */
export const useDefaultCacheKey = () => {
  const query = useSelector((state: RootState) => state.query);

  return useMemo(() => {
    const queryString = typeof query.query === 'string' ? query.query : '';
    return defaultPrepareQuery(queryString);
  }, [query]);
};

/**
 * Hook to compute cache key for tab components
 * Uses tab-specific prepareQuery if available, falls back to defaultPrepareQuery
 */
export const useTabCacheKey = () => {
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector((state: RootState) => state.ui.activeTabId);
  const services = useOpenSearchDashboards<ExploreServices>().services;

  return useMemo(() => {
    const activeTab = services.tabRegistry?.getTab(activeTabId);
    const prepareQuery = activeTab?.prepareQuery || defaultPrepareQuery;
    const queryString = typeof query.query === 'string' ? query.query : '';
    return prepareQuery(queryString);
  }, [query, activeTabId, services]);
};
