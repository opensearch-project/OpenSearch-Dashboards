/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { map } from 'rxjs/operators';
import { ISearchStart } from '../../search';

export const fetchIndices = async (search: ISearchStart, dataSourceId?: string) => {
  const buildSearchRequest = () => {
    const request = {
      params: {
        ignoreUnavailable: true,
        expand_wildcards: 'all',
        index: '*',
        body: {
          size: 0, // no hits
          aggs: {
            indices: {
              terms: {
                field: '_index',
                size: 100,
              },
            },
          },
        },
      },
      dataSourceId,
    };

    return request;
  };

  const searchResponseToArray = (response: any) => {
    const { rawResponse } = response;
    return rawResponse.aggregations
      ? rawResponse.aggregations.indices.buckets.map((bucket: { key: any }) => bucket.key)
      : [];
  };

  return search
    .getDefaultSearchInterceptor()
    .search(buildSearchRequest())
    .pipe(map(searchResponseToArray))
    .toPromise();
};
