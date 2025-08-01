/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  validateTimeRangeWithOrder,
  isTimeRangeInvalid,
  validateTimeRangeOrder,
} from './validate_time_range';

describe('validateTimeRangeWithOrder', () => {
  describe('validateTimeRangeOrder', () => {
    it('should return true for valid time ranges where from < to (assumes valid format)', () => {
      expect(
        validateTimeRangeOrder({
          from: '2025-07-01T21:15:21.002Z',
          to: 'now',
        })
      ).toBe(true);
    });

    it('should return false for invalid time ranges where from > to (assumes valid format)', () => {
      expect(
        validateTimeRangeOrder({
          from: '2030-07-31T21:15:21.002Z',
          to: 'now',
        })
      ).toBe(false);
    });

    it('should return true for equal from and to dates (assumes valid format)', () => {
      expect(
        validateTimeRangeOrder({
          from: '2025-07-22T12:00:00.000Z',
          to: '2025-07-22T12:00:00.000Z',
        })
      ).toBe(true);
    });

    it('should return false for null/undefined time range', () => {
      expect(validateTimeRangeOrder(undefined)).toBe(false);
      expect(validateTimeRangeOrder(null as any)).toBe(false);
    });
  });

  describe('validateTimeRangeWithOrder', () => {
    it('should return true for valid time ranges (both format and logic)', () => {
      expect(
        validateTimeRangeWithOrder({
          from: '2025-07-01T21:15:21.002Z',
          to: 'now',
        })
      ).toBe(true);
    });

    it('should return false for invalid time ranges (valid format but invalid logic)', () => {
      expect(
        validateTimeRangeWithOrder({
          from: '2030-07-31T21:15:21.002Z',
          to: 'now',
        })
      ).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(
        validateTimeRangeWithOrder({
          from: 'invalid-date',
          to: 'now',
        })
      ).toBe(false);
    });
  });

  describe('isTimeRangeInvalid', () => {
    it('should return false for valid time ranges', () => {
      expect(
        isTimeRangeInvalid({
          from: '2025-07-01T21:15:21.002Z',
          to: 'now',
        })
      ).toBe(false);
    });

    it('should return true for invalid time ranges (from > to)', () => {
      expect(
        isTimeRangeInvalid({
          from: '2030-07-31T21:15:21.002Z',
          to: 'now',
        })
      ).toBe(true);
    });

    it('should return true for invalid format', () => {
      expect(
        isTimeRangeInvalid({
          from: 'invalid-date',
          to: 'now',
        })
      ).toBe(true);
    });
  });
});
