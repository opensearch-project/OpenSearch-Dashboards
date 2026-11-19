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

/**
 * A plain decimal number string, optionally signed, with an optional fraction and exponent.
 * Based on DECIMAL_STRING_REGEX in server/utils/determine_mapping.ts, widened to what OpenSearch
 * actually accepts at index time (a leading `+`, leading zeros, `.5`, `1e3`). Unlike `Number()`,
 * it rejects hex/binary/octal literals and `Infinity`/`NaN`. Matched against the trimmed value,
 * since OpenSearch trims numeric strings before parsing.
 */
const DECIMAL_NUMBER_PATTERN = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;
const DIGITS_PATTERN = /^\d+$/;

export const isStringFieldType = (type: string | undefined): boolean =>
  !!type && STRING_FIELD_TYPES.has(type);

// Only the truly empty string: OpenSearch indexes '' into a (coercing) numeric field as null, but
// a whitespace-only string is parsed, and rejected, like any other value.
const isEmpty = (value: unknown) => value === null || value === undefined || value === '';

/**
 * Numeric field types (integer and float alike) default to `coerce: true`, so OpenSearch accepts
 * any decimal string, truncating fractions for integer types ("1.5" -> 1). Range is not checked.
 */
const isNumeric = (value: unknown): boolean => {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  // Whitespace-only trims to '', which the pattern rejects, matching OpenSearch's
  // number_format_exception for it
  return typeof value === 'string' && DECIMAL_NUMBER_PATTERN.test(value.trim());
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
  if (INTEGER_TYPES.has(existingType) || FLOAT_TYPES.has(existingType)) {
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
