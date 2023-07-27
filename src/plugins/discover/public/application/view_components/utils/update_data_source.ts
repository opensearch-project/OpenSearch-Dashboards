/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISearchSource, IndexPattern } from 'src/plugins/data/public';
import { DiscoverServices } from '../../../build_services';
import { SortOrder } from '../../../saved_searches/types';
import { getSortForSearchSource } from './get_sort_for_search_source';
import { SORT_DEFAULT_ORDER_SETTING, SAMPLE_SIZE_SETTING } from '../../../../common';

export interface UpdateDataSourceProps {
  searchSource: ISearchSource;
  indexPattern: IndexPattern;
  services: DiscoverServices;
  sort: SortOrder[] | undefined;
}

export const updateDataSource = ({
  searchSource,
  indexPattern,
  services,
  sort,
}: UpdateDataSourceProps) => {
  const { uiSettings, data } = services;
  const sortForSearchSource = getSortForSearchSource(
    sort,
    indexPattern,
    uiSettings.get(SORT_DEFAULT_ORDER_SETTING)
  );
  const size = uiSettings.get(SAMPLE_SIZE_SETTING);
  const updatedSearchSource = searchSource
    .setField('index', indexPattern)
    .setField('sort', sortForSearchSource)
    .setField('size', size)
    .setField('query', data.query.queryString.getQuery() || null)
    .setField('filter', data.query.filterManager.getFilters())
    .setField('highlightAll', true)
    .setField('version', true);

  return updatedSearchSource;
};
