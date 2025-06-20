/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Creates a cache key for storing query results
 * Simplified to only include query and time range to avoid key size issues
 */
export const createCacheKey = (query: any, timeRange: any): string => {
  // Create cache key that matches the expected format from debug logs
  // Format: query_from_to (replacing spaces and special chars with underscores)
  const queryStr = String(query.query || '').replace(/[^a-zA-Z0-9]/g, '_');
  const fromStr = String(timeRange.from || '').replace(/[^a-zA-Z0-9]/g, '_');
  const toStr = String(timeRange.to || '').replace(/[^a-zA-Z0-9]/g, '_');

  const result = `${queryStr}_${fromStr}_${toStr}`;

  return result;
};
