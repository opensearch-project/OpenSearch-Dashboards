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

import { Client } from '@opensearch-project/opensearch';
import { ToolingLog, OsdClient } from '@osd/dev-utils';
import { Stats } from '../stats';
import { deleteIndex } from './delete_index';

/**
 * Deletes all indices that start with `.kibana`
 */
export async function deleteOpenSearchDashboardsIndices({
  client,
  stats,
  log,
}: {
  client: Client;
  stats: Stats;
  log: ToolingLog;
}) {
  const indexNames = await fetchOpenSearchDashboardsIndices(client);
  if (!indexNames.length) {
    return;
  }

  await client.indices.putSettings({
    index: indexNames,
    body: { blocks: { read_only: false } },
  });

  for (const indexName of indexNames) {
    await deleteIndex({
      client,
      stats,
      index: indexName,
      log,
    });
  }

  return indexNames;
}

/**
 * Given an opensearch client, and a logger, migrates the `.kibana` index. This
 * builds up an object that implements just enough of the osdMigrations interface
 * as is required by migrations.
 */
export async function migrateOpenSearchDashboardsIndex({
  client,
  osdClient,
}: {
  client: Client;
  osdClient: OsdClient;
}) {
  // we allow dynamic mappings on the index, as some interceptors are accessing documents before
  // the migration is actually performed. The migrator will put the value back to `strict` after migration.
  await client.indices.putMapping({
    index: '.kibana',
    body: {
      dynamic: true,
    },
  } as any);

  await osdClient.savedObjects.migrate();
}

/**
 * Migrations mean that the OpenSearch Dashboards index will look something like:
 * .kibana, .kibana_1, .kibana_323, etc. This finds all indices starting
 * with .kibana then filters out any that aren't actually OpenSearch Dashboards's core
 * index (e.g. we don't want to remove .opensearch_dashboards_task_manager or the like).
 */
async function fetchOpenSearchDashboardsIndices(client: Client) {
  const opensearchDashboardsIndices = await client.cat.indices({
    index: '.kibana*',
    format: 'json',
  });
  const isOpenSearchDashboardsIndex = (index: string) => /^\.kibana(:?_\d*)?$/.test(index);
  return opensearchDashboardsIndices.body
    .map((x) => x.index?.toString() ?? '')
    .filter(isOpenSearchDashboardsIndex);
}

export async function cleanOpenSearchDashboardsIndices({
  client,
  stats,
  log,
  opensearchDashboardsPluginIds,
}: {
  client: Client;
  stats: Stats;
  log: ToolingLog;
  opensearchDashboardsPluginIds: string[];
}) {
  if (!opensearchDashboardsPluginIds.includes('spaces')) {
    return await deleteOpenSearchDashboardsIndices({
      client,
      stats,
      log,
    });
  }

  while (true) {
    const resp = await client.deleteByQuery({
      index: `.kibana`,
      body: {
        query: {
          bool: {
            must_not: {
              ids: {
                values: ['space:default'],
              },
            },
          },
        },
      },
    });

    if (resp.body.total !== resp.body.deleted) {
      log.warning(
        'delete by query deleted %d of %d total documents, trying again',
        resp.body.deleted,
        resp.body.total
      );
      continue;
    }

    break;
  }

  log.warning(
    `since spaces are enabled, all objects other than the default space were deleted from ` +
      `.kibana rather than deleting the whole index`
  );

  stats.deletedIndex('.kibana');
}

export async function createDefaultSpace({ index, client }: { index: string; client: Client }) {
  await client.create({
    index,
    id: 'space:default',
    body: {
      type: 'space',
      updated_at: new Date().toISOString(),
      space: {
        name: 'Default Space',
        description: 'This is the default space',
        disabledFeatures: [],
        _reserved: true,
      },
    },
  });
}
