/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** Format milliseconds for timeline/tooltip display (always 2 decimals, spaced units) */
export const formatMs = (ms: number): string => {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${ms.toFixed(2)} ms`;
};

/** Parse a formatted duration string (e.g. "5.50ms", "1.50s") back to milliseconds */
export const parseLatencyMs = (latency?: string): number => {
  if (!latency || latency === '—') return 0;
  if (latency.endsWith('ms')) return parseFloat(latency) || 0;
  if (latency.endsWith('s')) return (parseFloat(latency) || 0) * 1000;
  return 0;
};

/**
 * Parse a timestamp string to epoch milliseconds with sub-millisecond precision.
 * Handles ISO and space-separated formats (e.g. "2025-05-29 03:11:25.292"),
 * extracting fractional seconds beyond the 3-digit millisecond limit of Date.
 * Accepts unknown input and returns 0 for non-string / invalid values.
 */
export const parseTimestampMs = (ts: unknown): number => {
  if (!ts || typeof ts !== 'string') return 0;

  try {
    let normalized = ts;

    if (ts.includes(' ') && !ts.includes('T')) {
      normalized = ts.replace(' ', 'T');
      if (!normalized.includes('Z') && !normalized.includes('+')) {
        normalized += 'Z';
      }
    }

    const date = new Date(normalized);

    const fractionalMatch = ts.match(/\.(\d+)/);
    if (fractionalMatch) {
      const fractionalPart = fractionalMatch[1];
      const millisecondsFromFraction = parseFloat('0.' + fractionalPart) * 1000;

      // Get the base timestamp without milliseconds, then add the high-precision fractional part
      const baseMs = Math.floor(date.getTime() / 1000) * 1000;

      return baseMs + millisecondsFromFraction;
    }

    const ms = date.getTime();
    return isNaN(ms) ? 0 : ms;
  } catch (error) {
    return 0;
  }
};
