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

import {
  ISearchSource,
  OpenSearchQuerySortValue,
  IndexPattern,
} from '../../../../../../../data/public';
import { OpenSearchHitRecord } from './context';

export async function fetchAnchor(
  anchorId: string,
  indexPattern: IndexPattern,
  searchSource: ISearchSource,
  sort: OpenSearchQuerySortValue[]
): Promise<OpenSearchHitRecord> {
  updateSearchSource(searchSource, anchorId, sort, indexPattern);

  const response = await searchSource.fetch();
  const doc = response.hits?.hits?.[0];

  if (!doc) {
    throw new Error(
      i18n.translate('discover.context.failedToLoadAnchorDocumentErrorDescription', {
        defaultMessage: 'Failed to load anchor document.',
      })
    );
  }

  return {
    ...doc,
    isAnchor: true,
  } as OpenSearchHitRecord;
}

export function updateSearchSource(
  searchSource: ISearchSource,
  anchorId: string,
  sort: OpenSearchQuerySortValue[],
  indexPattern: IndexPattern
) {
  searchSource
    .setParent(undefined)
    .setField('index', indexPattern)
    .setField('version', true)
    .setField('size', 1)
    .setField('query', {
      query: {
        constant_score: {
          filter: {
            ids: {
              values: [anchorId],
            },
          },
        },
      },
      language: 'lucene',
    })
    .setField('sort', sort);

  return searchSource;
}
