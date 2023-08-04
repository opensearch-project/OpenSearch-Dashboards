/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPattern } from 'src/plugins/data/public';
import { DiscoverServices } from '../../../build_services';
import { SortOrder } from '../../../saved_searches/types';
import { getSortForSearchSource } from './get_sort_for_search_source';
import { SORT_DEFAULT_ORDER_SETTING, SAMPLE_SIZE_SETTING } from '../../../../common';

interface Props {
  indexPattern: IndexPattern;
  services: DiscoverServices;
  sort: SortOrder[] | undefined;
}

export const createSearchSource = async ({ indexPattern, services, sort }: Props) => {
  const { uiSettings, data } = services;
  const sortForSearchSource = getSortForSearchSource(
    sort,
    indexPattern,
    uiSettings.get(SORT_DEFAULT_ORDER_SETTING)
  );
  const size = uiSettings.get(SAMPLE_SIZE_SETTING);
  const filters = data.query.filterManager.getFilters();
  const searchSource = await data.search.searchSource.create({
    index: indexPattern,
    sort: sortForSearchSource,
    size,
    query: data.query.queryString.getQuery() || null,
    highlightAll: true,
    version: true,
  });

  // Add time filter
  const timefilter = data.query.timefilter.timefilter;
  const timeRangeFilter = timefilter.createFilter(indexPattern);
  if (timeRangeFilter) {
    filters.push(timeRangeFilter);
  }
  searchSource.setField('filter', filters);

  return searchSource;
};
