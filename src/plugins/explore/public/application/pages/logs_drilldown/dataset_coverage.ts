/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Determines whether an existing dataset "covers" a raw index — i.e. querying the dataset would
 * include that index — so the Rows view can show a direct "Query" action instead of "Create
 * dataset". Matching is deliberately conservative: only `*` is treated as a wildcard, everything
 * else is an exact match, and data-source / cross-cluster prefixes are stripped before comparing.
 */

/** Strip a `dataSourceId::` prefix and a cross-cluster `cluster:` prefix from a name/token. */
const stripPrefixes = (raw: string): string => {
  let s = raw.trim();
  const dsIdx = s.indexOf('::');
  if (dsIdx !== -1) s = s.slice(dsIdx + 2);
  const ccsIdx = s.indexOf(':');
  if (ccsIdx !== -1) s = s.slice(ccsIdx + 1);
  return s;
};

/** Convert one pattern token (possibly containing `*`) into an anchored RegExp. */
const tokenToRegExp = (token: string): RegExp => {
  const escaped = token.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
};

/**
 * Does a dataset title (which may be a wildcard like `logs-app-*` or a comma-separated set like
 * `a,b,c`) cover the given concrete index name?
 */
export const datasetCoversIndex = (datasetTitle: string, indexName: string): boolean => {
  if (!datasetTitle || !indexName) return false;
  const idx = stripPrefixes(indexName);
  return datasetTitle
    .split(',')
    .map((t) => stripPrefixes(t))
    .filter(Boolean)
    .some((token) => (token.includes('*') ? tokenToRegExp(token).test(idx) : token === idx));
};

/**
 * A minimal dataset shape for coverage checks. `name` is the dataset title/pattern (matches the
 * `BrowsableItem` shape the Rows view passes in).
 */
export interface CoverageDataset {
  name: string;
  datasetId?: string;
  timeFieldName?: string;
}

/**
 * Return the first listed dataset that covers the index, or undefined. Callers should pass only
 * datasets scoped to the active data source (coverage does not itself check the data source).
 */
export const indexCoveredByAnyDataset = <T extends CoverageDataset>(
  indexName: string,
  datasets: T[]
): T | undefined => datasets.find((d) => datasetCoversIndex(d.name, indexName));
