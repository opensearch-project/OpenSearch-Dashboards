/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateTimestampFilter } from './integration_timefield_strategies';

describe('generateTimestampFilter', () => {
  beforeEach(() => {
    // Mock Date to have consistent test results
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-22T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when refreshRangeDays is 0 (no limit)', () => {
    it('should return an empty string', () => {
      const result = generateTimestampFilter(0);
      expect(result).toBe('');
    });
  });

  describe('when refreshRangeDays is greater than 0', () => {
    it('should return a WHERE clause with @timestamp filter for 7 days', () => {
      const result = generateTimestampFilter(7);

      // 7 days before 2026-01-22 12:00:00 = 2026-01-15 12:00:00
      expect(result).toBe("WHERE `@timestamp` >= '2026-01-15 12:00:00'");
    });

    it('should return a WHERE clause with @timestamp filter for 1 day', () => {
      const result = generateTimestampFilter(1);

      // 1 day before 2026-01-22 12:00:00 = 2026-01-21 12:00:00
      expect(result).toBe("WHERE `@timestamp` >= '2026-01-21 12:00:00'");
    });

    it('should return a WHERE clause with @timestamp filter for 30 days', () => {
      const result = generateTimestampFilter(30);

      // 30 days before 2026-01-22 12:00:00 = 2025-12-23 12:00:00
      expect(result).toBe("WHERE `@timestamp` >= '2025-12-23 12:00:00'");
    });

    it('should return a WHERE clause with @timestamp filter for 90 days', () => {
      const result = generateTimestampFilter(90);

      // 90 days before 2026-01-22 12:00:00 = 2025-10-24 12:00:00
      expect(result).toBe("WHERE `@timestamp` >= '2025-10-24 12:00:00'");
    });
  });

  describe('format validation', () => {
    it('should use backticks around @timestamp', () => {
      const result = generateTimestampFilter(7);
      expect(result).toContain('`@timestamp`');
    });

    it('should use single quotes around the date value', () => {
      const result = generateTimestampFilter(7);
      expect(result).toMatch(/WHERE `@timestamp` >= '\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'/);
    });

    it('should format date as YYYY-MM-DD HH:mm:ss', () => {
      const result = generateTimestampFilter(7);
      // Should match format: WHERE `@timestamp` >= 'YYYY-MM-DD HH:mm:ss'
      expect(result).toMatch(/^\s*WHERE `@timestamp` >= '\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'\s*$/);
    });

    it('should not include milliseconds or timezone in the date', () => {
      const result = generateTimestampFilter(7);
      expect(result).not.toContain('.');
      expect(result).not.toContain('Z');
      expect(result).not.toContain('T');
    });
  });

  describe('edge cases', () => {
    it('should handle large values', () => {
      const result = generateTimestampFilter(365);

      // 365 days before 2026-01-22 = 2025-01-22
      expect(result).toBe("WHERE `@timestamp` >= '2025-01-22 12:00:00'");
    });
  });

  describe('input validation', () => {
    it('should throw an error for negative values', () => {
      expect(() => generateTimestampFilter(-1)).toThrow(
        'refreshRangeDays must be a non-negative integer'
      );
    });

    it('should throw an error for non-integer values', () => {
      expect(() => generateTimestampFilter(7.5)).toThrow(
        'refreshRangeDays must be a non-negative integer'
      );
    });

    it('should throw an error for NaN', () => {
      expect(() => generateTimestampFilter(NaN)).toThrow(
        'refreshRangeDays must be a non-negative integer'
      );
    });
  });
});
