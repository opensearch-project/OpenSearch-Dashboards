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

import { DeleteByQueryRequest } from '@opensearch-project/opensearch/api/types';
import { diffMappings } from './build_active_mappings';
import * as Index from './opensearch_index';
import { migrateRawDocs } from './migrate_raw_docs';
import { Context, migrationContext, MigrationOpts } from './migration_context';
import { coordinateMigration, MigrationResult } from './migration_coordinator';
import {
  buildInitialSentinel,
  markMigrationAborted,
  markMigrationComplete,
  markMigrationCopied,
  writeMigrationSentinel,
  MIGRATION_SENTINEL_ID,
} from './migration_sentinel';

/*
 * Core logic for migrating the mappings and documents in an index.
 */
export class IndexMigrator {
  private opts: MigrationOpts;

  /**
   * Creates an instance of IndexMigrator.
   *
   * @param {MigrationOpts} opts
   */
  constructor(opts: MigrationOpts) {
    this.opts = opts;
  }

  /**
   * Migrates the index, or, if another OpenSearch Dashboards instance appears to be running the migration,
   * waits for the migration to complete.
   *
   * @returns {Promise<MigrationResult>}
   */
  public async migrate(): Promise<MigrationResult> {
    const context = await migrationContext(this.opts);

    return coordinateMigration({
      log: context.log,

      pollInterval: context.pollInterval,

      async isMigrated() {
        return !(await requiresMigration(context));
      },

      async runMigration() {
        if (await requiresMigration(context)) {
          return migrateIndex(context);
        }

        return { status: 'skipped' };
      },

      integrityVerifier: {
        client: context.client,
        config: context.integrity,
        alias: context.alias,
        countByType: (indexName) => Index.countByType(context.client, indexName),
        findPriorSource: (alias, existingDestName) =>
          Index.findPriorSavedObjectsIndex(context.client, alias, existingDestName),
      },
    });
  }
}

/**
 * Determines what action the migration system needs to take (none, patch, migrate).
 */
async function requiresMigration(context: Context): Promise<boolean> {
  const { client, alias, documentMigrator, dest, log } = context;

  // Have all of our known migrations been run against the index?
  const hasMigrations = await Index.migrationsUpToDate(
    client,
    alias,
    documentMigrator.migrationVersion
  );

  if (!hasMigrations) {
    return true;
  }

  // Is our index aliased?
  const refreshedSource = await Index.fetchInfo(client, alias);

  if (!refreshedSource.aliases[alias]) {
    return true;
  }

  // Do the actual index mappings match our expectations?
  const diffResult = diffMappings(refreshedSource.mappings, dest.mappings);

  if (diffResult) {
    log.info(`Detected mapping change in "${diffResult.changedProp}"`);

    return true;
  }

  return false;
}

/**
 * Performs an index migration if the source index exists, otherwise
 * this simply creates the dest index with the proper mappings.
 */
async function migrateIndex(context: Context): Promise<MigrationResult> {
  const startTime = Date.now();
  const { client, alias, source, dest, log } = context;

  await deleteIndexTemplates(context);
  await deleteSavedObjectsByType(context);

  log.info(`Creating index ${dest.indexName}.`);

  await Index.createIndex(client, dest.indexName, dest.mappings);

  // Write the initial in-progress sentinel immediately after create. Best-
  // effort; a sentinel-write failure here shouldn't abort the migration
  // (the sentinel is a diagnostic / recovery aid, not correctness-critical).
  try {
    await writeMigrationSentinel(client, dest.indexName, buildInitialSentinel());
  } catch (e) {
    log.warning(
      `Failed to write initial migration sentinel on ${dest.indexName}: ${(e as Error).message}. ` +
        `Continuing migration; integrity recovery on restart may use count-fallback path only.`
    );
  }

  try {
    await migrateSourceToDest(context);
  } catch (err) {
    // Mark the dest aborted so restarting OSDs don't silently accept it as
    // a healthy in-progress peer. Best-effort; never let the abort-marker
    // write mask the original error.
    try {
      await markMigrationAborted(client, dest.indexName, (err as Error).message);
    } catch (abortErr) {
      log.warning(
        `Failed to mark ${dest.indexName} aborted after migration failure: ` +
          `${(abortErr as Error).message}. Original error still propagated.`
      );
    }
    throw err;
  }

  try {
    await markMigrationCopied(client, dest.indexName);
  } catch (e) {
    log.warning(`Failed to mark ${dest.indexName} copied: ${(e as Error).message}. Continuing.`);
  }

  log.info(`Pointing alias ${alias} to ${dest.indexName}.`);

  await Index.claimAlias(client, dest.indexName, alias);

  try {
    await markMigrationComplete(client, dest.indexName);
  } catch (e) {
    log.warning(
      `Failed to mark ${dest.indexName} complete: ${(e as Error).message}. ` +
        `Migration is still successful.`
    );
  }

  const result: MigrationResult = {
    status: 'migrated',
    destIndex: dest.indexName,
    sourceIndex: source.indexName,
    elapsedMs: Date.now() - startTime,
  };

  log.info(`Finished in ${result.elapsedMs}ms.`);

  return result;
}

