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

/*
 * This module contains various functions for querying and manipulating
 * opensearch indices.
 */

import _ from 'lodash';
import { opensearchtypes } from '@opensearch-project/opensearch';
import { MigrationOpenSearchClient } from './migration_opensearch_client';
import { CountResponse } from '../../../opensearch';
import { IndexMapping } from '../../mappings';
import { SavedObjectsMigrationVersion } from '../../types';
import { AliasAction, RawDoc } from './call_cluster';
import { SavedObjectsRawDocSource } from '../../serialization';
import { MigrationRetryConfig } from './migration_reconciliation';

const settings = { number_of_shards: 1, auto_expand_replicas: '0-1' };

/**
 * Default retry config applied to `write` calls when no config is passed.
 * Matches the `savedObjectsMigrationConfig.retry` schema defaults.
 */
const DEFAULT_RETRY_CONFIG: MigrationRetryConfig = {
  enabled: true,
  maxRetries: 5,
  initialBackoffMs: 1000,
  maxBackoffMs: 30000,
  clusterEventTimeoutMs: 120000,
};

export interface FullIndexInfo {
  aliases: { [name: string]: object };
  exists: boolean;
  indexName: string;
  mappings: IndexMapping;
}

/**
 * A slight enhancement to indices.get, that adds indexName, and validates that the
 * index mappings are somewhat what we expect.
 */
export async function fetchInfo(
  client: MigrationOpenSearchClient,
  index: string
): Promise<FullIndexInfo> {
  const { body, statusCode } = await client.indices.get({ index }, { ignore: [404] });

  if (statusCode === 404) {
    return {
      aliases: {},
      exists: false,
      indexName: index,
      mappings: { dynamic: 'strict', properties: {} },
    };
  }

  const [indexName, indexInfo] = Object.entries(body)[0];

  // @ts-expect-error @opensearch-project/opensearch IndexState.alias and IndexState.mappings should be required
  return assertIsSupportedIndex({ ...indexInfo, exists: true, indexName });
}

/**
 * Creates a reader function that serves up batches of documents from the index. We aren't using
 * an async generator, as that feature currently breaks OpenSearchDashboards's tooling.
 *
 * @param {CallCluster} callCluster - The elastic search connection
 * @param {string} - The index to be read from
 * @param {opts}
 * @prop {number} batchSize - The number of documents to read at a time
 * @prop {string} scrollDuration - The scroll duration used for scrolling through the index
 */
export function reader(
  client: MigrationOpenSearchClient,
  index: string,
  { batchSize = 10, scrollDuration = '15m' }: { batchSize: number; scrollDuration: string }
) {
  const scroll = scrollDuration;
  let scrollId: string | undefined;

  const nextBatch = () =>
    scrollId !== undefined
      ? client.scroll<SavedObjectsRawDocSource>({
          scroll,
          scroll_id: scrollId,
        })
      : client.search<SavedObjectsRawDocSource>({
          body: { size: batchSize },
          index,
          scroll,
        });

  const close = async () => scrollId && (await client.clearScroll({ scroll_id: scrollId }));

  return async function read() {
    const result = await nextBatch();
    assertResponseIncludeAllShards(result.body);

    scrollId = result.body._scroll_id;
    const docs = result.body.hits.hits;
    if (!docs.length) {
      await close();
    }

    return docs;
  };
}

/**
 * Writes the specified documents to the index. Retries transient bulk-item
 * errors (503 / 429 / process_cluster_event_timeout_exception /
 * cluster_block_exception / "failed to process cluster event" reasons) with
 * bounded exponential backoff before throwing. Non-retriable errors throw
 * immediately.
 *
 * A single transient 503 from OS on `put-mapping` used to crash the entire
 * migration. With retries, the same condition now auto-recovers after a
 * brief wait.
 *
 * @param {CallCluster} callCluster
 * @param {string} index
 * @param {RawDoc[]} docs
 * @param {MigrationRetryConfig} retryConfig - optional; defaults to the
 *   schema defaults. Pass `{ enabled: false, ... }` to force legacy
 *   single-shot behavior for callers that have their own retry layer.
 */
