/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  calculateSpanTimeRange,
  calculateTraceTimeRange,
  parseHighPrecisionTimestamp,
} from './span_timerange_utils';
import { Span } from '../traces/span_detail_table';
import { hasNanosecondPrecision } from '../traces/ppl_resolve_helpers';

jest.mock('../traces/ppl_resolve_helpers');
const mockHasNanosecondPrecision = jest.mocked(hasNanosecondPrecision);

describe('span_timerange_utils', () => {
  describe('parseHighPrecisionTimestamp', () => {
    it('should return 0 for empty string', () => {
      expect(parseHighPrecisionTimestamp('')).toBe(0);
    });

    it('should parse ISO timestamp', () => {
      const result = parseHighPrecisionTimestamp('2023-01-01T00:00:00.000Z');
      expect(result).toBe(1672531200000);
    });

    it('should parse timestamp with space and add Z', () => {
      const result = parseHighPrecisionTimestamp('2023-01-01 00:00:00.000');
      expect(result).toBe(1672531200000);
    });

    it('should handle fractional seconds', () => {
      const result = parseHighPrecisionTimestamp('2023-01-01T00:00:00.123Z');
      expect(result).toBe(1672531200123);
    });

    it('should correctly parse high-precision timestamps with many decimal places', () => {
      // Test case for the bug fix: timestamps with high precision fractional seconds
      const startTime = '2025-10-01 20:27:43.971744429';
      const endTime = '2025-10-01 20:27:44.00006722';

      const startMs = parseHighPrecisionTimestamp(startTime);
      const endMs = parseHighPrecisionTimestamp(endTime);

      // The duration should be approximately 28.322 ms (from the bug report)
      const durationMs = endMs - startMs;

      // Should be around 28-29 ms, not 1000+ ms as in the original bug
      expect(durationMs).toBeGreaterThan(25);
      expect(durationMs).toBeLessThan(35);

      // More specific check - should be close to 28.322 ms
      expect(Math.abs(durationMs - 28.322)).toBeLessThan(1);
    });

    it('should return 0 for invalid timestamp', () => {
      const result = parseHighPrecisionTimestamp('invalid');
      expect(isNaN(result) || result === 0).toBe(true);
    });
  });

  describe('calculateSpanTimeRange', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should calculate duration from timestamps when both have nanosecond precision', () => {
      mockHasNanosecondPrecision.mockReturnValue(true);

      const span: Span = {
        spanId: 'test',
        children: [],
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:00:01.000Z',
        durationInNanos: 1000000000,
      } as Span;

      const result = calculateSpanTimeRange(span);
      expect(result.startTimeMs).toBe(1672531200000);
      expect(result.endTimeMs).toBe(1672531201000);
      expect(result.durationMs).toBe(1000);
    });

    it('should use span duration field as fallback when timestamps lack nanosecond precision', () => {
      mockHasNanosecondPrecision.mockReturnValue(false);

      const span: Span = {
        spanId: 'test',
        children: [],
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:00:01.000Z',
        durationInNanos: 500000000,
      } as Span;

      const result = calculateSpanTimeRange(span);
      expect(result.startTimeMs).toBe(1672531200000);
      expect(result.endTimeMs).toBe(1672531201000);
      expect(result.durationMs).toBe(500);
    });
  });

  describe('calculateTraceTimeRange', () => {
    it('should return zero values for empty spans array', () => {
      const result = calculateTraceTimeRange([]);
      expect(result).toEqual({ durationMs: 0, startTimeMs: 0, endTimeMs: 0 });
    });

    it('should calculate trace time range from multiple spans', () => {
      const spans: Span[] = [
        {
          spanId: 'span1',
          children: [],
          startTime: '2023-01-01T00:00:00.000Z',
          endTime: '2023-01-01T00:00:01.000Z',
        } as Span,
        {
          spanId: 'span2',
          children: [],
          startTime: '2023-01-01T00:00:00.500Z',
          endTime: '2023-01-01T00:00:02.000Z',
        } as Span,
      ];

      const result = calculateTraceTimeRange(spans);
      expect(result.startTimeMs).toBe(1672531200000);
      expect(result.endTimeMs).toBe(1672531202000);
      expect(result.durationMs).toBe(2000);
    });
  });
});
