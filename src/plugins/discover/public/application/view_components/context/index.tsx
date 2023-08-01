/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { DataExplorerServices, ViewProps } from '../../../../../data_explorer/public';
import {
  OpenSearchDashboardsContextProvider,
  useOpenSearchDashboards,
} from '../../../../../opensearch_dashboards_react/public';
import { getServices } from '../../../opensearch_dashboards_services';
import { useSearch, SearchContextValue } from '../utils/use_search';
import { connectStorageToQueryState, opensearchFilters } from '../../../../../data/public';

const SearchContext = React.createContext<SearchContextValue>({} as SearchContextValue);

// eslint-disable-next-line import/no-default-export
export default function DiscoverContext({ children }: React.PropsWithChildren<ViewProps>) {
  const services = getServices();
  const searchParams = useSearch(services);

  const {
    services: { osdUrlStateStorage },
  } = useOpenSearchDashboards<DataExplorerServices>();

  // Connect the query service to the url state
  useEffect(() => {
    connectStorageToQueryState(services.data.query, osdUrlStateStorage, {
      filters: opensearchFilters.FilterStateStore.APP_STATE,
      query: true,
    });
  }, [osdUrlStateStorage, services.data.query, services.uiSettings]);

  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <SearchContext.Provider value={searchParams}>{children}</SearchContext.Provider>
    </OpenSearchDashboardsContextProvider>
  );
}

export const useDiscoverContext = () => React.useContext(SearchContext);
