/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../state_management/store';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../types';
import { defaultPrepareQueryString } from '../state_management/actions/query_actions';
import { selectPatternsField } from '../state_management/selectors';
import { selectQueryStatusMapByKey } from '../state_management/selectors/query_editor/query_editor';

/**
 * Hook for reading tab specific result from result slice
 */
export const useTabResults = () => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector((state: RootState) => state.ui.activeTabId);
  const patternsField = useSelector(selectPatternsField); // for use in updating dependency array of cacheKey

  const cacheKey = useMemo(() => {
    const activeTab = services.tabRegistry.getTab(activeTabId);
    const prepareQuery = activeTab?.prepareQuery || defaultPrepareQueryString;
    return prepareQuery(query);
    // TODO: redo logic of using patternsField in dependency array when we have a better method to update cacheKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTabId, services, patternsField]);

  // Select only the specific result by cache key instead of the entire results map
  const result = useSelector((state: RootState) => (cacheKey ? state.results[cacheKey] : null));
  const status = useSelector((state: RootState) => selectQueryStatusMapByKey(state, cacheKey));

  return {
    results: result,
    status,
  };
};
