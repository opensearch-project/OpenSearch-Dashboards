/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { ExploreServices } from '../../../../types';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExecutionContextSearch } from '../../../../../../expressions/common/';

export const useSearchContext = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [searchContext, setSearchContext] = useState<ExecutionContextSearch>({
    query: services.data.query.queryString.getQuery(),
    filters: services.data.query.filterManager.getFilters(),
    timeRange: services.data.query.timefilter.timefilter.getTime(),
  });
  // Hook to update the search context whenever the query state changes
  // This will ensure that the visualization is always up-to-date with the latest query and filters
  // Also updates the enableViz state based on the query language
  useEffect(() => {
    const subscription = services.data.query.state$.subscribe(({ state }) => {
      setSearchContext({
        query: state.query,
        timeRange: state.time,
        filters: state.filters,
      });
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [services.data.query.queryString, services.data.query.state$]);
  return searchContext;
};
