/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Heuristics that turn concrete index names into a dataset pattern, so browsing an index
 * doesn't spawn one dataset per rolling/daily index. The result is always shown to the user
 * as an editable pattern with a live "matches N indexes" preview — we suggest, never commit.
 */

const SEPARATOR_RE = /[-._]/;
const SEPARATORS = ['-', '.', '_'];

/** A token made entirely of digits (a rolling counter or a date component like 2026, 07, 09). */
const isPurelyNumeric = (token: string): boolean => token.length > 0 && /^\d+$/.test(token);

/**
 * Derive a suggested wildcard from a single concrete index name by stripping the ENTIRE trailing
 * run of purely-numeric tokens (a rolling counter or a multi-part date) and anchoring `*` at the
 * separator before that run.
 *
 *   logs-0001            -> logs-*
 *   logs-02.01.2026      -> logs-*          (strips the whole -02.01.2026 date run)
 *   logs-02-01-2026      -> logs-*
 *   my-name-logs-019     -> my-name-logs-*
 *   nginx_access_000123  -> nginx_access_*
 *   2026.07.09           -> 2026.07.09      (all-numeric, no text prefix to anchor on → unchanged)
 *   orders               -> orders          (no trailing numeric run → unchanged)
 *   logs-v2              -> logs-v2          (`v2` is not purely numeric → unchanged)
 *   logs001              -> logs001          (no separator → unchanged; we don't split alpha↔digit)
 *
 * Guard rail: we only reduce when the retained stem is >= 3 chars AND contains at least one
 * non-numeric token — so short/ambiguous names like `a-1` and bare dates like `2026.07.09` are
 * left exact rather than producing an over-broad `a-*` / `2026.07.*`.
 */
export const suggestWildcardFromName = (name: string): string => {
  if (!name) return name;
  if (name.includes('*')) return name; // already a pattern

  // Split into tokens while remembering the separator characters, so we can re-anchor `*` at the
  // exact separator index (mixing `-` and `.` must round-trip: `logs.2026-07` stays `logs.*`).
  const tokens = name.split(SEPARATOR_RE);
  if (tokens.length < 2) return name; // no usable separator

  // Find the start of the trailing run of purely-numeric tokens.
  let runStart = tokens.length;
  while (runStart > 0 && isPurelyNumeric(tokens[runStart - 1])) {
    runStart -= 1;
  }
  // No trailing numeric token (runStart === tokens.length) → nothing to reduce.
  if (runStart === tokens.length) return name;

  const stemTokens = tokens.slice(0, runStart);
  // Guard rail: need a real stem to anchor on. All-numeric name (no stem) or a too-thin/all-numeric
  // stem is left exact rather than over-grouping.
  if (stemTokens.length === 0) return name;
  const stem = stemTokens.join('');
  if (stem.length < 3 || !stemTokens.some((t) => !isPurelyNumeric(t))) {
    return name;
  }

  // Re-anchor `*` at the separator index that precedes the numeric run. The separator before token
  // `runStart` is the (runStart)-th separator in the original name; find it by walking separators.
  const stemLength = anchorIndex(name, runStart);
  return `${name.slice(0, stemLength)}*`;
};

/**
 * Return the character index in `name` just past the `n`-th separator (1-based count of separators
 * consumed), i.e. the length of the prefix that includes the first `n` tokens and their trailing
 * separators. Used to slice the stem + its anchoring separator before appending `*`.
 */
const anchorIndex = (name: string, tokenCount: number): number => {
  let seen = 0;
  for (let i = 0; i < name.length; i++) {
    if (SEPARATOR_RE.test(name[i])) {
      seen += 1;
      if (seen === tokenCount) return i + 1; // include the separator, drop everything after
    }
  }
  return name.length;
};

/**
 * The longest common prefix of a set of strings.
 */
export const longestCommonPrefix = (names: string[]): string => {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  let prefix = names[0];
  for (const name of names.slice(1)) {
    while (name.indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (prefix === '') return '';
    }
  }
  return prefix;
};

/**
 * Comma-join a set of index names into a single multi-index dataset title. OpenSearch treats
 * `a,b,c` as a multi-index target natively (this mirrors indexTypeConfig.toDataset).
 */
export const commaSeparated = (names: string[]): string => names.join(',');

/**
 * Derive a suggested wildcard from a multi-selected set by reducing EACH name first, then:
 *  - if every name reduces to the same wildcard family, use that single wildcard;
 *  - otherwise, fall back to the comma-separated set.
 *
 * Reducing each name first avoids the longest-common-prefix traps:
 *   ['logs-2026.07.08','logs-2026.07.09'] → both reduce to `logs-*` → `logs-*`
 *     (raw LCP would give the broken `logs-2026.07.0*`, matching only days 00–09)
 *   ['api-1','app-1'] → reduce to `api-*` / `app-*` → differ → comma-join
 *     (raw LCP `ap` would give the over-broad `ap*`)
 */
export const suggestWildcardFromNames = (names: string[]): string => {
  if (names.length === 0) return '';
  if (names.length === 1) return suggestWildcardFromName(names[0]);

  const reduced = names.map(suggestWildcardFromName);
  const allAgree = reduced.every((r) => r === reduced[0]);
  // Only accept the shared reduction when it's an actual wildcard family (contains `*`) — if the
  // names didn't reduce (no numeric suffix), they're distinct names → comma-join them.
  if (allAgree && reduced[0].includes('*')) {
    return reduced[0];
  }
  return commaSeparated(names);
};

export type CreateMode = 'wildcard' | 'comma';

/**
 * Decide the default create mode + seed pattern for a selection. Single selections and multi-sets
 * that all reduce to the same wildcard family default to a wildcard; heterogeneous sets default to
 * comma-joined. Delegates to the same reduce-each-then-agree logic as {@link suggestWildcardFromNames}.
 */
export const seedCreatePattern = (names: string[]): { mode: CreateMode; pattern: string } => {
  if (names.length <= 1) {
    return { mode: 'wildcard', pattern: suggestWildcardFromName(names[0] ?? '') };
  }
  const pattern = suggestWildcardFromNames(names);
  return { mode: pattern.includes(',') ? 'comma' : 'wildcard', pattern };
};
