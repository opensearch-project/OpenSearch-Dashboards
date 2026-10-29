/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Client-side check of whether a single preview value can be indexed into an existing field of a
 * given OpenSearch type. This is deliberately lenient: it only flags values that would clearly be
 * rejected, so the preview highlights genuinely bad rows instead of every row of a column whose
 * predicted type differs from the existing one.
 */

const INTEGER_TYPES = new Set(['integer', 'long', 'short', 'byte', 'unsigned_long']);
const FLOAT_TYPES = new Set(['float', 'double', 'half_float', 'scaled_float']);

/**
 * Field types that accept any scalar. Mirrors STRING_FIELD_TYPES in
 * server/utils/coerce_to_mapping.ts, where numbers/booleans are coerced to strings on import.
 */
const STRING_FIELD_TYPES = new Set([
  'text',
  'keyword',
  'match_only_text',
  'wildcard',
  'constant_keyword',
]);

const INTEGER_PATTERN = /^[+-]?\d+$/;
const DIGITS_PATTERN = /^\d+$/;

export const isStringFieldType = (type: string | undefined): boolean =>
  !!type && STRING_FIELD_TYPES.has(type);

const isEmpty = (value: unknown) =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

const isNumeric = (value: unknown): boolean => {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  // Number('') is 0, but empty strings are filtered out before this point.
  return typeof value === 'string' && Number.isFinite(Number(value.trim()));
};

const isIntegerLike = (value: unknown): boolean => {
  if (typeof value === 'number') {
    return Number.isInteger(value);
  }
  return typeof value === 'string' && INTEGER_PATTERN.test(value.trim());
};

const isBooleanLike = (value: unknown): boolean =>
  typeof value === 'boolean' || value === 'true' || value === 'false';

const isDateLike = (value: unknown): boolean => {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  // Epoch millis/seconds, or anything the browser can parse. Custom mapping formats are not
  // evaluated here, so this errs on the side of accepting.
  return DIGITS_PATTERN.test(trimmed) || !Number.isNaN(Date.parse(trimmed));
};

/**
 * Returns true when `value` can be indexed into a field of `existingType`. Empty values, unknown
 * types and string-typed fields are always compatible. Arrays are compatible when every element is.
 */
export const isValueCompatibleWithType = (
  value: unknown,
  existingType: string | undefined
): boolean => {
  if (!existingType || isEmpty(value)) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every((item) => isValueCompatibleWithType(item, existingType));
  }
  if (STRING_FIELD_TYPES.has(existingType)) {
    return true;
  }
  if (INTEGER_TYPES.has(existingType)) {
    return isIntegerLike(value);
  }
  if (FLOAT_TYPES.has(existingType)) {
    return isNumeric(value);
  }
  if (existingType === 'boolean') {
    return isBooleanLike(value);
  }
  if (existingType === 'date' || existingType === 'date_nanos') {
    return isDateLike(value);
  }
  return true;
};
