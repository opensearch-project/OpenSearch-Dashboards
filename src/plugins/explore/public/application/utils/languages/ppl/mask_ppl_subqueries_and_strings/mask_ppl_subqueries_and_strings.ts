/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Masks quoted string literals and bracketed subqueries in a PPL query by replacing their
 * characters with NUL, so a command-detection regex run over the result only sees top-level pipes.
 * The mask preserves length, so positions line up 1:1 with the input and a match index in the
 * masked string maps straight back onto the original.
 *
 * - Quotes: single- and double-quoted strings (escaped quotes handled) are masked, so `| stats`
 *   inside a literal (e.g. `where msg = '| stats count()'`) is not matched.
 * - Brackets: `[...]` subquery content is masked (`[\s\S]*?` crosses newlines).
 */
export const maskPPLSubqueriesAndStrings = (queryString: string): string => {
  // Mask quoted strings first (handles escaped quotes within).
  let masked = queryString.replace(/'(?:[^'\\]|\\.)*'/g, (match) => '\0'.repeat(match.length));
  masked = masked.replace(/"(?:[^"\\]|\\.)*"/g, (match) => '\0'.repeat(match.length));
  // Then mask bracket subqueries.
  masked = masked.replace(/\[[\s\S]*?\]/g, (match) => '\0'.repeat(match.length));
  return masked;
};
