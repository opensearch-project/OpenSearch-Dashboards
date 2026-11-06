/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A value as JSON with object keys sorted at every level, so two values that differ only in key
 * order compare equal. The URL state (`_a`) goes through rison, which sorts keys: anything the page
 * compares with what comes back from the URL uses this, never `JSON.stringify`.
 */
export const stableKey = (value: unknown): string =>
  JSON.stringify(value, (_key, inner) =>
    inner && typeof inner === 'object' && !Array.isArray(inner)
      ? Object.keys(inner)
          .sort()
          .reduce<Record<string, unknown>>((sorted, key) => {
            sorted[key] = (inner as Record<string, unknown>)[key];
            return sorted;
          }, {})
      : inner
  ) ?? '';
