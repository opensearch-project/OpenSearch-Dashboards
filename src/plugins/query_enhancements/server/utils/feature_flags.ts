/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDynamicConfigurationClient } from 'opensearch-dashboards/server';
import {
  QUERY_ENHANCEMENTS_CONFIG_PATH,
  QUERY_ENHANCEMENTS_FEATURE_FLAGS,
  QUERY_ENHANCEMENTS_FEATURES,
  QueryEnhancementsFeature,
  QueryEnhancementsFeatureFlags,
} from '../../common/feature_flags';

type DynamicConfigClient = Pick<IDynamicConfigurationClient, 'getConfig'>;

/** Derived rather than imported: core declares `AsyncLocalStorageContext` but does not export it. */
type AsyncLocalStore = NonNullable<
  Parameters<IDynamicConfigurationClient['getConfig']>[1]
>['asyncLocalStorageContext'];

/**
 * Reads a flag out of a resolved config blob. `=== true` because dynamic config writes are not
 * schema-validated, so a stored value could be a truthy non-boolean such as the string `'false'`.
 */
const readFlag = (config: unknown, path: readonly string[]): boolean =>
  path.reduce<any>((node, key) => (node == null ? undefined : node[key]), config) === true;

export const resolveFeatureFlags = (config: unknown): QueryEnhancementsFeatureFlags =>
  QUERY_ENHANCEMENTS_FEATURES.reduce((flags, feature) => {
    flags[feature] = readFlag(config, QUERY_ENHANCEMENTS_FEATURE_FLAGS[feature]);
    return flags;
  }, {} as QueryEnhancementsFeatureFlags);

/**
 * Registered capability defaults, before the switcher overrides them. Resolved from no config, so
 * it cannot drift from what an unreadable config produces.
 */
export const defaultFeatureFlags = (): QueryEnhancementsFeatureFlags =>
  resolveFeatureFlags(undefined);

/**
 * Resolves every flag for the current request, with the dynamic config store merged over the
 * yml-backed defaults.
 *
 * Must pass `pluginConfigPath`, not `{ name }`: `pathToString` runs `snakeCase` on `name`, turning
 * `queryEnhancements` into the non-existent `query_enhancements` namespace.
 */
export const readFeatureFlags = async (
  client: DynamicConfigClient,
  asyncLocalStore?: AsyncLocalStore
): Promise<QueryEnhancementsFeatureFlags> => {
  const config = await client.getConfig(
    { pluginConfigPath: [QUERY_ENHANCEMENTS_CONFIG_PATH] },
    asyncLocalStore ? { asyncLocalStorageContext: asyncLocalStore } : undefined
  );
  return resolveFeatureFlags(config);
};

export const isFeatureEnabled = async (
  client: DynamicConfigClient,
  feature: QueryEnhancementsFeature,
  asyncLocalStore?: AsyncLocalStore
): Promise<boolean> => (await readFeatureFlags(client, asyncLocalStore))[feature];