/**
 * If the obsoleteIndexTemplatePattern option is specified, this will delete any index templates
 * that match it.
 */
async function deleteIndexTemplates({ client, log, obsoleteIndexTemplatePattern }: Context) {
  if (!obsoleteIndexTemplatePattern) {
    return;
  }

  const { body: templates } = await client.cat.templates<Array<{ name: string }>>({
    format: 'json',
    name: obsoleteIndexTemplatePattern,
  });

  if (!templates.length) {
    return;
  }

  // @ts-expect-error TS2345 TODO Fix me
  const templateNames = templates.map((t) => t.name);

  log.info(`Removing index templates: ${templateNames}`);

  // @ts-expect-error TS2345 TODO Fix me
  return Promise.all(templateNames.map((name) => client.indices.deleteTemplate({ name: name! })));
}

/**
 * Delete saved objects by type. If migrations.delete.types is specified,
 * any saved objects that matches that type will be deleted.
 */
async function deleteSavedObjectsByType(context: Context) {
  const { client, source, log, typesToDelete } = context;
  if (!source.exists || !typesToDelete || typesToDelete.length === 0) {
    return;
  }

  log.info(`Removing saved objects of types: ${typesToDelete.join(', ')}`);
  const params = {
    index: source.indexName,
    body: {
      query: {
        bool: {
          should: [...typesToDelete.map((type) => ({ term: { type } }))],
        },
      },
    },
    conflicts: 'proceed',
    refresh: true,
  } as DeleteByQueryRequest;
  log.debug(`Delete by query params: ${JSON.stringify(params)}`);
  return client.deleteByQuery(params);
}

/**
 * Moves all docs from sourceIndex to destIndex, migrating each as necessary.
 * This moves documents from the concrete index, rather than the alias, to prevent
 * a situation where the alias moves out from under us as we're migrating docs.
 */
async function migrateSourceToDest(context: Context) {
  const { client, alias, dest, source, batchSize, retry } = context;
  const { scrollDuration, documentMigrator, log, serializer } = context;

  if (!source.exists) {
    return;
  }

  if (!source.aliases[alias]) {
    log.info(`Reindexing ${alias} to ${source.indexName}`);

    await Index.convertToAlias(client, source, alias, batchSize, context.convertToAliasScript);
  }

  const read = Index.reader(client, source.indexName, { batchSize, scrollDuration });

  log.info(`Migrating ${source.indexName} saved objects to ${dest.indexName}`);

  while (true) {
    const rawDocs = await read();

    if (!rawDocs || !rawDocs.length) {
      return;
    }

    // The migration-status sentinel is stored inside the source index to
    // avoid cluster-event overhead, but it isn't a user saved object and
    // must not be carried forward via the scroll/copy path. The destination
    // gets its own fresh sentinel written at migrateIndex startup.

    const docs = rawDocs.filter((d: any) => d._id !== MIGRATION_SENTINEL_ID);

    if (docs.length === 0) {
      continue;
    }

    // @ts-expect-error TS2345 TODO Fix me
    log.debug(`Migrating saved objects ${docs.map((d) => d._id).join(', ')}`);

    await Index.write(
      client,
      dest.indexName,
      await migrateRawDocs(serializer, documentMigrator.migrate, docs, log),
      retry
    );
  }
}
