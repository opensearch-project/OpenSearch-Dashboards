/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Whether a flattened field value counts as populated.
 *
 * A field is empty when it is absent, null, or an array holding nothing but those.
 * Values such as 0, false and '' are populated — they are data the user asked for.
 */
export const hasFieldValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some(hasFieldValue);
  return true;
};
