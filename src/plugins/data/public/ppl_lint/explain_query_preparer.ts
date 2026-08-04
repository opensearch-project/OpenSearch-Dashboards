/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PrepareExplainQuery } from '@osd/monaco';

/**
 * Host-registered preparer that turns raw editor text into the query the host
 * would actually run for the explain-backed lint rules — source-prepend plus the
 * dashboard/time filters the search interceptor applies — and the stable cache
 * key that omits the volatile time clause.
 *
 * The preparer lives in `query_enhancements` (which owns the search interceptor,
 * the filter formatters, and the live filter/time state), not here: the `data`
 * plugin must not depend on `query_enhancements`. `query_enhancements` registers
 * the preparer at start, and `buildPPLLintContext` reads it — the same
 * module-level-singleton injection pattern already used for `pplGrammarCache` and
 * `calciteSettingsCache`. When nothing is registered (e.g. explore, which does
 * not load `query_enhancements`), `get()` returns `undefined` and the explain
 * layer falls back to explaining the raw editor text, i.e. today's behavior.
 */
let registered: PrepareExplainQuery | undefined;

export const explainQueryPreparer = {
  register(fn: PrepareExplainQuery | undefined): () => void {
    registered = fn;
    return () => {
      if (registered === fn) {
        registered = undefined;
      }
    };
  },
  get(): PrepareExplainQuery | undefined {
    return registered;
  },
};
