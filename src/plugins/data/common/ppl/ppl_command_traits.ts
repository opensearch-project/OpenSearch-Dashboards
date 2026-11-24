/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * How a PPL command that replaces document rows (aggregates, pivots, or projects them) is treated by
 * each piece of the query flow. Every flag must be decided per command, so adding a command here
 * forces a decision for each concern and the consumers can't drift apart.
 */
export interface PPLCommandTraits {
  /**
   * The Logs/histogram query is cut at this command (it and everything after it are removed),
   * because its output can't take the histogram's `| stats count() by span(...)`.
   */
  stripsFromHistogram: boolean;
  /**
   * Tab the query is routed to from the Logs tab. Any routed command also keeps the query on the
   * Statistics tab. Must be set whenever `stripsFromHistogram` is, or the Logs tab would silently
   * show the stripped documents instead of the command's output.
   */
  routesTo?: 'statistics' | 'visualization';
  /** Output rows are aggregation values, so async partial results must not be streamed. */
  isAggregation: boolean;
  /**
   * The rendered row count can be reproduced by appending `| stats count()`, so the hit counter can
   * show a bucket denominator.
   */
  isBucketCountable: boolean;
  /** Drops the dataset time field, so the default `| sort - <timeField>` must not be appended. */
  blocksDefaultSort: boolean;
}

const aggregation = (routesTo: PPLCommandTraits['routesTo']): PPLCommandTraits => ({
  stripsFromHistogram: true,
  routesTo,
  isAggregation: true,
  isBucketCountable: true,
  blocksDefaultSort: true,
});

/**
 * Single source of truth for the PPL commands that replace document rows. `patterns` is not listed
 * because its behavior depends on its mode; see {@link PPL_PATTERNS_AGGREGATION_TRAITS}.
 */
export const PPL_COMMAND_TRAITS: Readonly<Record<string, PPLCommandTraits>> = {
  stats: aggregation('statistics'),
  top: aggregation('statistics'),
  rare: aggregation('statistics'),
  chart: aggregation('visualization'),
  timechart: aggregation('visualization'),
  // transpose and xyseries pivot inside the query plan, so an appended `stats count()` counts the
  // pivoted rows.
  transpose: aggregation('statistics'),
  xyseries: aggregation('statistics'),
  // timewrap's pivot runs in the execution engine after the query plan, so a `stats count()` probe
  // counts the pre-pivot timechart buckets and overcounts. It always follows a timechart.
  timewrap: { ...aggregation('visualization'), isBucketCountable: false },
  // table is a projection: rows are still documents, so the hit count already equals the row count
  // and the histogram works. It only changes which tab renders best.
  table: {
    stripsFromHistogram: false,
    routesTo: 'statistics',
    isAggregation: false,
    isBucketCountable: false,
    blocksDefaultSort: false,
  },
};

/**
 * Traits of `patterns` in aggregation mode. The default `label` mode returns one row per document
 * plus a pattern field, so it has none of these traits.
 */
export const PPL_PATTERNS_AGGREGATION_TRAITS: PPLCommandTraits = aggregation('statistics');

/**
 * The mode a `patterns` command runs in when the query doesn't set `mode=`. The engine takes it from
 * the cluster setting `plugins.ppl.pattern.mode` (default `label`), so a client must read the setting
 * to know whether a bare `patterns` aggregates. `undefined` means the setting hasn't been read.
 */
export type PPLPatternsMode = 'label' | 'aggregation';

/** Options for the trait checks that depend on cluster settings. */
export interface PPLTraitOptions {
  /** The cluster's default `patterns` mode, or undefined when it hasn't been read. */
  patternsDefaultMode?: PPLPatternsMode;
}

/**
 * Matches a `patterns` command that is explicitly in aggregation mode. The `[^|]*` ties
 * `mode=aggregation` to the same `patterns` stage (a top-level pipe ends its arguments). The leading
 * `\s*` consumes whitespace before the pipe so slicing at the match index leaves no trailing space.
 * Callers must mask quoted strings and bracketed subqueries first.
 */
export const PPL_PATTERNS_AGGREGATION_MODE_REGEX =
  /\s*\|\s*patterns\b[^|]*\bmode\s*=\s*aggregation\b/i;

/**
 * Matches any `patterns` command that is not explicitly `mode=label`, i.e. one that aggregates when
 * the cluster default is `aggregation`. Same leading `\s*` and masking contract as
 * {@link PPL_PATTERNS_AGGREGATION_MODE_REGEX}.
 */
export const PPL_PATTERNS_NOT_LABEL_MODE_REGEX = /\s*\|\s*patterns\b(?![^|]*\bmode\s*=\s*label\b)/i;

/**
 * Matches a `patterns` command without any `mode=` argument, whose mode therefore comes from the
 * cluster setting. Callers use it to fetch the setting only when a query needs it. Callers must mask
 * quoted strings and bracketed subqueries first.
 */
export const PPL_PATTERNS_WITHOUT_MODE_REGEX = /\|\s*patterns\b(?![^|]*\bmode\s*=)/i;

/**
 * The regex for `patterns` commands that aggregate given the cluster default. With the default
 * unknown this assumes `label`, the engine default: used where guessing `aggregation` would move
 * label-mode results off the Logs tab on most clusters (strip, routing, bucket count, streaming).
 */
