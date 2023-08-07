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
import { ToolingLog } from '@osd/dev-utils';

import { Stats } from '../stats';
import { deleteIndex } from './delete_index';
import { cleanOpenSearchDashboardsIndices } from './opensearch_dashboards_index';

export function createDeleteIndexStream(
  client: Client,
  stats: Stats,
  log: ToolingLog,
  opensearchDashboardsPluginIds: string[]
) {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    async transform(record, enc, callback) {
      try {
        if (!record || record.type === 'index') {
          const { index } = record.value;

          if (index.startsWith('.kibana')) {
            await cleanOpenSearchDashboardsIndices({
              client,
              stats,
              log,
              opensearchDashboardsPluginIds,
            });
          } else {
            await deleteIndex({ client, stats, log, index });
          }
        } else {
          this.push(record);
        }
        callback();
      } catch (err) {
        callback(err);
      }
    },
  });
}
