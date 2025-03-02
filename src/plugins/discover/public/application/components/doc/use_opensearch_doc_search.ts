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

import { useEffect, useState } from 'react';
import { IndexPattern, getServices } from '../../../opensearch_dashboards_services';
import { DocProps } from './doc';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';

export enum OpenSearchRequestState {
  Loading,
  NotFound,
  Found,
  Error,
  NotFoundIndexPattern,
}

/**
 * helper function to build a query body for OpenSearch
 * https://opensearch.org/docs/latest/opensearch/query-dsl/index/
 */
export function buildSearchBody(id: string, indexPattern: IndexPattern): Record<string, any> {
  const computedFields = indexPattern.getComputedFields();

  return {
    query: {
      ids: {
        values: [id],
      },
    },
    stored_fields: computedFields.storedFields,
    _source: true,
    script_fields: computedFields.scriptFields,
    docvalue_fields: computedFields.docvalueFields,
  };
}

/**
 * Custom react hook for querying a single doc in OpenSearch
 */
export function useOpenSearchDocSearch({
  id,
  index,
  indexPatternId,
  indexPatternService,
}: DocProps): [OpenSearchRequestState, OpenSearchSearchHit | null, IndexPattern | null] {
  const [indexPattern, setIndexPattern] = useState<IndexPattern | null>(null);
  const [status, setStatus] = useState(OpenSearchRequestState.Loading);
  const [hit, setHit] = useState<OpenSearchSearchHit | null>(null);

  useEffect(() => {
    async function requestData() {
      try {
        const withLongNumeralsSupport = await indexPatternService.isLongNumeralsSupported();
        const indexPatternEntity = await indexPatternService.get(indexPatternId);
        setIndexPattern(indexPatternEntity);

        const { rawResponse } = await getServices()
          .data.search.search(
            {
              dataSourceId: indexPatternEntity.dataSourceRef?.id,
              params: {
                index,
                body: buildSearchBody(id, indexPatternEntity),
              },
            },
            {
              withLongNumeralsSupport,
            }
          )
          .toPromise();

        const hits = rawResponse.hits;

        if (hits?.hits?.[0]) {
          setStatus(OpenSearchRequestState.Found);
          setHit(hits.hits[0]);
        } else {
          setStatus(OpenSearchRequestState.NotFound);
        }
      } catch (err) {
        if (err.savedObjectId) {
          setStatus(OpenSearchRequestState.NotFoundIndexPattern);
        } else if (err.status === 404) {
          setStatus(OpenSearchRequestState.NotFound);
        } else {
          setStatus(OpenSearchRequestState.Error);
        }
      }
    }
    requestData();
  }, [id, index, indexPatternId, indexPatternService]);
  return [status, hit, indexPattern];
}
