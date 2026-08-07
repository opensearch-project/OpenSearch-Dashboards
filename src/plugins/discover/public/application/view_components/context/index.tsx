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
import { useExecuteQueryAction } from '../actions/execute_query_action';

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
  const languageService = services.data?.query?.queryString?.getLanguageService?.();
  usePageContext({
    description: 'Discover application page context',
    convert: (urlState: any) => {
      const languageKey = urlState?._q?.query?.language || 'kuery';
      const languageDisplayName = languageService?.getLanguage(languageKey)?.title;
      return {
        appId: 'discover',
        timeRange: urlState?._g?.time,
        query: {
          query: urlState?._q?.query?.query || '',
          language: languageKey,
          ...(languageDisplayName ? { languageDisplayName } : {}),
        },
        dataset: urlState?._q?.query?.dataset,
      };
    },
    categories: ['page', 'static'],
  });

  // Register the execute query action for assistant integration
  useExecuteQueryAction(
    services,
    searchParams.data$,
    searchParams.refetch$,
    searchParams.queryComplete$
  );

  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <SearchContext.Provider value={searchParams}>{children}</SearchContext.Provider>
    </OpenSearchDashboardsContextProvider>
  );
}

export const useDiscoverContext = () => React.useContext(SearchContext);
