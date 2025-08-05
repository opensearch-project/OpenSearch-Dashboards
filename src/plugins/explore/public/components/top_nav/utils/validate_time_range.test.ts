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
  const getPastDate = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
  const getFutureDate = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 1 day in future
  const getCurrentDate = () => new Date().toISOString();

  describe('validateTimeRangeOrder', () => {
    it('should return true for valid time ranges where from < to (assumes valid format)', () => {
      expect(
        validateTimeRangeOrder({
          from: getPastDate(),
          to: 'now',
        })
      ).toBe(true);
    });

    it('should return false for invalid time ranges where from > to (assumes valid format)', () => {
      expect(
        validateTimeRangeOrder({
          from: getFutureDate(),
          to: 'now',
        })
      ).toBe(false);
    });

    it('should return true for equal from and to dates (assumes valid format)', () => {
      const currentDate = getCurrentDate();
      expect(
        validateTimeRangeOrder({
          from: currentDate,
          to: currentDate,
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
          from: getPastDate(),
          to: 'now',
        })
      ).toBe(true);
    });

    it('should return false for invalid time ranges (valid format but invalid logic)', () => {
      expect(
        validateTimeRangeWithOrder({
          from: getFutureDate(),
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
          from: getPastDate(),
          to: 'now',
        })
      ).toBe(false);
    });

    it('should return true for invalid time ranges (from > to)', () => {
      expect(
        isTimeRangeInvalid({
          from: getFutureDate(),
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
