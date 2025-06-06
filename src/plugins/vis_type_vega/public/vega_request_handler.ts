/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Filter, opensearchQuery, TimeRange, Query } from '../../data/public';

import { SearchAPI } from './data_model/search_api';
import { TimeCache } from './data_model/time_cache';

import { VegaVisualizationDependencies } from './plugin';
import { VisParams } from './expressions/vega_fn';
import {
  getData,
  getDataSourceEnabled,
  getInjectedMetadata,
  getSavedObjectsClient,
} from './services';
import { VegaInspectorAdapters } from './vega_inspector';

interface VegaRequestHandlerParams {
  query: Query;
  filters: Filter;
  timeRange: TimeRange;
  visParams: VisParams;
}

interface VegaRequestHandlerContext {
  abortSignal?: AbortSignal;
  inspectorAdapters?: VegaInspectorAdapters;
}

export function createVegaRequestHandler(
  { plugins: { data }, core: { uiSettings }, getServiceSettings }: VegaVisualizationDependencies,
  context: VegaRequestHandlerContext = {}
) {
  let searchAPI: SearchAPI;
  const { timefilter } = data.query.timefilter;
  const timeCache = new TimeCache(timefilter, 3 * 1000);

  return async function vegaRequestHandler({
    timeRange,
    filters,
    query,
    visParams,
  }: VegaRequestHandlerParams) {
    if (!searchAPI) {
      searchAPI = new SearchAPI(
        {
          uiSettings,
          search: getData().search,
          injectedMetadata: getInjectedMetadata(),
          dataSourceEnabled: getDataSourceEnabled().enabled,
          savedObjectsClient: getSavedObjectsClient().client,
        },
        context.abortSignal,
        context.inspectorAdapters
      );
    }

    timeCache.setTimeRange(timeRange);

    const opensearchQueryConfigs = opensearchQuery.getOpenSearchQueryConfig(uiSettings);
    const filtersDsl = opensearchQuery.buildOpenSearchQuery(
      undefined,
      query,
      filters,
      opensearchQueryConfigs
    );

    // Import the module directly to avoid circular dependency issues
    const VegaParserModule = await import('./data_model/vega_parser');
    const vp = new VegaParserModule.VegaParser(
      visParams.spec,
      searchAPI,
      timeCache,
      filtersDsl,
      getServiceSettings
    );

    return await vp.parseAsync();
  };
}
