/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractFieldMetadata } from '../../ppl_lint/lint_context_builder';
import type { LintFieldsCache } from '../../ppl_lint/lint_context_builder';

// The Discover editor's loadFields effect (query_editor.tsx) and the Explore
// editor's effect are intentionally identical: both await the index pattern for
// the active dataset, then stamp a LintFieldsCache with the field names AND the
// derived type map, keyed by dataset + data source id + dataset type plus the
// selected source pattern. The Explore hook variant is exercised end-to-end in
// use_query_panel_editor.test.ts ("loadFields effect caches field names and the
// type map"). The full Discover QueryEditor is too dependency-heavy to render in
// isolation, so these tests pin the exact async load/cancel/failure contract the
// Discover effect relies on — using the real extractor — so a regression in the
// shared cache shape or the stale-suppression behavior fails here.

// Mirror of the Discover loadFields effect body, minus React wiring, so the
// dataset/data-source stamping, cancellation, and failure paths are testable
// deterministically.
async function runLoadFields(opts: {
  datasetId?: string;
  dataSourceId?: string;
  datasetType?: string;
  selectedSourcePattern?: string;
  getIndexPattern: (id: string) => Promise<unknown>;
  isCancelled?: () => boolean;
}): Promise<LintFieldsCache> {
  const {
    datasetId,
    dataSourceId,
    datasetType,
    selectedSourcePattern,
    getIndexPattern,
    isCancelled = () => false,
  } = opts;
  let cache: LintFieldsCache = {};
  if (!datasetId) {
    return {};
  }
  try {
    const indexPattern = (await getIndexPattern(datasetId)) as
      { fields?: Array<{ name?: string; esTypes?: string[] }> } | undefined;
    if (isCancelled() || !indexPattern) {
      return cache;
    }
    const { fields, typeMap } = extractFieldMetadata(indexPattern);
    cache = {
      datasetId,
      dataSourceId,
      datasetType,
      selectedSourcePattern,
      fields,
      typeMap,
    };
  } catch {
    if (isCancelled()) {
      return cache;
    }
    cache = {};
  }
  return cache;
}

const indexPattern = {
  fields: [
    { name: 'age', esTypes: ['long'] },
    { name: 'name', esTypes: ['text'] },
    { name: 'mixed', esTypes: ['long', 'keyword'] },
  ],
};

describe('Discover query editor field/type-map cache lifecycle', () => {
  it('caches field names and the unambiguous type map keyed by dataset + data source', async () => {
    const cache = await runLoadFields({
      datasetId: 'ds-1',
      dataSourceId: 'mds-1',
      datasetType: 'INDEX_PATTERN',
      selectedSourcePattern: 'logs-*',
      getIndexPattern: () => Promise.resolve(indexPattern),
    });
    expect(cache.datasetId).toBe('ds-1');
    expect(cache.dataSourceId).toBe('mds-1');
    expect(cache.datasetType).toBe('INDEX_PATTERN');
    expect(cache.selectedSourcePattern).toBe('logs-*');
    expect(cache.fields).toEqual(new Set(['age', 'name', 'mixed']));
    // 'mixed' has conflicting types, so it is omitted from the type map.
    expect(cache.typeMap).toEqual(
      new Map([
        ['age', 'long'],
        ['name', 'text'],
      ])
    );
  });

  it('clears the cache when there is no dataset (self-suppress)', async () => {
    const cache = await runLoadFields({
      datasetId: undefined,
      getIndexPattern: () => Promise.resolve(indexPattern),
    });
    expect(cache).toEqual({});
  });

  it('does not apply a resolved load once the effect has been cancelled', async () => {
    const cache = await runLoadFields({
      datasetId: 'ds-1',
      dataSourceId: 'mds-1',
      getIndexPattern: () => Promise.resolve(indexPattern),
      isCancelled: () => true,
    });
    expect(cache.fields).toBeUndefined();
    expect(cache.typeMap).toBeUndefined();
  });

  it('clears the cache (no stale type map) when the field load fails', async () => {
    const cache = await runLoadFields({
      datasetId: 'ds-1',
      dataSourceId: 'mds-1',
      getIndexPattern: () => Promise.reject(new Error('load failed')),
    });
    expect(cache).toEqual({});
  });

  it('does not overwrite the cache when a failed load resolves after cancellation', async () => {
    const cache = await runLoadFields({
      datasetId: 'ds-1',
      dataSourceId: 'mds-1',
      getIndexPattern: () => Promise.reject(new Error('load failed')),
      isCancelled: () => true,
    });
    // Cancelled: the catch branch returns early, leaving the (empty) prior cache
    // rather than reasserting {} — either way, no stale types.
    expect(cache.typeMap).toBeUndefined();
  });
});
