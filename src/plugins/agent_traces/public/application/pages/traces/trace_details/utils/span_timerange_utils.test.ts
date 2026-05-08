/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatMs, parseLatencyMs, parseTimestampMs } from './span_timerange_utils';

describe('span_timerange_utils', () => {
  describe('formatMs', () => {
    it('formats milliseconds with 2 decimals', () => {
      expect(formatMs(234.5)).toBe('234.50 ms');
    });

    it('formats seconds when >= 1000ms', () => {
      expect(formatMs(2340)).toBe('2.34 s');
    });

    it('formats exactly 1 second', () => {
      expect(formatMs(1000)).toBe('1.00 s');
    });

    it('formats zero', () => {
      expect(formatMs(0)).toBe('0.00 ms');
    });
  });

  describe('parseLatencyMs', () => {
    it('parses ms values', () => {
      expect(parseLatencyMs('150ms')).toBe(150);
    });

    it('parses s values', () => {
      expect(parseLatencyMs('2.5s')).toBe(2500);
    });

    it('returns 0 for empty/dash', () => {
      expect(parseLatencyMs(undefined)).toBe(0);
      expect(parseLatencyMs('—')).toBe(0);
    });
  });

  describe('parseTimestampMs', () => {
    it('parses ISO timestamp', () => {
      const ms = parseTimestampMs('2025-01-01T00:00:00Z');
      expect(ms).toBe(new Date('2025-01-01T00:00:00Z').getTime());
    });

    it('normalizes space-separated timestamps', () => {
      const ms = parseTimestampMs('2025-01-01 12:00:00');
      expect(ms).toBeGreaterThan(0);
    });

    it('extracts sub-millisecond precision from fractional seconds', () => {
      const ms = parseTimestampMs('2025-01-01T00:00:00.123456Z');
      const base = new Date('2025-01-01T00:00:00Z').getTime();
      expect(ms).toBeCloseTo(base + 123.456, 2);
    });

    it('preserves timezone offset without appending Z', () => {
      const ms = parseTimestampMs('2025-01-01T12:00:00+05:00');
      // +05:00 means 07:00 UTC
      expect(ms).toBe(new Date('2025-01-01T07:00:00Z').getTime());
    });

    it('returns 0 for invalid input', () => {
      expect(parseTimestampMs(null)).toBe(0);
      expect(parseTimestampMs('')).toBe(0);
      expect(parseTimestampMs(123)).toBe(0);
    });
  });
});
