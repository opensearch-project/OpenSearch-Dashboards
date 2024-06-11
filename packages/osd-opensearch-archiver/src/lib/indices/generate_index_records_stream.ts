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
import { Client } from '@opensearch-project/opensearch';
import { Stats } from '../stats';

export function createGenerateIndexRecordsStream(client: Client, stats: Stats) {
  return new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    async transform(indexOrAlias, enc, callback) {
      try {
        const resp = (await client.indices.get({
          index: indexOrAlias,
          filter_path: [
            '*.settings',
            '*.mappings',
            // remove settings that aren't really settings
            '-*.settings.index.creation_date',
            '-*.settings.index.uuid',
            '-*.settings.index.version',
            '-*.settings.index.provided_name',
            '-*.settings.index.frozen',
            '-*.settings.index.search.throttled',
            '-*.settings.index.query',
            '-*.settings.index.routing',
          ],
        })) as Record<string, any>;

        for (const [index, { settings, mappings }] of Object.entries(resp)) {
          const { body, statusCode } = await client.indices.getAlias({ index });
          const {
            [index]: { aliases },
          } = statusCode === 404 ? {} : body;

          stats.archivedIndex(index, { settings, mappings });
          this.push({
            type: 'index',
            value: {
              // always rewrite the .kibana_* index to .kibana_1 so that
              // when it is loaded it can skip migration, if possible
              index: index.startsWith('.kibana') ? '.kibana_1' : index,
              settings,
              mappings,
              aliases,
            },
          });
        }

        callback();
      } catch (err) {
        callback(err);
      }
    },
  });
}
