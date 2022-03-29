/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateAggConfigParams } from 'src/plugins/data/common';
import { DataPublicPluginStart, IndexPattern } from 'src/plugins/data/public';

interface IDoAsyncSearch {
  data: DataPublicPluginStart;
  indexPattern: IndexPattern | null;
  aggs?: CreateAggConfigParams[];
}

export const doAsyncSearch = async ({ data, indexPattern, aggs }: IDoAsyncSearch) => {
  if (!indexPattern || !aggs || !aggs.length) return;

  // Constuct the query portion of the search request
  const query = data.query.getOpenSearchQuery(indexPattern);

  // Constuct the aggregations portion of the search request by using the `data.search.aggs` service.
  // const aggs = [{ type: 'avg', params: { field: field.name } }];
  // const aggs = [
  //   { type: 'terms', params: { field: 'day_of_week' } },
  //   { type: 'avg', params: { field: field.name } },
  //   { type: 'terms', params: { field: 'customer_gender' } },
  // ];
  const aggConfigs = data.search.aggs.createAggConfigs(indexPattern, aggs);
  const aggsDsl = aggConfigs.toDsl();

  const request = {
    params: {
      index: indexPattern.title,
      body: {
        aggs: aggsDsl,
        query,
      },
    },
  };

  // Submit the search request using the `data.search` service.
  const { rawResponse } = await data.search.search(request).toPromise();

  return {
    rawResponse,
    aggConfigs,
  };
};
