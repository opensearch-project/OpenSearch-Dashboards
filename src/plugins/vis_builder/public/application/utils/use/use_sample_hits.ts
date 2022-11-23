/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useLayoutEffect, useState } from 'react';
import { SortDirection } from '../../../../../data/public';
import { IExpressionLoaderParams } from '../../../../../expressions/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../../../types';
import { useIndexPatterns } from './use_index_pattern';

export const useSampleHits = () => {
  const {
    services: {
      data: {
        query: {
          filterManager,
          queryString,
          state$,
          timefilter: { timefilter },
        },
        search: { searchSource },
      },
      uiSettings: config,
    },
  } = useOpenSearchDashboards<VisBuilderServices>();
  const indexPattern = useIndexPatterns().selected;
  const [hits, setHits] = useState<Array<Record<string, any>>>([]);
  const [searchContext, setSearchContext] = useState<IExpressionLoaderParams['searchContext']>({
    query: queryString.getQuery(),
    filters: filterManager.getFilters(),
  });

  useEffect(() => {
    async function getData() {
      if (indexPattern && searchContext) {
        const newSearchSource = await searchSource.create();
        const timeRangeFilter = timefilter.createFilter(indexPattern);

        newSearchSource
          .setField('index', indexPattern)
          .setField('size', config.get('discover:sampleSize') ?? 500)
          .setField('sort', [{ [indexPattern.timeFieldName || '_score']: 'desc' as SortDirection }])
          .setField('filter', [
            ...(searchContext.filters ?? []),
            ...(timeRangeFilter ? [timeRangeFilter] : []),
          ]);

        if (searchContext.query) {
          const contextQuery =
            searchContext.query instanceof Array ? searchContext.query[0] : searchContext.query;

          newSearchSource.setField('query', contextQuery);
        }

        const searchResponse = await newSearchSource.fetch();

        setHits(searchResponse.hits.hits);
      }
    }

    getData();
  }, [config, searchContext, searchSource, indexPattern, timefilter]);

  useLayoutEffect(() => {
    const subscription = state$.subscribe(({ state }) => {
      setSearchContext({
        query: state.query,
        filters: state.filters,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [state$]);

  return hits;
};