export const getPPLPatternsAggregationRegex = (patternsDefaultMode?: PPLPatternsMode): RegExp =>
  patternsDefaultMode === 'aggregation'
    ? PPL_PATTERNS_NOT_LABEL_MODE_REGEX
    : PPL_PATTERNS_AGGREGATION_MODE_REGEX;

/**
 * Like {@link getPPLPatternsAggregationRegex}, but with the default unknown this assumes the command
 * may aggregate. Used where guessing `label` wrongly causes a query error (the default sort fails
 * with `Field [<time field>] not found`), while guessing `aggregation` wrongly only skips the sort.
 */
export const getPPLPatternsMayAggregateRegex = (patternsDefaultMode?: PPLPatternsMode): RegExp =>
  patternsDefaultMode === 'label'
    ? PPL_PATTERNS_AGGREGATION_MODE_REGEX
    : PPL_PATTERNS_NOT_LABEL_MODE_REGEX;

/** Names of the commands in {@link PPL_COMMAND_TRAITS} for which `predicate` holds. */
export const getPPLCommandsWhere = (predicate: (traits: PPLCommandTraits) => boolean): string[] =>
  Object.entries(PPL_COMMAND_TRAITS)
    .filter(([, traits]) => predicate(traits))
    .map(([command]) => command);

/**
 * Builds a case-insensitive regex matching a top-level `| <command>` for any of `commands`. Without
 * `toEnd`, a command that starts the query also matches, for languages whose query can begin with a
 * command (e.g. `stats count() by host`). What follows a field of that name in a leading search
 * expression excludes it: a comparison, a path (`.`, `[`), or `in`, `like` or `is`, none of which
 * follows a command name. Explore runs PPL editor text without a source clause as
 * `source = <dataset> <text>`, so `top > 10` and `table.name = 'x'` filter on a field.
 *
 * With `toEnd`, the match also consumes leading whitespace and the rest of the query, so slicing at
 * its index removes the command and everything after it; only a piped command matches there, since
 * cutting at a leading one would leave no query. Callers must mask quoted strings and bracketed
 * subqueries first.
 *
 * An empty `commands` list returns a regex that never matches: an empty alternation would build
 * `\|\s*()\b`, which matches any pipe. This happens when no command has a trait, e.g. if
 * `timewrap` ever becomes bucket-countable.
 */
export const buildPPLCommandRegex = (commands: string[], { toEnd = false } = {}): RegExp => {
  if (commands.length === 0) {
    return /(?!)/;
  }
  return toEnd
    ? new RegExp(`\\s*\\|\\s*(${commands.join('|')})\\b[\\s\\S]*$`, 'i')
    : new RegExp(
        `(?:^|\\|)\\s*(${commands.join('|')})\\b(?!\\s*(?:[=!<>~.[]|(?:in|like|is)\\b))`,
        'i'
      );
};

/**
 * Whether a masked PPL query contains a command (or an aggregating `patterns`, see
 * {@link getPPLPatternsAggregationRegex}) with the given trait. Callers must mask quoted strings and
 * bracketed subqueries first.
 */
export const maskedPPLQueryHasTrait = (
  maskedQuery: string,
  predicate: (traits: PPLCommandTraits) => boolean,
  { patternsDefaultMode }: PPLTraitOptions = {}
): boolean =>
  buildPPLCommandRegex(getPPLCommandsWhere(predicate)).test(maskedQuery) ||
  (predicate(PPL_PATTERNS_AGGREGATION_TRAITS) &&
    getPPLPatternsAggregationRegex(patternsDefaultMode).test(maskedQuery));

/**
 * Masks bracketed subqueries and quoted strings, preserving length, so a command inside them isn't
 * mistaken for a top-level command. `[\s\S]` (not `.`) so a multi-line bracketed subquery is fully
 * masked.
 */
export const maskPPLBracketsAndStrings = (queryString: string): string =>
  queryString
    .replace(/\[[\s\S]*?\]/g, (match) => '\0'.repeat(match.length))
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (match) => '\0'.repeat(match.length));

// Commands after which `sort - <dataset time field>` must not be appended: the user already ordered
// or limited the result (sort, head), the time field may have been renamed away (rename), or the
// command replaced the row type and dropped the dataset time field (every command with the
// `blocksDefaultSort` trait). Sorting on the dataset's field after those turns a working query into
// `Field [<field>] not found`.
const DEFAULT_SORT_BLOCKING_COMMAND_REGEX = buildPPLCommandRegex([
  'sort',
  'head',
  'rename',
  ...getPPLCommandsWhere((traits) => traits.blocksDefaultSort),
]);

/**
 * Whether the default `| sort - <time field>` can be appended to a PPL query. Shared by
 * `PPLSearchInterceptor` and the streaming path, which must enrich a query identically or the same
 * query returns different results depending on whether streaming is on.
 *
 * A `patterns` without `mode=` runs in the cluster's default mode; with that unknown the sort is
 * skipped, since label-mode output without the default sort beats a `Field not found` error.
 */
export const canAppendPPLDefaultSort = (
  queryString: string,
  { patternsDefaultMode }: PPLTraitOptions = {}
): boolean => {
  const masked = maskPPLBracketsAndStrings(queryString);
  const hasFieldsProjection = /\|\s*fields\b/i.test(masked) && !/\|\s*fields\s+\*/i.test(masked);
  return (
    !hasFieldsProjection &&
    !DEFAULT_SORT_BLOCKING_COMMAND_REGEX.test(masked) &&
    !getPPLPatternsMayAggregateRegex(patternsDefaultMode).test(masked)
  );
};
