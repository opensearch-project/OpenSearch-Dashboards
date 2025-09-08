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
import { selectPatternsField } from '../state_management/selectors';

/**
 * Hook for reading tab specific result from result slice
 */
export const useTabResults = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector((state: RootState) => state.ui.activeTabId);
  const results = useSelector((state: RootState) => state.results);
  const patternsField = useSelector(selectPatternsField); // for use in updating dependency array of cacheKey

  const cacheKey = useMemo(() => {
    const activeTab = services.tabRegistry.getTab(activeTabId);
    const prepareQuery = activeTab?.prepareQuery || defaultPrepareQueryString;
    return prepareQuery(query);
    // TODO: redo logic of using patternsField in dependency array when we have a better method to update cacheKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTabId, services, patternsField]);

  return {
    results: cacheKey ? results[cacheKey] : null,
  };
};
