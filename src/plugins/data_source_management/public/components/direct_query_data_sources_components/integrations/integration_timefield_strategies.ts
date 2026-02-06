/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';

/**
 * Generates a universal WHERE clause for filtering materialized views by timestamp.
 *
 * This works with any integration because:
 * 1. All MV SQL files use a subquery pattern: SELECT * FROM (SELECT ... AS `@timestamp` ...) AS subq
 * 2. The `@timestamp` field is always a TIMESTAMP type after transformation
 * 3. We can filter on `@timestamp` uniformly regardless of the source format
 *
 * @param refreshRangeDays - Number of days to look back (0 = no limit)
 * @returns SQL WHERE clause string, or empty string if no filtering needed
 *
 * @example
 * generateTimestampFilter(7)
 * // Returns: "WHERE `@timestamp` >= '2026-01-14 00:00:00'"
 *
 * @example
 * generateTimestampFilter(0)
 * // Returns: "" (no filtering)
 */
export function generateTimestampFilter(refreshRangeDays: number): string {
  if (!Number.isInteger(refreshRangeDays) || refreshRangeDays < 0) {
    throw new Error('refreshRangeDays must be a non-negative integer');
  }

  // No filtering if refresh range is 0 (no limit)
  if (refreshRangeDays === 0) {
    return '';
  }

  // Format as 'YYYY-MM-DD HH:mm:ss' for SQL TIMESTAMP comparison.
  // Uses UTC which aligns with how source timestamps (Unix, ISO) are typically stored.
  // This ensures consistent filtering since both @timestamp data and this filter use UTC.
  const startDate = moment().utc().subtract(refreshRangeDays, 'days').format('YYYY-MM-DD HH:mm:ss');

  return `WHERE \`@timestamp\` >= '${startDate}'`;
}
