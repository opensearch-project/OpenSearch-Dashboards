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

import { sortBy } from 'lodash';
import { HttpStart } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { map, scan } from 'rxjs/operators';
import { IndexPatternCreationConfig } from '../../../../../index_pattern_management/public';
import { MatchedItem, ResolveIndexResponse, ResolveIndexResponseItemIndexAttrs } from '../types';
import {
  DataPublicPluginStart,
  IOpenSearchSearchRequest,
  IOpenSearchSearchResponse,
} from '../../../../../data/public';
import { MAX_SEARCH_SIZE } from '../constants';

const aliasLabel = i18n.translate('indexPatternManagement.aliasLabel', { defaultMessage: 'Alias' });
const dataStreamLabel = i18n.translate('indexPatternManagement.dataStreamLabel', {
  defaultMessage: 'Data stream',
});

const indexLabel = i18n.translate('indexPatternManagement.indexLabel', {
  defaultMessage: 'Index',
});

const frozenLabel = i18n.translate('indexPatternManagement.frozenLabel', {
  defaultMessage: 'Frozen',
});

export const searchResponseToArray = (
  getIndexTags: IndexPatternCreationConfig['getIndexTags'],
  showAllIndices: boolean
) => (response: IOpenSearchSearchResponse<any>) => {
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
          tags: getIndexTags(indexName),
          item: {},
        };
      });
  }
};

export const getIndicesViaSearch = async ({
  getIndexTags,
  pattern,
  searchClient,
  showAllIndices,
  dataSourceId,
}: {
  getIndexTags: IndexPatternCreationConfig['getIndexTags'];
  pattern: string;
  searchClient: DataPublicPluginStart['search']['search'];
  showAllIndices: boolean;
  dataSourceId?: string;
}): Promise<MatchedItem[]> =>
  searchClient(buildSearchRequest(showAllIndices, pattern, dataSourceId))
    .pipe(map(searchResponseToArray(getIndexTags, showAllIndices)))
    .pipe(scan((accumulator = [], value) => accumulator.join(value)))
    .toPromise()
    .catch(() => []);

export const getIndicesViaResolve = async ({
  http,
  getIndexTags,
  pattern,
  showAllIndices,
  dataSourceId,
}: {
  http: HttpStart;
  getIndexTags: IndexPatternCreationConfig['getIndexTags'];
  pattern: string;
  showAllIndices: boolean;
  dataSourceId?: string;
}) => {
  const query = buildQuery(showAllIndices, dataSourceId);

  return http
    .get<ResolveIndexResponse>(`/internal/index-pattern-management/resolve_index/${pattern}`, {
      query,
    })
    .then((response) => {
      if (!response) {
        return [];
      } else {
        return responseToItemArray(response, getIndexTags);
      }
    });
};

/**
 * Takes two MatchedItem[]s and returns a merged set, with the second set prrioritized over the first based on name
 *
 * @param matchedA
 * @param matchedB
 */

export const dedupeMatchedItems = (matchedA: MatchedItem[], matchedB: MatchedItem[]) => {
  const mergedMatchedItems = matchedA.reduce((col, item) => {
    col[item.name] = item;
    return col;
  }, {} as Record<string, MatchedItem>);

  matchedB.reduce((col, item) => {
    col[item.name] = item;
    return col;
  }, mergedMatchedItems);

  return Object.values(mergedMatchedItems).sort((a, b) => {
    if (a.name > b.name) return 1;
    if (b.name > a.name) return -1;

    return 0;
  });
};

export async function getIndices({
  http,
  getIndexTags = () => [],
  pattern: rawPattern,
  showAllIndices = false,
  searchClient,
  dataSourceId,
}: {
  http: HttpStart;
  getIndexTags?: IndexPatternCreationConfig['getIndexTags'];
  pattern: string;
  showAllIndices?: boolean;
  searchClient: DataPublicPluginStart['search']['search'];
  dataSourceId?: string;
}): Promise<MatchedItem[]> {
  const pattern = rawPattern.trim();
  const isCCS = pattern.indexOf(':') !== -1;
  const requests: Array<Promise<MatchedItem[]>> = [];

  // Searching for `*:` fails for CCS environments. The search request
  // is worthless anyways as the we should only send a request
  // for a specific query (where we do not append *) if there is at
  // least a single character being searched for.
  if (pattern === '*:') {
    return [];
  }

  // This should never match anything so do not bother
  if (pattern === '') {
    return [];
  }

  // OPENSEARCH does not like just a `,*` and will throw a `[string_index_out_of_bounds_exception] String index out of range: 0`
  if (pattern.startsWith(',')) {
    return [];
  }

  const promiseResolve = getIndicesViaResolve({
    http,
    getIndexTags,
    pattern,
    showAllIndices,
    dataSourceId,
  }).catch((error) => {
    // swallow the errors to be backwards compatible with non-data-source use case
    if (dataSourceId) {
      throw error;
    } else {
      return [];
    }
  });
  requests.push(promiseResolve);

  if (isCCS) {
    // CCS supports ±1 major version. We won't be able to expect resolve endpoint to exist until v9
    const promiseSearch = getIndicesViaSearch({
      getIndexTags,
      pattern,
      searchClient,
      showAllIndices,
      dataSourceId,
    }).catch(() => []);
    requests.push(promiseSearch);
  }

  const responses = await Promise.all(requests);

  if (responses.length === 2) {
    const [resolveResponse, searchResponse] = responses;
    return dedupeMatchedItems(searchResponse, resolveResponse);
  } else {
    return responses[0];
  }
}

export const responseToItemArray = (
  response: ResolveIndexResponse,
  getIndexTags: IndexPatternCreationConfig['getIndexTags']
): MatchedItem[] => {
  const source: MatchedItem[] = [];

  (response.indices || []).forEach((index) => {
    const tags: MatchedItem['tags'] = [{ key: 'index', name: indexLabel, color: 'default' }];
    const isFrozen = (index.attributes || []).includes(ResolveIndexResponseItemIndexAttrs.FROZEN);

    tags.push(...getIndexTags(index.name));
    if (isFrozen) {
      tags.push({ name: frozenLabel, key: 'frozen', color: 'danger' });
    }

    source.push({
      name: index.name,
      tags,
      item: index,
    });
  });
  (response.aliases || []).forEach((alias) => {
    source.push({
      name: alias.name,
      tags: [{ key: 'alias', name: aliasLabel, color: 'default' }],
      item: alias,
    });
  });
  (response.data_streams || []).forEach((dataStream) => {
    source.push({
      name: dataStream.name,
      tags: [{ key: 'data_stream', name: dataStreamLabel, color: 'primary' }],
      item: dataStream,
    });
  });

  return sortBy(source, 'name');
};

const buildQuery = (showAllIndices: boolean, dataSourceId?: string) => {
  const query = {} as any;
  if (showAllIndices) {
    query.expand_wildcards = 'all';
  }
  if (dataSourceId) {
    query.data_source = dataSourceId;
  }

  return query;
};

const buildSearchRequest = (showAllIndices: boolean, pattern: string, dataSourceId?: string) => {
  const request: IOpenSearchSearchRequest = {
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
              size: MAX_SEARCH_SIZE,
            },
          },
        },
      },
    },
  };

  if (dataSourceId) {
    request.dataSourceId = dataSourceId;
  }

  return request;
};
