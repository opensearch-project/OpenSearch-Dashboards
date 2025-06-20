/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Checks if the value is a valid, finite number. Used for patterns table
export const isValidFiniteNumber = (val: number) => {
  return !isNaN(val) && isFinite(val);
};
