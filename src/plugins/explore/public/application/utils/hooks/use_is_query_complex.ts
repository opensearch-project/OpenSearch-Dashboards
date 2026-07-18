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
import { selectActiveTabId } from '../state_management/selectors';

/**
 * Returns whether the active tab's last query was classified as complex by query profiling
 * (i.e. the backend ran it on the complex worker pool). Used to gate the complex-query warning
 * banner in the save windows. Resolves to `false` when profiling is off or no result is cached.
 */
export const useIsQueryComplex = (): boolean => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector(selectActiveTabId);

  const cacheKey = useMemo(() => {
    const prepareQuery =
      services.tabRegistry.getTab(activeTabId)?.prepareQuery || defaultPrepareQueryString;
    return prepareQuery(query);
  }, [query, activeTabId, services]);

  return useSelector(
    (state: RootState) => (cacheKey ? state.results[cacheKey]?.isComplex : false) ?? false
  );
};
