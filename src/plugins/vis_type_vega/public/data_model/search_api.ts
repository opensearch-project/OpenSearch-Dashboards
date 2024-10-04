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

import { i18n } from '@osd/i18n';
import { combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CoreStart, IUiSettingsClient } from 'opensearch-dashboards/public';
import { SavedObjectsClientContract } from 'src/core/public';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import {
  getSearchParamsFromRequest,
  SearchRequest,
  DataPublicPluginStart,
  IOpenSearchSearchResponse,
  IOpenSearchSearchRequest,
} from '../../../data/public';
import { search as dataPluginSearch } from '../../../data/public';
import { VegaInspectorAdapters } from '../vega_inspector';
import { RequestResponder, RequestStatistics } from '../../../inspector/public';

interface RawPPLStrategySearchResponse {
  rawResponse: {
    datarows: any[];
    jsonData: any[];
    schema: any[];
    size: number;
    total: number;
  };
}

export interface SearchAPIDependencies {
  uiSettings: IUiSettingsClient;
  injectedMetadata: CoreStart['injectedMetadata'];
  search: DataPublicPluginStart['search'];
  dataSourceEnabled: boolean;
  savedObjectsClient: SavedObjectsClientContract;
}

export class SearchAPI {
  constructor(
    private readonly dependencies: SearchAPIDependencies,
    private readonly abortSignal?: AbortSignal,
    public readonly inspectorAdapters?: VegaInspectorAdapters
  ) {}

  async search(searchRequests: SearchRequest[], options?: { strategy?: string }) {
    const { search } = this.dependencies.search;
    const requestResponders: any = {};

    return combineLatest(
      await Promise.all(
        searchRequests.map(async (request) => {
          const requestId = request.name;
          const dataSourceId = !!request.data_source_name
            ? await this.findDataSourceIdbyName(request.data_source_name)
            : undefined;

          const params = getSearchParamsFromRequest(request, {
            getConfig: this.dependencies.uiSettings.get.bind(this.dependencies.uiSettings),
          });

          if (this.inspectorAdapters) {
            requestResponders[requestId] = this.inspectorAdapters.requests.start(
              requestId,
              request
            );
            requestResponders[requestId].json(params.body);
          }

          const searchApiParams =
            dataSourceId && this.dependencies.dataSourceEnabled
              ? { params, dataSourceId }
              : { params };

          return search<
            IOpenSearchSearchRequest,
            IOpenSearchSearchResponse | RawPPLStrategySearchResponse
          >(searchApiParams, {
            abortSignal: this.abortSignal,
            strategy: options?.strategy,
          }).pipe(
            tap((data) => this.inspectSearchResult(data, requestResponders[requestId])),
            map((data) => ({
              name: requestId,
              rawResponse: data.rawResponse,
            }))
          );
        })
      )
    );
  }

  async findDataSourceIdbyName(dataSourceName: string) {
    if (!this.dependencies.dataSourceEnabled) {
      throw new Error('data_source_name cannot be used because data_source.enabled is false');
    }
    const dataSources = await this.dataSourceFindQuery(dataSourceName);

    // In the case that data_source_name is a prefix of another name, match exact data_source_name
    const possibleDataSourceIds = dataSources.savedObjects.filter(
      (obj) => obj.attributes.title === dataSourceName
    );

    if (possibleDataSourceIds.length !== 1) {
      throw new Error(
        `Expected exactly 1 result for data_source_name "${dataSourceName}" but got ${possibleDataSourceIds.length} results`
      );
    }

    return possibleDataSourceIds.pop()?.id;
  }

  async dataSourceFindQuery(dataSourceName: string) {
    return await this.dependencies.savedObjectsClient.find<DataSourceAttributes>({
      type: 'data-source',
      perPage: 10,
      search: `"${dataSourceName}"`,
      searchFields: ['title'],
      fields: ['id', 'title'],
    });
  }

  public resetSearchStats() {
    if (this.inspectorAdapters) {
      this.inspectorAdapters.requests.reset();
    }
  }

  private getPPLRawResponseInspectorStats(response: RawPPLStrategySearchResponse['rawResponse']) {
    const stats: RequestStatistics = {};
    stats.hitsTotal = {
      label: i18n.translate('visTypeVega.search.searchSource.hitsTotalLabel', {
        defaultMessage: 'Hits (total)',
      }),
      value: `${response.total}`,
      description: i18n.translate('visTypeVega.search.searchSource.hitsTotalDescription', {
        defaultMessage: 'The number of documents that match the query.',
      }),
    };

    stats.hits = {
      label: i18n.translate('visTypeVega.search.searchSource.hitsLabel', {
        defaultMessage: 'Hits',
      }),
      value: `${response.size}`,
      description: i18n.translate('visTypeVega.search.searchSource.hitsDescription', {
        defaultMessage: 'The number of documents returned by the query.',
      }),
    };
    return stats;
  }

  private inspectSearchResult(
    response: IOpenSearchSearchResponse | RawPPLStrategySearchResponse,
    requestResponder: RequestResponder
  ) {
    if (requestResponder) {
      // inspect ppl response
      if ('jsonData' in response.rawResponse) {
        requestResponder
          .stats(this.getPPLRawResponseInspectorStats(response.rawResponse))
          .ok({ json: response.rawResponse });
      } else {
        requestResponder
          .stats(dataPluginSearch.getResponseInspectorStats(response.rawResponse))
          .ok({ json: response.rawResponse });
      }
    }
  }
}
