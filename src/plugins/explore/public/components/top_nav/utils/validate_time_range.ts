/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dateMath from '@elastic/datemath';
import { TimeRange, validateTimeRange } from '../../../../../data/public';

/**
 * Validates that the from date is actually before or equal to the to date.
 * This is the logical validation that the original validateTimeRange was missing.
 *
 * @param time - The time range to validate (must have valid format)
 * @returns true if from <= to, false otherwise
 */
export function validateTimeRangeOrder(time?: TimeRange): boolean {
  if (!time) return false;

  const momentDateFrom = dateMath.parse(time.from);
  const momentDateTo = dateMath.parse(time.to);

  return momentDateFrom!.isBefore(momentDateTo!) || momentDateFrom!.isSame(momentDateTo!);
}

/**
 * Complete time range validation that checks both format validity and logical validity.
 *
 * @param time - The time range to validate
 * @returns true if the time range is valid, false otherwise
 */
export function validateTimeRangeWithOrder(time?: TimeRange): boolean {
  if (!validateTimeRange(time)) {
    return false;
  }

  return validateTimeRangeOrder(time);
}

/**
 * Determines if a time range is invalid
 *
 * @param time - The time range to validate
 * @returns true if the time range is invalid, false if valid
 */
export function isTimeRangeInvalid(time?: TimeRange): boolean {
  return !validateTimeRangeWithOrder(time);
}
