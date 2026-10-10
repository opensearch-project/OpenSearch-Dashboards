/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseRowTimestamp } from './parse_row_timestamp';

describe('parseRowTimestamp', () => {
  // The whole reason this function exists: PPL emits a bare `YYYY-MM-DD HH:MM:SS` that is UTC, and
  // Date.parse reads that form as local time, which shifts every histogram bucket by the browser's
  // offset. These assertions are absolute epoch values, so they fail if that regresses.
  describe('the PPL wire format is read as UTC', () => {
    it('parses a bare date-time as UTC, not local', () => {
      expect(parseRowTimestamp('2026-09-15 10:00:00')).toBe(Date.UTC(2026, 8, 15, 10, 0, 0));
    });

    it('accepts the ISO separator for the same form', () => {
      expect(parseRowTimestamp('2026-09-15T10:00:00')).toBe(Date.UTC(2026, 8, 15, 10, 0, 0));
    });

    it('does not agree with Date.parse unless the runtime happens to be UTC', () => {
      const parsed = parseRowTimestamp('2026-09-15 10:00:00');
      const naive = Date.parse('2026-09-15 10:00:00');
      const offsetMs = new Date(2026, 8, 15).getTimezoneOffset() * 60_000;
      expect(parsed).toBe(naive - offsetMs);
    });

    it('tolerates surrounding whitespace', () => {
      expect(parseRowTimestamp('  2026-09-15 10:00:00  ')).toBe(Date.UTC(2026, 8, 15, 10, 0, 0));
    });
  });

  describe('fractional seconds', () => {
    it.each([
      ['2026-09-15 10:00:00.5', 500],
      ['2026-09-15 10:00:00.05', 50],
      ['2026-09-15 10:00:00.123', 123],
    ])('reads %p as %p milliseconds', (value, ms) => {
      expect(parseRowTimestamp(value)).toBe(Date.UTC(2026, 8, 15, 10, 0, 0, ms));
    });
  });

  describe('other accepted shapes', () => {
    it('passes an epoch number through', () => {
      expect(parseRowTimestamp(1_757_930_400_000)).toBe(1_757_930_400_000);
    });

    it('accepts zero, which is a valid epoch', () => {
      expect(parseRowTimestamp(0)).toBe(0);
    });

    it('falls back to Date.parse for an offset-bearing ISO string', () => {
      expect(parseRowTimestamp('2026-09-15T10:00:00.000Z')).toBe(Date.UTC(2026, 8, 15, 10, 0, 0));
    });

    it('honours an explicit non-UTC offset', () => {
      expect(parseRowTimestamp('2026-09-15T10:00:00+02:00')).toBe(Date.UTC(2026, 8, 15, 8, 0, 0));
    });
  });

  describe('values with no timestamp to report', () => {
    it.each([[null], [undefined], [NaN], [Infinity], ['not a date'], [''], [{}], [true]])(
      'has no timestamp for %p',
      (value) => {
        expect(parseRowTimestamp(value as unknown)).toBeUndefined();
      }
    );
  });
});