export async function write(
  client: MigrationOpenSearchClient,
  index: string,
  docs: RawDoc[],
  retryConfig: MigrationRetryConfig = DEFAULT_RETRY_CONFIG
) {
  let attempt = 0;
  let remainingDocs = docs;
  const retryHistory: Array<{ attempt: number; reason: string; type?: string }> = [];

  while (true) {
    const body = buildBulkBody(index, remainingDocs);
    const { body: resp } = await client.bulk({ body });

    const items = (resp?.items ?? []) as Array<{
      index?: {
        _id?: string;
        status?: number;
        error?: { type?: string; reason?: string };
      };
    }>;

    // Bucket items by (ok | retriable-error | fatal-error). The response's
    // items[] is in the same order as the request's docs[] entries, so the
    // index in items[] maps directly to remainingDocs[i].
    const retriable: RawDoc[] = [];
    let firstFatal: { _id?: string; error?: { type?: string; reason?: string } } | null = null;
    let firstRetriable: { type?: string; reason?: string } | null = null;
    for (let i = 0; i < items.length; i++) {
      const op = items[i].index;
      if (!op || !op.error) continue; // succeeded
      if (isRetriableBulkItemError(op)) {
        retriable.push(remainingDocs[i]);
        if (!firstRetriable) firstRetriable = op.error;
      } else if (!firstFatal) {
        firstFatal = { _id: op._id, error: op.error };
      }
    }

    if (firstFatal) {
      const reason = firstFatal.error?.reason ?? 'unknown bulk error';

      const exception: any = new Error(reason);
      exception.detail = { index: { _id: firstFatal._id, error: firstFatal.error } };
      throw exception;
    }

    if (retriable.length === 0) {
      return;
    }

    if (!retryConfig.enabled || attempt >= retryConfig.maxRetries) {
      retryHistory.push({
        attempt: attempt + 1,
        reason: firstRetriable?.reason ?? 'transient error',
        type: firstRetriable?.type,
      });

      const exception: any = new Error(
        `Bulk write to ${index} failed after ${retryHistory.length} attempt(s); ` +
          `last error: ${firstRetriable?.reason ?? 'transient error'}. ` +
          `Retry history: ${JSON.stringify(retryHistory)}`
      );
      exception.detail = { index: { error: firstRetriable } };
      exception.retryHistory = retryHistory;
      throw exception;
    }

    attempt++;
    retryHistory.push({
      attempt,
      reason: firstRetriable?.reason ?? 'transient error',
      type: firstRetriable?.type,
    });
    const backoff = computeBackoff(attempt, retryConfig.initialBackoffMs, retryConfig.maxBackoffMs);
    remainingDocs = retriable;
    await sleep(backoff);
  }
}

function buildBulkBody(index: string, docs: RawDoc[]): object[] {
  return docs.reduce((acc: object[], doc: RawDoc) => {
    acc.push({
      index: {
        _id: doc._id,
        _index: index,
      },
    });
    acc.push(doc._source);
    return acc;
  }, []);
}

/**
 * A bulk-item error is considered retriable if ANY of these match. (Union,
 * not intersection — a 503 alone is enough to retry.)
 */
export function isRetriableBulkItemError(op: {
  status?: number;
  error?: { type?: string; reason?: string };
}): boolean {
  if (!op || !op.error) return false;
  if (op.status === 503) return true;
  if (op.status === 429) return true;
  const type = op.error.type;
  if (type === 'process_cluster_event_timeout_exception') return true;
  if (type === 'cluster_block_exception') return true;
  const reason = op.error.reason ?? '';
  if (/failed to process cluster event/i.test(reason)) return true;
  return false;
}

