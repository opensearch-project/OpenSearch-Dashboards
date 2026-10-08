/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { merge } from 'rxjs';
import { DataExplorerServices, ViewProps } from '../../../../../data_explorer/public';
import {
  OpenSearchDashboardsContextProvider,
  useOpenSearchDashboards,
} from '../../../../../opensearch_dashboards_react/public';
import { buildOpenSearchQuery, getOpenSearchQueryConfig } from '../../../../../data/common';
import { getServices } from '../../../opensearch_dashboards_services';
import { useSearch, SearchContextValue } from '../utils/use_search';
import { useApplyQueryAction } from '../actions/apply_query_action';

const SearchContext = React.createContext<SearchContextValue>({} as SearchContextValue);
const DISCOVER_PAGE_CONTEXT_ID = 'discover-page-context';

function buildDiscoverPageContextValue(services: ReturnType<typeof getServices>) {
  const { filterManager, timefilter, queryString } = services.data.query;
  const currentQuery = queryString.getQuery();
  const language = currentQuery.language || 'kuery';
  const languageConfig = queryString.getLanguageService()?.getLanguage?.(language);

  // SQL expresses time/filter constraints inline, so both are omitted for
  // languages where hideDatePicker/fields.filterable indicate they're not
  // used, matching the search bar's own visibility flags.
  const supportsTimeFilter = !languageConfig?.hideDatePicker;
  const supportsFilters = languageConfig?.fields?.filterable ?? true;

  let filtersContext: { filters?: unknown; filtersNote?: string } = {};
  if (supportsFilters) {
    const rawFilters = filterManager.getFilters();
    if (rawFilters.length > 0) {
      // Convert to the same OpenSearch DSL SearchSource.flatten() sends to
      // the backend. queries=[] is safe here since it makes the
      // buildOpenSearchQuery 'unsupported' branch unreachable.
      const opensearchQueryConfig = getOpenSearchQueryConfig({
        get: services.uiSettings.get.bind(services.uiSettings),
      });
      const builtQuery = buildOpenSearchQuery(undefined, [], rawFilters, opensearchQueryConfig);
      const filtersDsl = 'bool' in builtQuery ? builtQuery.bool : undefined;
      if (filtersDsl !== undefined) {
        filtersContext = {
          filters: filtersDsl,
          filtersNote:
            'These filters are already applied as an OpenSearch DSL query on top of the search.',
        };
      }
    }
  }

  return {
    appId: 'discover',
    ...(supportsTimeFilter ? { timeRange: timefilter.timefilter.getTime() } : {}),
    query: {
      query: currentQuery.query || '',
      language,
      ...(languageConfig?.title ? { languageDisplayName: languageConfig.title } : {}),
    },
    dataset: currentQuery.dataset,
    ...filtersContext,
  };
}

// eslint-disable-next-line import/no-default-export
export default function DiscoverContext({ children }: React.PropsWithChildren<ViewProps>) {
  const { services: deServices } = useOpenSearchDashboards<DataExplorerServices>();
  const services = getServices();
  const searchParams = useSearch({
    ...deServices,
    ...services,
  });

  useEffect(() => {
    const contextStore = services.contextProvider?.getAssistantContextStore?.();
    if (!contextStore) return;

    const { suppressDefaultPageContext, unsuppressDefaultPageContext } =
      services.contextProvider?.actions ?? {};
    suppressDefaultPageContext?.();

    const registerContext = () => {
      contextStore.addContext({
        id: DISCOVER_PAGE_CONTEXT_ID,
        description: 'Discover application page context',
        value: buildDiscoverPageContextValue(services),
        label: 'Page: Discover',
        categories: ['page', 'static'],
      });
    };
    registerContext();

    const { filterManager, timefilter, queryString } = services.data.query;
    const subscription = merge(
      filterManager.getUpdates$(),
      timefilter.timefilter.getTimeUpdate$(),
      queryString.getUpdates$()
    ).subscribe(registerContext);

    return () => {
      subscription.unsubscribe();
      contextStore.removeContextById(DISCOVER_PAGE_CONTEXT_ID);
      unsuppressDefaultPageContext?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register the apply query action for assistant integration
  useApplyQueryAction(
    services,
    searchParams.data$,
    searchParams.refetch$,
    searchParams.queryComplete$,
    searchParams.queryAbort$
  );

  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <SearchContext.Provider value={searchParams}>{children}</SearchContext.Provider>
    </OpenSearchDashboardsContextProvider>
  );
}

export const useDiscoverContext = () => React.useContext(SearchContext);
