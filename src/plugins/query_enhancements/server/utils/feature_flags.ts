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

/**
 * Derived from the client's own signature rather than imported: core declares
 * `AsyncLocalStorageContext` but does not re-export it, and deriving keeps this correct if the type
 * changes.
 */
type AsyncLocalStore = NonNullable<
  Parameters<IDynamicConfigurationClient['getConfig']>[1]
>['asyncLocalStorageContext'];

/**
 * Reads a flag out of a resolved config blob.
 *
 * `=== true` coerces explicitly: dynamic config writes are not schema-validated, so a stored value
 * could be a non-boolean (the string `'false'` is truthy) that must not leak into the flag.
 */
const readFlag = (config: unknown, path: readonly string[]): boolean =>
  path.reduce<any>((node, key) => (node == null ? undefined : node[key]), config) === true;

/** Every flag off. The registered capability defaults, before the switcher overrides them. */
export const defaultFeatureFlags = (): QueryEnhancementsFeatureFlags =>
  QUERY_ENHANCEMENTS_FEATURES.reduce((flags, feature) => {
    flags[feature] = false;
    return flags;
  }, {} as QueryEnhancementsFeatureFlags);

export const resolveFeatureFlags = (config: unknown): QueryEnhancementsFeatureFlags =>
  QUERY_ENHANCEMENTS_FEATURES.reduce((flags, feature) => {
    flags[feature] = readFlag(config, QUERY_ENHANCEMENTS_FEATURE_FLAGS[feature]);
    return flags;
  }, {} as QueryEnhancementsFeatureFlags);

/**
 * Resolves every flag for the current request.
 *
 * `getConfig` merges the dynamic config store over the yml-backed defaults and falls back to those
 * defaults when nothing is stored, so this is the effective value whether or not DynamicConfig has
 * been written to.
 *
 * Note the caller must pass `pluginConfigPath`, not `{ name }`: `pathToString` runs `snakeCase` on
 * `name`, which would turn `queryEnhancements` into the non-existent `query_enhancements`
 * namespace.
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
