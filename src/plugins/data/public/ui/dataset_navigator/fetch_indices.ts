/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { map, scan } from 'rxjs/operators';
import { ISearchStart } from '../../search';

export const fetchIndices = async (search: ISearchStart, dataSourceId: string) => {
  const request = buildSearchRequest(true, '*', dataSourceId);
  return search
    .getDefaultSearchInterceptor()
    .search(request)
    .pipe(map(searchResponseToArray(true)))
    .pipe(scan((accumulator = [], value) => accumulator.join(value)))
    .toPromise()
    .catch(() => []);
};

const searchResponseToArray = (showAllIndices: boolean) => (response) => {
  const { rawResponse } = response;
  if (!rawResponse.aggregations) {
    return [];
  } else {
    return rawResponse.aggregations.indices.buckets
      .map((bucket: { key: string }) => {
        return bucket.key;
      })
      .filter((indexName: string) => {
        if (showAllIndices) {
          return true;
        } else {
          return !indexName.startsWith('.');
        }
      })
      .map((indexName: string) => {
        return {
          name: indexName,
          // item: {},
        };
      });
  }
};

const buildSearchRequest = (showAllIndices: boolean, pattern: string, dataSourceId?: string) => {
  const request = {
    params: {
      ignoreUnavailable: true,
      expand_wildcards: showAllIndices ? 'all' : 'open',
      index: pattern,
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