function computeBackoff(attempt: number, initialMs: number, maxMs: number): number {
  // Full-jitter exponential backoff: sleep = randInt(0, min(maxMs, initialMs * 2^attempt))
  const ceiling = Math.min(maxMs, initialMs * Math.pow(2, attempt));
  return Math.floor(Math.random() * Math.max(1, ceiling));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Checks to see if the specified index is up to date. It does this by checking
 * that the index has the expected mappings and by counting
 * the number of documents that have a property which has migrations defined for it,
 * but which has not had those migrations applied. We don't want to cache the
 * results of this function (e.g. in context or somewhere), as it is important that
 * it performs the check *each* time it is called, rather than memoizing itself,
 * as this is used to determine if migrations are complete.
 *
 * @param {CallCluster} callCluster
 * @param {string} index
 * @param {SavedObjectsMigrationVersion} migrationVersion - The latest versions of the migrations
 */
export async function migrationsUpToDate(
  client: MigrationOpenSearchClient,
  index: string,
  migrationVersion: SavedObjectsMigrationVersion,
  retryCount: number = 10
): Promise<boolean> {
  try {
    const indexInfo = await fetchInfo(client, index);

    if (!indexInfo.mappings.properties?.migrationVersion) {
      return false;
    }

    // If no migrations are actually defined, we're up to date!
    if (Object.keys(migrationVersion).length <= 0) {
      return true;
    }

    const { body } = await client.count<CountResponse>({
      body: {
        query: {
          bool: {
            should: Object.entries(migrationVersion).map(([type, latestVersion]) => ({
              bool: {
                must: [
                  { exists: { field: type } },
                  {
                    bool: {
                      must_not: { term: { [`migrationVersion.${type}`]: latestVersion } },
                    },
                  },
                ],
              },
            })),
          },
        },
      },
      index,
    });

    assertResponseIncludeAllShards(body);

    return body.count === 0;
  } catch (e) {
    // retry for Service Unavailable
    if (e.status !== 503 || retryCount === 0) {
      throw e;
    }

    await new Promise((r) => setTimeout(r, 1000));

    return await migrationsUpToDate(client, index, migrationVersion, retryCount - 1);
  }
}

export async function createIndex(
  client: MigrationOpenSearchClient,
  index: string,
  mappings?: IndexMapping
) {
  await client.indices.create({
    body: { mappings, settings },
    index,
  });
}

export async function deleteIndex(client: MigrationOpenSearchClient, index: string) {
  await client.indices.delete({ index });
}

/**
 * Converts an index to an alias. The `alias` parameter is the desired alias name which currently
 * is a concrete index. This function will reindex `alias` into a new index, delete the `alias`
 * index, and then create an alias `alias` that points to the new index.
 *
 * @param {CallCluster} callCluster - The connection to OpenSearch
 * @param {FullIndexInfo} info - Information about the mappings and name of the new index
 * @param {string} alias - The name of the index being converted to an alias
 */
export async function convertToAlias(
  client: MigrationOpenSearchClient,
  info: FullIndexInfo,
  alias: string,
  batchSize: number,
  script?: string
) {
  await client.indices.create({
    body: { mappings: info.mappings, settings },
    index: info.indexName,
  });

  await reindex(client, alias, info.indexName, batchSize, script);

  await claimAlias(client, info.indexName, alias, [{ remove_index: { index: alias } }]);
}

/**
 * Points the specified alias to the specified index. This is an exclusive
 * alias, meaning that it will only point to one index at a time, so we
 * remove any other indices from the alias.
 *
 * @param {CallCluster} callCluster
 * @param {string} index
 * @param {string} alias
 * @param {AliasAction[]} aliasActions - Optional actions to be added to the updateAliases call
 */
export async function claimAlias(
  client: MigrationOpenSearchClient,
  index: string,
  alias: string,
  aliasActions: AliasAction[] = []
) {
  const { body, statusCode } = await client.indices.getAlias({ name: alias }, { ignore: [404] });
  const aliasInfo = statusCode === 404 ? {} : body;
  const removeActions = Object.keys(aliasInfo).map((key) => ({ remove: { index: key, alias } }));

  await client.indices.updateAliases({
    body: {
      actions: aliasActions.concat(removeActions).concat({ add: { index, alias } }),
    },
  });

  await client.indices.refresh({ index });
}

/**
 * This is a rough check to ensure that the index being migrated satisfies at least
 * some rudimentary expectations. Past OpenSearch Dashboards indices had multiple root documents, etc
 * and the migration system does not (yet?) handle those indices. They need to be upgraded
 * via v5 -> v6 upgrade tools first. This file contains index-agnostic logic, and this
 * check is itself index-agnostic, though the error hint is a bit OpenSearch Dashboards specific.
 *
 * @param {FullIndexInfo} indexInfo
 */
function assertIsSupportedIndex(indexInfo: FullIndexInfo) {
  const mappings = indexInfo.mappings as any;
  const isV7Index = !!mappings.properties;

  if (!isV7Index) {
    throw new Error(
      `Index ${indexInfo.indexName} belongs to a version of OpenSearch Dashboards ` +
        `that cannot be automatically migrated. Reset it.`
    );
  }

  return indexInfo;
}

/**
 * Provides protection against reading/re-indexing against an index with missing
 * shards which could result in data loss. This shouldn't be common, as the Saved
 * Object indices should only ever have a single shard. This is more to handle
 * instances where customers manually expand the shards of an index.
 */
function assertResponseIncludeAllShards({ _shards }: { _shards: opensearchtypes.ShardStatistics }) {
  if (!_.has(_shards, 'total') || !_.has(_shards, 'successful')) {
    return;
  }

  const failed = _shards.total - _shards.successful;

  if (failed > 0) {
    throw new Error(
      `Re-index failed :: ${failed} of ${_shards.total} shards failed. ` +
        `Check OpenSearch cluster health for more information.`
    );
  }
}

/**
 * Reindexes from source to dest, polling for the reindex completion.
 */
async function reindex(
  client: MigrationOpenSearchClient,
  source: string,
  dest: string,
  batchSize: number,
  script?: string
) {
  // We poll instead of having the request wait for completion, as for large indices,
  // the request times out on the OpenSearch side of things. We have a relatively tight
  // polling interval, as the request is fairly efficent, and we don't
  // want to block index migrations for too long on this.
  const pollInterval = 250;
  const { body: reindexBody } = await client.reindex({
    body: {
      dest: { index: dest },
      source: { index: source, size: batchSize },
      script: script
        ? {
            source: script,
            lang: 'painless',
          }
        : undefined,
    },
    refresh: true,
    wait_for_completion: false,
  });

  const task = reindexBody.task;

  let completed = false;

  while (!completed) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const { body } = await client.tasks.get({
      task_id: String(task),
    });

    if (body.error) {
      const e = body.error;
      // If the task-poll error is retriable (transient cluster-state
      // failure), swallow and continue polling rather than fail the
      // reindex outright. The in-flight reindex task is still running on
      // the OS side; we just need a clean view of its status.
      if (isRetriableReindexError(e)) {
        continue;
      }
      throw new Error(`Re-index failed [${e.type}] ${e.reason} :: ${JSON.stringify(e)}`);
    }

    completed = body.completed;
  }
}

