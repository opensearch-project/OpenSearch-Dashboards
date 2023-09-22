/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IndexPattern,
  ISearchSource,
  indexPatterns as indexPatternUtils,
  AggConfigs,
} from '../../../../../data/public';
import { DiscoverServices } from '../../../build_services';
import { SortOrder } from '../../../saved_searches/types';
import { getSortForSearchSource } from './get_sort_for_search_source';
import { SORT_DEFAULT_ORDER_SETTING, SAMPLE_SIZE_SETTING } from '../../../../common';

interface Props {
  indexPattern: IndexPattern;
  services: DiscoverServices;
  sort: SortOrder[] | undefined;
  searchSource?: ISearchSource;
  histogramConfigs?: AggConfigs;
}

export const updateSearchSource = async ({
  indexPattern,
  services,
  searchSource,
  sort,
  histogramConfigs,
}: Props) => {
  const { uiSettings, data } = services;
  const sortForSearchSource = getSortForSearchSource(
    sort,
    indexPattern,
    uiSettings.get(SORT_DEFAULT_ORDER_SETTING)
  );
  const size = uiSettings.get(SAMPLE_SIZE_SETTING);
  const filters = data.query.filterManager.getFilters();

  const searchSourceInstance = searchSource || (await data.search.searchSource.create());

  // searchSource which applies time range
  const timeRangeSearchSource = await data.search.searchSource.create();
  const { isDefault } = indexPatternUtils;
  if (isDefault(indexPattern)) {
    const timefilter = data.query.timefilter.timefilter;

    timeRangeSearchSource.setField('filter', () => {
      return timefilter.createFilter(indexPattern);
    });
  }

  searchSourceInstance.setParent(timeRangeSearchSource);

  searchSourceInstance.setFields({
    index: indexPattern,
    sort: sortForSearchSource,
    size,
    query: data.query.queryString.getQuery() || null,
    highlightAll: true,
    version: true,
    filter: filters,
  });

  if (histogramConfigs) {
    const dslAggs = histogramConfigs.toDsl();
    searchSourceInstance.setField('aggs', dslAggs);
  }

  return searchSourceInstance;
};
