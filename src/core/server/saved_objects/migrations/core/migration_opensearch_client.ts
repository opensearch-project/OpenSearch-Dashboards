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
import type { TransportRequestOptions } from '@opensearch-project/opensearch/lib/Transport';
import { get } from 'lodash';
import { set } from '@elastic/safer-lodash-set';

import { OpenSearchClient } from '../../../opensearch';
import { migrationRetryCallCluster } from '../../../opensearch/client/retry_call_cluster';
import { Logger } from '../../../logging';

const methods = [
  'bulk',
  'cat.templates',
  'clearScroll',
  'count',
  'indices.create',
  'indices.delete',
  'indices.deleteTemplate',
  'indices.get',
  'indices.getAlias',
  'indices.refresh',
  'indices.updateAliases',
  'reindex',
  'search',
  'scroll',
  'tasks.get',
] as const;

type MethodName = typeof methods[number];

export interface MigrationOpenSearchClient {
  bulk: OpenSearchClient['bulk'];
  cat: {
    templates: OpenSearchClient['cat']['templates'];
  };
  clearScroll: OpenSearchClient['clearScroll'];
  count: OpenSearchClient['count'];
  indices: {
    create: OpenSearchClient['indices']['create'];
    delete: OpenSearchClient['indices']['delete'];
    deleteTemplate: OpenSearchClient['indices']['deleteTemplate'];
    get: OpenSearchClient['indices']['get'];
    getAlias: OpenSearchClient['indices']['getAlias'];
    refresh: OpenSearchClient['indices']['refresh'];
    updateAliases: OpenSearchClient['indices']['updateAliases'];
  };
  reindex: OpenSearchClient['reindex'];
  search: OpenSearchClient['search'];
  scroll: OpenSearchClient['scroll'];
  tasks: {
    get: OpenSearchClient['tasks']['get'];
  };
}

export function createMigrationOpenSearchClient(
  client: OpenSearchClient,
  log: Logger,
  delay?: number
): MigrationOpenSearchClient {
  return methods.reduce((acc: MigrationOpenSearchClient, key: MethodName) => {
    set(acc, key, async (params?: unknown, options?: TransportRequestOptions) => {
      const fn = get(client, key);
      if (!fn) {
        throw new Error(`unknown OpenSearchClient client method [${key}]`);
      }
      return await migrationRetryCallCluster(
        () => fn.call(client, params, { maxRetries: 0, ...options }),
        log,
        delay
      );
    });
    return acc;
  }, {} as MigrationOpenSearchClient);
}