function isRetriableReindexError(err: { type?: string; reason?: string } | undefined): boolean {
  if (!err) return false;
  const type = err.type;
  if (type === 'process_cluster_event_timeout_exception') return true;
  if (type === 'cluster_block_exception') return true;
  const reason = err.reason ?? '';
  if (/failed to process cluster event/i.test(reason)) return true;
  return false;
}

/**
 * Returns a Map<type, count> for the given saved-objects index by running a
 * `terms` aggregation on the `type` keyword field.
 *
 * Used by `migration_coordinator.ts::verifyDestIndexIntegrity` for the
 * per-type count check when a legacy destination has no sentinel doc.
 */
export async function countByType(
  client: MigrationOpenSearchClient,
  index: string
): Promise<Map<string, number>> {
  const { body, statusCode } = await (client as any).search(
    {
      index,
      body: {
        size: 0,
        aggs: { by_type: { terms: { field: 'type', size: 1000 } } },
      },
    },
    { ignore: [404] }
  );
  const result = new Map<string, number>();
  if (statusCode === 404) return result;

  const buckets = (body as any)?.aggregations?.by_type?.buckets ?? [];
  for (const b of buckets) {
    if (typeof b.key === 'string' && typeof b.doc_count === 'number') {
      result.set(b.key, b.doc_count);
    }
  }
  return result;
}

/**
 * Find the highest-numbered existing `.kibana_N` index that is NOT the given
 * collision target. Returns null if no plausible prior index exists.
 *
 * Example: alias = `.kibana`, existingDestName = `.kibana_8`. Scans indices
 * matching `.kibana*`, picks the one with the highest numeric suffix < 8 and
 * != 8. Used by `verifyDestIndexIntegrity`'s fallback per-type count check
 * when a legacy destination has no sentinel doc.
 */
export async function findPriorSavedObjectsIndex(
  client: MigrationOpenSearchClient,
  alias: string,
  existingDestName: string
): Promise<string | null> {
  const { body, statusCode } = await client.indices.get({ index: `${alias}*` }, { ignore: [404] });
  if (statusCode === 404 || !body) return null;

  // Match only exact versioned siblings of the alias — `${alias}_<digits>`,
  // with no additional path segments between the alias and the number. This
  // prevents matching sibling system indices such as `.kibana_task_manager_1`,
  // `.kibana_security_session_1`, or FGAC tenant indices of the form
  // `.kibana_<hash>_<tenant>_<n>`, which share the `.kibana*` prefix but are
  // not the prior version of the saved-object alias.
  const suffixRegex = new RegExp(`^${escapeRegex(alias)}_(\\d+)$`);
  const names = Object.keys(body).filter((n) => n !== existingDestName && suffixRegex.test(n));
  if (names.length === 0) return null;

  names.sort((a, b) => {
    const na = parseInt(a.match(suffixRegex)![1], 10);
    const nb = parseInt(b.match(suffixRegex)![1], 10);
    return nb - na; // descending
  });
  return names[0];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
