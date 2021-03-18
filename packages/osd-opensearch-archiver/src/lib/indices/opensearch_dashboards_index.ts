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

import { Client, CreateDocumentParams } from 'elasticsearch';
import { ToolingLog, OsdClient } from '@osd/dev-utils';
import { Stats } from '../stats';
import { deleteIndex } from './delete_index';

/**
 * Deletes all indices that start with `.opensearch_dashboards`
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
    body: { index: { blocks: { read_only: false } } },
  });

  await deleteIndex({
    client,
    stats,
    index: indexNames,
    log,
  });

  return indexNames;
}

/**
 * Given an opensearch client, and a logger, migrates the `.opensearch_dashboards` index. This
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
    index: '.opensearch_dashboards',
    body: {
      dynamic: true,
    },
  } as any);

  await osdClient.savedObjects.migrate();
}

/**
 * Migrations mean that the OpenSearch Dashboards index will look something like:
 * .opensearch_dashboards, .opensearch_dashboards_1, .opensearch_dashboards_323, etc. This finds all indices starting
 * with .opensearch_dashboards, then filters out any that aren't actually OpenSearch Dashboards's core
 * index (e.g. we don't want to remove .opensearch_dashboards_task_manager or the like).
 */
async function fetchOpenSearchDashboardsIndices(client: Client) {
  const opensearchDashboardsIndices = await client.cat.indices({
    index: '.opensearch_dashboards*',
    format: 'json',
  });
  const isOpenSearchDashboardsIndex = (index: string) =>
    /^\.opensearch_dashboards(:?_\d*)?$/.test(index);
  return opensearchDashboardsIndices
    .map((x: { index: string }) => x.index)
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
      index: `.opensearch_dashboards`,
      body: {
        query: {
          bool: {
            must_not: {
              ids: {
                type: '_doc',
                values: ['space:default'],
              },
            },
          },
        },
      },
      ignore: [409],
    });

    if (resp.total !== resp.deleted) {
      log.warning(
        'delete by query deleted %d of %d total documents, trying again',
        resp.deleted,
        resp.total
      );
      continue;
    }

    break;
  }

  log.warning(
    `since spaces are enabled, all objects other than the default space were deleted from ` +
      `.opensearch_dashboards rather than deleting the whole index`
  );

  stats.deletedIndex('.opensearch_dashboards');
}

export async function createDefaultSpace({ index, client }: { index: string; client: Client }) {
  await client.create({
    index,
    type: '_doc',
    id: 'space:default',
    ignore: 409,
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
  } as CreateDocumentParams);
}
