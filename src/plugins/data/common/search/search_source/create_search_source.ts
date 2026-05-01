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

import { migrateLegacyQuery } from './migrate_legacy_query';
import { SearchSource, SearchSourceDependencies } from './search_source';
import { IndexPatternsContract } from '../../index_patterns/index_patterns';
import { SearchSourceFields } from './types';
import { DEFAULT_DATA } from '../../constants';

/**
 * Deserializes a json string and a set of referenced objects to a `SearchSource` instance.
 * Use this method to re-create the search source serialized using `searchSource.serialize`.
 *
 * This function is a factory function that returns the actual utility when calling it with the
 * required service dependency (index patterns contract). A pre-wired version is also exposed in
 * the start contract of the data plugin as part of the search service
 *
 * @param indexPatterns The index patterns contract of the data plugin
 * @param searchSourceDependencies
 *
 * @return Wired utility function taking two parameters `searchSourceJson`, the json string
 * returned by `serializeSearchSource` and `references`, a list of references including the ones
 * returned by `serializeSearchSource`.
 *
 *
 * @public */
export const createSearchSource = (
  indexPatterns: IndexPatternsContract,
  searchSourceDependencies: SearchSourceDependencies
) => async (searchSourceFields: SearchSourceFields = {}) => {
  const fields = { ...searchSourceFields };

  // hydrating index pattern
  if (fields.index && typeof fields.index === 'string') {
    const dataset = fields.query?.dataset;
    const isIndexPattern = !dataset?.type || dataset.type === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;

    if (isIndexPattern) {
      // Legacy/INDEX_PATTERN path: let SavedObjectNotFound propagate so callers
      // like `applyOpenSearchResp` can record `unresolvedIndexPatternReference`
      // and drive the import-conflict UI.
      fields.index = await indexPatterns.get(fields.index as string);
    } else {
      // Non-INDEX_PATTERN datasets (INDEXES, S3, Prometheus, etc.) have no
      // backing saved object; the authoritative id for cache lookup is
      // `dataset.id`, which is what `datasetService.cacheDataset` uses as the
      // cache key.
      const lookupId = (dataset?.id ?? fields.index) as string;
      let pattern;
      try {
        pattern = await indexPatterns.get(lookupId, true);
      } catch (e) {
        // swallow — fall through to hydrateDataset
      }

      // On a cache miss (or lookup failure), ask the public layer to prime the
      // dataset cache via `hydrateDataset`, then retry the cache-only lookup.
      // Centralized here so Discover, Explore embeddables, and any other
      // consumer of `searchSource.create()` all benefit.
      if (!pattern && dataset && searchSourceDependencies.hydrateDataset) {
        try {
          await searchSourceDependencies.hydrateDataset(dataset);
          pattern = await indexPatterns.get(lookupId, true);
        } catch (e) {
          // leave fields.index as a string; downstream consumers must guard for this.
        }
      }

      if (pattern) {
        fields.index = pattern;
      }
    }
  }

  const searchSource = new SearchSource(fields, searchSourceDependencies);

  // todo: move to migration script .. create issue
  const query = searchSource.getOwnField('query');

  if (typeof query !== 'undefined') {
    searchSource.setField('query', migrateLegacyQuery(query));
  }

  return searchSource;
};
