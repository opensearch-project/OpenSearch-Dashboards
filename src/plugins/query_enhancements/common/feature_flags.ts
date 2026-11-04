/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** Matches `configPath` in the plugin manifest. */
export const QUERY_ENHANCEMENTS_CONFIG_PATH = 'queryEnhancements';

/**
 * Runtime-togglable features, mapping the flat capability name exposed on
 * `capabilities.queryEnhancements` to where its flag lives in the plugin config.
 *
 * Adding a row is all it takes to introduce a flag: the registered capability defaults, the
 * DynamicConfig switcher that overrides them, and the per-request route guards all derive from
 * this map, so none of them need editing.
 */
export const QUERY_ENHANCEMENTS_FEATURE_FLAGS = {
  pplLint: ['ppl', 'lint', 'enabled'],
  pplStreaming: ['ppl', 'streaming', 'enabled'],
} as const;

export type QueryEnhancementsFeature = keyof typeof QUERY_ENHANCEMENTS_FEATURE_FLAGS;

export type QueryEnhancementsFeatureFlags = Record<QueryEnhancementsFeature, boolean>;

export const QUERY_ENHANCEMENTS_FEATURES = Object.keys(
  QUERY_ENHANCEMENTS_FEATURE_FLAGS
) as QueryEnhancementsFeature[];
