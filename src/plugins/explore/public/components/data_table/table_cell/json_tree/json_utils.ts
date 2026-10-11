/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure helpers of the JSON tree: detecting JSON in a value, matching a leaf of the JSON to an
 * indexed field, and working out which texts to highlight. No React in here.
 */

// Strings longer than this are left as plain text to keep rendering cheap.
const MAX_JSON_LENGTH = 100000;

export type JsonContainer = Record<string, unknown> | unknown[];

/** True for objects and arrays, i.e. the JSON values that have children. */
export const isContainer = (value: unknown): value is JsonContainer =>
  typeof value === 'object' && value !== null;

/**
 * Returns the parsed value when `value` is an object/array or a string holding a JSON
 * object/array. Returns undefined for everything else (plain strings, numbers, invalid JSON).
 */
export const tryParseJson = (value: unknown): JsonContainer | undefined => {
  if (isContainer(value)) return value;
  if (typeof value !== 'string' || value.length > MAX_JSON_LENGTH) return undefined;
  const trimmed = value.trim();
  const first = trimmed[0];
  // Cheap rejection of the common case (plain text) before attempting to parse.
  if ((first !== '{' && first !== '[') || trimmed.length < 2) return undefined;
  try {
    const parsed = JSON.parse(trimmed);
    return isContainer(parsed) ? parsed : undefined;
  } catch (e) {
    return undefined;
  }
};

/**
 * Finds the indexed field that holds the same data as a leaf of a JSON string column, so the
 * leaf can be filtered on.
 *
 * Example: the column `payload` holds `{"error":{"code":502}}` and an ingest pipeline also
 * parsed it into `attributes.*`. The leaf at path `['error', 'code']` with value `502` matches
 * the field `attributes.error.code`.
 *
 * @param flattened the flattened document (field name -> value)
 * @param columnId the field the JSON string is in
 * @param path the object keys leading to the leaf; array indices are left out, because an
 *   array of objects is indexed as one multi-valued field per key
 * @param value the leaf value
 * @returns the name of the field to filter on. That is `<columnId>.<path>` when the document
 *   has it, otherwise the only field whose name ends with `.<path>`. In both cases the field
 *   must hold the leaf value in this document (or be an array containing it). Undefined when
 *   no field or more than one field qualifies, so a filter is never put on a guessed field.
 */
export const findFieldForLeaf = (
  flattened: Record<string, unknown>,
  columnId: string,
  path: string[],
  value: unknown
): string | undefined => {
  if (path.length === 0 || isContainer(value) || value === undefined) return undefined;
  const suffix = `.${path.join('.')}`;
  const holdsValue = (name: string) => {
    const fieldValue = flattened[name];
    return Array.isArray(fieldValue) ? fieldValue.includes(value) : fieldValue === value;
  };
  const exact = `${columnId}${suffix}`;
  if (exact in flattened) return holdsValue(exact) ? exact : undefined;
  const matches = Object.keys(flattened).filter(
    (name) => name !== columnId && name.endsWith(suffix) && holdsValue(name)
  );
  return matches.length === 1 ? matches[0] : undefined;
};

/**
 * Returns the distinct texts wrapped in <mark> in a formatted (search-highlighted) cell value,
 * so the same matches can be highlighted in the tree.
 */
export const extractHighlightTerms = (html: unknown): string[] => {
  if (typeof html !== 'string' || !html.includes('<mark')) return [];
  // Parsed into a detached document (nothing is inserted into the page) to read the marked
  // texts with their HTML entities decoded.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const terms = Array.from(doc.querySelectorAll('mark'))
    .map((mark) => mark.textContent ?? '')
    .filter((term) => term.length > 0);
  return Array.from(new Set(terms));
};

/** True when `value`, or anything nested in it, contains one of `terms`. */
export const containsTerm = (value: unknown, terms: string[]): boolean => {
  if (terms.length === 0) return false;
  const text = typeof value === 'string' ? value : (JSON.stringify(value) ?? '');
  return terms.some((term) => text.includes(term));
};
