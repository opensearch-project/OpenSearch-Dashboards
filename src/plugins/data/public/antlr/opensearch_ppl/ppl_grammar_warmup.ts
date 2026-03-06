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

type GrammarCacheLike = Pick<typeof pplGrammarCache, 'invalidate' | 'warmUp'>;

const DEFAULT_DATASOURCE_KEY = '__default__';
const UNKNOWN_VERSION_KEY = '__unknown__';

function getWarmupSelectionKey(datasourceId?: string, datasourceVersion?: string): string {
  return `${datasourceId || DEFAULT_DATASOURCE_KEY}:${datasourceVersion || UNKNOWN_VERSION_KEY}`;
}

/**
 * Creates a query update handler that pre-fetches PPL grammar bundles only when:
 * - query language is PPL/PPL_Simplified
 * - a dataset is selected
 * - selected datasource identity (id + version) changes
 */
export function createPplGrammarWarmupHandler(
  http: HttpSetup,
  savedObjectsClient: SavedObjectsClientContract,
  grammarCache: GrammarCacheLike = pplGrammarCache
) {
  let lastSelectionKey: string | undefined;

  return (query: QueryLike) => {
    const language = (query?.language ?? '').toUpperCase();
    // In explore autocomplete, PPL uses PPL_Simplified. Both should warm runtime grammar.
    if (!language.startsWith('PPL')) return;

    const dataset = query?.dataset;
    if (!dataset) return;

    const datasourceId = dataset.dataSource?.id;
    const datasourceVersion = dataset.dataSource?.version;
    const selectionKey = getWarmupSelectionKey(datasourceId, datasourceVersion);
    if (selectionKey === lastSelectionKey) {
      return;
    }

    lastSelectionKey = selectionKey;
    grammarCache.invalidate(datasourceId);
    grammarCache.warmUp(http, savedObjectsClient, datasourceId, datasourceVersion);
  };
}
