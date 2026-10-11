/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext, useMemo, useSyncExternalStore } from 'react';
import { ReactReduxContext } from 'react-redux';

// 'single' or "double" quoted literals, with backslash escapes. Backtick-quoted names (index
// and field identifiers) are deliberately not matched.
const STRING_LITERAL = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g;

/**
 * Returns the distinct string literals of a query, e.g. `upstream timeout` for
 * `... | WHERE detail = 'upstream timeout'`. Query languages such as PPL return no highlight
 * information with the results, so these are used to highlight what was searched for.
 */
export const extractQueryLiterals = (query: unknown): string[] => {
  if (typeof query !== 'string') return [];
  const literals = new Set<string>();
  for (const match of query.matchAll(STRING_LITERAL)) {
    const literal = (match[1] ?? match[2] ?? '').replace(/\\(.)/g, '$1');
    // LIKE-style wildcards are not part of the text being looked for
    const text = literal.replace(/^%+|%+$/g, '');
    if (text.trim().length > 0) literals.add(text);
  }
  return Array.from(literals);
};

const noopSubscribe = () => () => {};

/** The string literals of the current explore query; empty when there is no Redux store. */
export const useQueryHighlightTerms = (): string[] => {
  const store = useContext(ReactReduxContext)?.store;
  const query = useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    () => store?.getState()?.query?.query
  );
  return useMemo(() => extractQueryLiterals(query), [query]);
};

/** Merges highlight term lists, dropping duplicates. */
export const mergeHighlightTerms = (...lists: Array<string[] | undefined>): string[] =>
  Array.from(new Set(lists.flatMap((list) => list ?? [])));
