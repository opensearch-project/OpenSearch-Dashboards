/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PPL pipe commands that collapse document rows into aggregation buckets. Single source of truth so
 * the two places that reason about aggregations stay in sync: tab routing (detectAndSetOptimalTab
 * sends these to the Statistics tab) and the Logs/histogram query (stripStatsFromQuery removes the
 * command and everything after it).
 */
export const AGGREGATION_COMMANDS = ['stats', 'top', 'rare'] as const;

/** Regex-alternation fragment for the commands above, e.g. `stats|top|rare`. */
export const AGGREGATION_COMMAND_PATTERN = AGGREGATION_COMMANDS.join('|');

/**
 * Matches a `patterns` command that is in aggregation mode, i.e. `| patterns ... mode=aggregation`.
 *
 * `patterns` only produces buckets in `mode=aggregation`; its default `label` mode returns roughly
 * one row per document (plus a pattern field) and is histogram-compatible. The `[^|]*` keeps the
 * `mode=aggregation` match tied to the SAME `patterns` command: a top-level pipe ends the command's
 * arguments, so this never matches a `mode=aggregation` that belongs to a different stage. The
 * leading `\s*` consumes whitespace before the pipe so a slice at the match index leaves no trailing
 * space. Callers must mask quoted strings and bracketed subqueries first (so a pipe inside a literal
 * doesn't end the stage early). Single source of truth shared by stripStatsFromQuery and
 * queryIsBucketCountable.
 */
export const PATTERNS_AGGREGATION_MODE_PATTERN =
  /\s*\|\s*patterns\b[^|]*\bmode\s*=\s*aggregation\b/i;
