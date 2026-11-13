/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext, useMemo, useSyncExternalStore } from 'react';
import { ReactReduxContext } from 'react-redux';

// 'single' or "double" quoted literals. A quote inside a literal is written either with a
// backslash (\') or, SQL-style, doubled (''). Backtick-quoted names (index and field
// identifiers) are deliberately not matched.
const STRING_LITERAL = /'((?:[^'\\]|\\.|'')*)'|"((?:[^"\\]|\\.|"")*)"/g;
// The escape sequences of a literal's content: \x stands for x, a doubled quote for one quote.
const ESCAPE_SEQUENCE = /\\(.)|''|""/g;
const BACKTICK_NAME = /`[^`]*`/g;

// Functions whose string arguments are text being looked for, e.g. `like(a, '%time%')`.
const MATCH_FUNCTIONS = new Set([
  'like',
  'ilike',
  'match',
  'match_phrase',
  'match_phrase_prefix',
  'match_bool_prefix',
  'multi_match',
  'query_string',
  'simple_query_string',
  'wildcard_query',
  'in',
]);

// A literal right after one of these is a positive match, e.g. `a = 'x'` or `a LIKE '%x%'`.
const POSITIVE_OPERATOR = /(?:(?<![!<>=])==?|\blike|\bilike)\s*$/i;
// A literal right after one of these is compared some other way (`!=`, `<`, an argument after a
// comma, arithmetic), so it is not something looked for.
const OTHER_OPERATOR = /[=<>!,+\-*/%]\s*$/;
// Where a condition starts: the command keyword, `and`/`or`/`xor`, or an opening parenthesis.
const CONDITION_START = /\b(?:where|search|and|or|xor)\b|\(/gi;
// SQL clauses after WHERE, which hold no search conditions
const SQL_AFTER_WHERE = /\b(?:group\s+by|order\s+by|having|limit)\b/i;
// Words before a parenthesis that open a group of conditions rather than call a function
const GROUPING_WORDS = new Set(['where', 'search', 'and', 'or', 'xor']);

/** Blanks out `pattern`'s matches, keeping the length, so positions still line up. */
const blank = (text: string, pattern: RegExp) =>
  text.replace(pattern, (match) => ' '.repeat(match.length));

/** Whether the condition at the end of `prefix` starts with `not` or `!`. */
const isNegated = (prefix: string): boolean => {
  let conditionStart = 0;
  for (const match of prefix.matchAll(CONDITION_START)) {
    conditionStart = (match.index ?? 0) + match[0].length;
  }
  return /^\s*(?:not\b|!(?!=))/i.test(prefix.slice(conditionStart));
};

/**
 * Whether the literal at `start` of `masked` (the query with its literals and backtick names
 * blanked out) is something the query looks for: a positive condition of a PPL `where` or
 * `search` command (or of the search expression after `source = ...`), or of an SQL `WHERE`.
 * Literals of other commands (`eval`, `fields`, `stats`, ...), of negated or non-equality
 * comparisons (`!=`, `<`, `not like`, ...) and of other functions are left out.
 */
const isPositiveMatch = (masked: string, start: number): boolean => {
  const commandStart = masked.lastIndexOf('|', start) + 1;
  let prefix = masked.slice(commandStart, start);
  const command = prefix
    .trimStart()
    .split(/[\s=(]/, 1)[0]
    .toLowerCase();
  if (command === 'select') {
    const where = prefix.search(/\bwhere\b/i);
    if (where === -1 || SQL_AFTER_WHERE.test(prefix.slice(where))) return false;
    prefix = prefix.slice(where);
  } else if (command === 'source' && commandStart === 0) {
    // `source = name ...`: what follows the index name is a search expression
    if (/^\s*source\s*=\s*$/i.test(prefix)) return false;
  } else if (command !== 'where' && command !== 'search') {
    return false;
  }

  // Inside an unclosed parenthesis: a function's arguments, an IN list or a group of conditions.
  let depth = 0;
  for (let i = prefix.length - 1; i >= 0; i--) {
    if (prefix[i] === ')') depth++;
    else if (prefix[i] === '(' && depth-- === 0) {
      const before = prefix.slice(0, i);
      const name = /(\w+)\s*$/.exec(before)?.[1]?.toLowerCase();
      if (name === 'not') return false;
      if (name && !GROUPING_WORDS.has(name)) {
        // A function or IN: only the matching ones count, and not when negated.
        return (
          MATCH_FUNCTIONS.has(name) && !/(?:\bnot\s+|!)\w+\s*$/i.test(before) && !isNegated(before)
        );
      }
      break;
    }
  }

  if (isNegated(prefix) || /\bnot\s+i?like\s*$/i.test(prefix)) return false;
  // `a = 'x'`, `a LIKE 'x'`, or a bare search term (`search source = t "error"`)
  return POSITIVE_OPERATOR.test(prefix) || !OTHER_OPERATOR.test(prefix);
};

/**
 * Returns the distinct texts a query looks for, e.g. `upstream timeout` for
 * `... | WHERE detail = 'upstream timeout'`. Query languages such as PPL return no highlight
 * information with the results, so these are used to highlight what was searched for. Only the
 * string literals of positive conditions are taken (see `isPositiveMatch`), and one-character
 * texts are skipped: they would mark and expand nearly everything.
 */
export const extractQueryLiterals = (query: unknown): string[] => {
  if (typeof query !== 'string') return [];
  const matches = Array.from(query.matchAll(STRING_LITERAL));
  const masked = blank(blank(query, STRING_LITERAL), BACKTICK_NAME);
  const literals = new Set<string>();
  for (const match of matches) {
    if (!isPositiveMatch(masked, match.index ?? 0)) continue;
    // Only the quote character that delimits the literal can appear doubled inside it.
    const quote = match[1] !== undefined ? "'" : '"';
    const literal = (match[1] ?? match[2] ?? '').replace(
      ESCAPE_SEQUENCE,
      (sequence, escaped?: string) => escaped ?? (sequence[0] === quote ? quote : sequence)
    );
    // LIKE-style wildcards are not part of the text being looked for
    const text = literal.replace(/^%+|%+$/g, '');
    if (text.trim().length > 1) literals.add(text);
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
