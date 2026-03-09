/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { pplGrammarCache } from './ppl_grammar_cache';

interface QueryLike {
  language?: string;
  dataset?: {
    dataSource?: {
      id?: string;
      version?: string;
    };
  };
}

type GrammarCacheLike = Pick<typeof pplGrammarCache, 'warmUp'>;

/**
 * Creates a query update handler that pre-fetches PPL grammar bundles only when:
 * - query language is PPL/PPL_Simplified
 * - a dataset is selected
 *
 * The cache itself handles datasource switching (auto-clears when the
 * datasource ID changes) and version gating (>= 3.6), so this handler
 * only needs to gate on language/dataset presence and forward.
 */
export function createPplGrammarWarmupHandler(
  http: HttpSetup,
  savedObjectsClient: SavedObjectsClientContract,
  grammarCache: GrammarCacheLike = pplGrammarCache
) {
  return (query: QueryLike) => {
    const language = (query?.language ?? '').toUpperCase();
    if (!language.startsWith('PPL')) return;

    // No dataset selected — nothing to warm up.
    if (!query?.dataset) return;

    const datasourceId = query.dataset.dataSource?.id;
    const datasourceVersion = query.dataset.dataSource?.version;

    // Always forward to warmUp so the cache can detect datasource changes
    // and clear stale entries. The version gate (>= 3.6) lives inside the
    // cache's doWarmUp — unsupported versions won't trigger a network fetch.
    grammarCache.warmUp(http, savedObjectsClient, datasourceId, datasourceVersion);
  };
}
