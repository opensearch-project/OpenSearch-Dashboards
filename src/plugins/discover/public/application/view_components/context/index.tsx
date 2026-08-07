/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DataExplorerServices, ViewProps } from '../../../../../data_explorer/public';
import {
  OpenSearchDashboardsContextProvider,
  useOpenSearchDashboards,
} from '../../../../../opensearch_dashboards_react/public';
import { getServices } from '../../../opensearch_dashboards_services';
import { useSearch, SearchContextValue } from '../utils/use_search';

const SearchContext = React.createContext<SearchContextValue>({} as SearchContextValue);

// NOOP fallback used when the contextProvider plugin is not available
// (e.g. AI features disabled). Keeps the hook call unconditional.
const NOOP_PAGE_CONTEXT_HOOK = (_options?: any): string => '';

// eslint-disable-next-line import/no-default-export
export default function DiscoverContext({ children }: React.PropsWithChildren<ViewProps>) {
  const { services: deServices } = useOpenSearchDashboards<DataExplorerServices>();
  const services = getServices();
  const searchParams = useSearch({
    ...deServices,
    ...services,
  });

  // Register page context so the AI chatbot is aware of the current query,
  // language, dataset and time range in classic Discover. Classic Discover
  // stores the query one level deeper under `_q.query` (vs `_q` in Explore).
  const usePageContext = services.contextProvider?.hooks?.usePageContext || NOOP_PAGE_CONTEXT_HOOK;
  usePageContext({
    description: 'Discover application page context',
    convert: (urlState: any) => ({
      appId: 'discover',
      timeRange: urlState?._g?.time,
      query: {
        query: urlState?._q?.query?.query || '',
        language: urlState?._q?.query?.language || 'kuery',
      },
      dataset: urlState?._q?.query?.dataset,
    }),
    categories: ['page', 'static'],
  });

  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <SearchContext.Provider value={searchParams}>{children}</SearchContext.Provider>
    </OpenSearchDashboardsContextProvider>
  );
}

export const useDiscoverContext = () => React.useContext(SearchContext);
