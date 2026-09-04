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
 * The preparer's implementation lives in `query_enhancements` (which owns the
 * search interceptor, the filter formatters, and the live filter/time state),
 * not here: the `data` plugin must not depend on `query_enhancements`. This
 * module is the shared registry both plugins reach — the same
 * module-level-singleton injection pattern already used for `pplGrammarCache` and
 * `calciteSettingsCache`. `query_enhancements` registers the preparer at start
 * whenever the runtime-grammar bridge is active, and every host that runs PPL
 * lint (Discover and Explore alike) reads it through this same singleton, so it
 * is present in Explore too. `get()` returns `undefined` only in the
 * compiled-worker fallback (bridge off, e.g. a pre-3.6 backend), and the explain
 * layer then falls back to explaining the raw editor text.
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
