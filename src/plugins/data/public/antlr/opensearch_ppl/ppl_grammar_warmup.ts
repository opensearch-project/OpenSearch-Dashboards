/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HttpSetup,
  IUiSettingsClient,
  SavedObjectsClientContract,
} from 'opensearch-dashboards/public';
import { pplGrammarCache } from './ppl_grammar_cache';
import { calciteSettingsCache } from '../../ppl_lint/calcite_settings_cache';

interface QueryLike {
  language?: string;
  dataset?: {
    dataSource?: {
      id?: string;
      version?: string;
      engineType?: string;
      type?: string;
    };
  };
}

type GrammarCacheLike = Pick<typeof pplGrammarCache, 'warmUp'>;
type SettingsCacheLike = Pick<typeof calciteSettingsCache, 'warmUp'>;

/**
 * Creates a query update handler that pre-fetches PPL grammar bundles and
 * Calcite cluster settings only when:
 * - query language is PPL/PPL_Simplified
 * - a dataset is selected
 *
 * The grammar cache handles feature flag checking, datasource switching
 * (auto-clears when the datasource ID changes), and version gating (>= 3.6),
 * so this handler only needs to gate on language/dataset presence and forward.
 *
 * The settings cache is not gated on the runtime-grammar flag because compiled
 * lint can emit `disabled-join-type` warnings that depend on `allJoinTypesAllowed`.
 */
export function createPplGrammarWarmupHandler(
  http: HttpSetup,
  uiSettings: IUiSettingsClient,
  savedObjectsClient: SavedObjectsClientContract,
  grammarCache: GrammarCacheLike = pplGrammarCache,
  settingsCache: SettingsCacheLike = calciteSettingsCache
) {
  return (query: QueryLike) => {
    const language = (query?.language ?? '').toUpperCase();
    if (!language.startsWith('PPL')) return;

    // No dataset selected — nothing to warm up.
    if (!query?.dataset) return;

    const datasourceId = query.dataset.dataSource?.id;
    const datasourceVersion = query.dataset.dataSource?.version;
    const datasourceEngineType =
      query.dataset.dataSource?.engineType ?? query.dataset.dataSource?.type;

    // Always forward to warmUp so the cache can detect feature flag changes,
    // datasource changes, and clear stale entries. The version gate (>= 3.6) and the
    // Elasticsearch short-circuit live inside the cache's doWarmUp — unsupported versions and
    // Elasticsearch engines won't trigger a network fetch.
    grammarCache.warmUp(
      http,
      uiSettings,
      savedObjectsClient,
      datasourceId,
      datasourceVersion,
      datasourceEngineType
    );

    // Warm the Calcite settings cache alongside. This is independent of the
    // runtime grammar flag because compiled-surface rules also use settings.
    settingsCache.warmUp(http, datasourceId);
  };
}
