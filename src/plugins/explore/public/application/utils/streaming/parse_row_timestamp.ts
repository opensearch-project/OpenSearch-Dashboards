/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Parses a timestamp as it appears in a PPL JDBC row.
 *
 * PPL emits `YYYY-MM-DD HH:MM:SS[.sss]` in UTC, which `Date.parse` treats as local time in some
 * engines, so that form is handled explicitly. Epoch numbers and ISO strings are also accepted.
 */
export const parseRowTimestamp = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;

  const sqlLike = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(
    value.trim()
  );
  if (sqlLike) {
    const [, y, mo, d, hh, mi, ss, frac] = sqlLike;
    return Date.UTC(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(hh),
      Number(mi),
      Number(ss),
      frac ? Number(frac.padEnd(3, '0')) : 0
    );
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};
