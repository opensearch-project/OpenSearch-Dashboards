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

import { Transform } from 'stream';
import { Client, ApiResponse } from '@opensearch-project/opensearch';
import { Stats } from '../stats';
import { Progress } from '../progress';

const SCROLL_SIZE = 1000;
const SCROLL_TIMEOUT = '1m';

export function createGenerateDocRecordsStream({
  client,
  stats,
  progress,
  query,
}: {
  client: Client;
  stats: Stats;
  progress: Progress;
  query?: Record<string, any>;
}) {
  return new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    async transform(index, enc, callback) {
      try {
        let remainingHits = 0;
        let resp: ApiResponse<any> | null = null;

        while (!resp || remainingHits > 0) {
          if (!resp) {
            resp = await client.search({
              index,
              scroll: SCROLL_TIMEOUT,
              size: SCROLL_SIZE,
              _source: true,
              body: {
                query,
              },
              rest_total_hits_as_int: true, // not declared on SearchParams type
            });
            remainingHits = resp.body.hits.total;
            progress.addToTotal(remainingHits);
          } else {
            resp = await client.scroll({
              scroll_id: resp.body._scroll_id!,
              scroll: SCROLL_TIMEOUT,
            });
          }

          for (const hit of resp.body?.hits.hits) {
            remainingHits -= 1;
            stats.archivedDoc(hit._index);
            this.push({
              type: 'doc',
              value: {
                // always rewrite the .kibana_* index to .kibana_1 so that
                // when it is loaded it can skip migration, if possible
                index: hit._index.startsWith('.kibana') ? '.kibana_1' : hit._index,
                // TODO: verify no BWC issues here
                // Removed: https://github.com/opensearch-project/OpenSearch/pull/2239
                // type: hit._type,
                id: hit._id,
                source: hit._source,
              },
            });
          }

          progress.addToComplete(resp.body.hits.hits.length);
        }

        callback(undefined);
      } catch (err) {
        callback(err);
      }
    },
  });
}
