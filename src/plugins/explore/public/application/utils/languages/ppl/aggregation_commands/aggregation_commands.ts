/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PPL pipe commands that collapse document rows into aggregation buckets. Single source of truth so
 * the three places that reason about aggregations stay in sync: tab routing (detectAndSetOptimalTab
 * sends these to the Statistics tab), the Logs/histogram query (stripStatsFromQuery removes the
 * command and everything after it), and the bucket-count summary (queryHasAggregation gates the
 * dedicated `| stats count()` query). `table` is intentionally excluded — it is a projection whose
 * row count equals the hit count, so it needs no separate bucket count.
 */
export const AGGREGATION_COMMANDS = ['stats', 'top', 'rare'] as const;

/** Regex-alternation fragment for the commands above, e.g. `stats|top|rare`. */
export const AGGREGATION_COMMAND_PATTERN = AGGREGATION_COMMANDS.join('|');
