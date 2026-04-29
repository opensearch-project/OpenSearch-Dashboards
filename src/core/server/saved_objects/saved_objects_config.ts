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

import { schema, TypeOf } from '@osd/config-schema';

export type SavedObjectsMigrationConfigType = TypeOf<typeof savedObjectsMigrationConfig.schema>;

export const savedObjectsMigrationConfig = {
  path: 'migrations',
  schema: schema.object({
    batchSize: schema.number({ defaultValue: 100 }),
    scrollDuration: schema.string({ defaultValue: '15m' }),
    pollInterval: schema.number({ defaultValue: 1500 }),
    skip: schema.boolean({ defaultValue: false }),
    delete: schema.object(
      {
        enabled: schema.boolean({ defaultValue: false }),
        types: schema.arrayOf(schema.string(), { defaultValue: [] }),
      },
      {
        validate(value) {
          if (value.enabled === true && value.types.length === 0) {
            return 'delete types cannot be empty when delete is enabled';
          }
        },
      }
    ),
    /**
     * Retry behavior for transient bulk-write failures during saved-object
     * migrations. A transient `process_cluster_event_timeout_exception` on
     * put-mapping can otherwise crash the migrator and leave `.kibana_N` in
     * a half-written state that no subsequent OSD instance will recover
     * from.
     */
    retry: schema.object({
      enabled: schema.boolean({ defaultValue: true }),
      maxRetries: schema.number({ defaultValue: 5, min: 0 }),
      initialBackoffMs: schema.number({ defaultValue: 1000, min: 0 }),
      maxBackoffMs: schema.number({ defaultValue: 30000, min: 0 }),
      clusterEventTimeoutMs: schema.number({ defaultValue: 120000, min: 1000 }),
    }),
    /**
     * Integrity checks applied when an OSD instance encounters an existing
     * destination index during migration (the `handleIndexExists` path in
     * `migration_coordinator.ts`). Prevents silently treating a crashed
     * partial destination as a healthy in-progress peer migration.
     */
    integrity: schema.object({
      enabled: schema.boolean({ defaultValue: true }),
      failOnDeltaPercentPerType: schema.number({ defaultValue: 5, min: 0, max: 100 }),
      failOnAbsoluteDeltaPerType: schema.number({ defaultValue: 10, min: 0 }),
      stalePeerProbeIntervalMs: schema.number({ defaultValue: 10000, min: 100 }),
      sentinelHeartbeatIntervalMs: schema.number({ defaultValue: 5000, min: 100 }),
      waitingTimeoutMs: schema.number({ defaultValue: 120000, min: 1000 }),
    }),
  }),
};

export type SavedObjectsConfigType = TypeOf<typeof savedObjectsConfig.schema>;

export const savedObjectsConfig = {
  path: 'savedObjects',
  schema: schema.object({
    maxImportPayloadBytes: schema.byteSize({ defaultValue: 26214400 }),
    maxImportExportSize: schema.byteSize({ defaultValue: 10000 }),
    permission: schema.object({
      enabled: schema.boolean({ defaultValue: false }),
    }),
    storage: schema.object({
      backend: schema.oneOf([schema.literal('opensearch'), schema.literal('sqlite')], {
        defaultValue: 'opensearch',
      }),
      sqlite: schema.object({
        path: schema.string({ defaultValue: 'data/osd-metadata.db' }),
      }),
    }),
  }),
};

export class SavedObjectConfig {
  public maxImportPayloadBytes: number;
  public maxImportExportSize: number;

  public migration: SavedObjectsMigrationConfigType;
  public storage: {
    backend: 'opensearch' | 'sqlite';
    sqlite: { path: string };
  };

  constructor(
    rawConfig: SavedObjectsConfigType,
    rawMigrationConfig: SavedObjectsMigrationConfigType
  ) {
    this.maxImportPayloadBytes = rawConfig.maxImportPayloadBytes.getValueInBytes();
    this.maxImportExportSize = rawConfig.maxImportExportSize.getValueInBytes();
    this.migration = rawMigrationConfig;
    this.storage = {
      backend: rawConfig.storage.backend,
      sqlite: { path: rawConfig.storage.sqlite.path },
    };
  }
}
