/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a parsed query segment from a multi-query string.
 */
export interface ParsedQuery {
  /** Label for the query (A, B, C, ..., Z, AA, AB, ...) */
  label: string;
  /** The query string content (trimmed) */
  query: string;
  /** Starting line number (0-indexed) in the original text */
  startLine: number;
  /** Ending line number (0-indexed) in the original text */
  endLine: number;
  /** Starting character offset in the original text */
  startOffset: number;
  /** Ending character offset in the original text */
  endOffset: number;
}

/**
 * Languages that support multi-query (semicolon-delimited) syntax
 */
const MULTI_QUERY_LANGUAGES = ['PROMQL'];

/**
 * The delimiter used to separate multiple queries
 */
const MULTI_QUERY_DELIMITER = ';';

/**
 * Checks if a language supports multi-query (semicolon-delimited) syntax
 *
 * @param language - The query language identifier
 * @returns true if the language supports multi-query syntax
 */
export function supportsMultiQuery(language: string): boolean {
  return MULTI_QUERY_LANGUAGES.includes(language);
}

/**
 * Generates a label for a query index (0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, etc.)
 *
 * @param index - Zero-based index of the query
 * @returns The label string (A-Z, then AA, AB, etc.)
 */
export function getQueryLabel(index: number): string {
  if (index < 26) {
    return String.fromCharCode(65 + index); // A-Z
  }
  const firstChar = String.fromCharCode(65 + Math.floor((index - 26) / 26));
  const secondChar = String.fromCharCode(65 + ((index - 26) % 26));
  return firstChar + secondChar;
}

/**
 * Checks if a character at the given position is inside a string literal.
 * Handles single quotes, double quotes, backticks, and escaped quotes.
 *
 * @param text - The text to analyze
 * @param position - The character position to check
 * @returns true if the position is inside a string literal
 */
export function isInsideString(text: string, position: number): boolean {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;

  for (let i = 0; i < position; i++) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : '';

    if (prevChar === '\\') continue;

    if (char === "'" && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }
  }

  return inSingleQuote || inDoubleQuote || inBacktick;
}

/**
 * Finds all delimiter positions that are valid query delimiters
 * (not inside strings)
 *
 * @param text - The text to analyze
 * @param delimiter - The delimiter character (defaults to ';')
 * @returns Array of character positions where delimiters occur
 */
export function findDelimiterPositions(
  text: string,
  delimiter: string = MULTI_QUERY_DELIMITER
): number[] {
  const positions: number[] = [];

  for (let i = 0; i < text.length; i++) {
    if (text[i] === delimiter && !isInsideString(text, i)) {
      positions.push(i);
    }
  }

  return positions;
}

/**
 * Calculates line number for a given character offset (0-indexed)
 *
 * @param text - The text to analyze
 * @param offset - The character offset
 * @returns The line number (0-indexed)
 */
export function getLineNumber(text: string, offset: number): number {
  let lineNumber = 0;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      lineNumber++;
    }
  }
  return lineNumber;
}

/**
 * Splits a multi-query string (delimited by semicolons) into individual query segments.
 * Handles edge cases like semicolons inside strings and empty segments.
 * Includes position information for editor integration.
 *
 * @param queryString - The full query string potentially containing multiple queries
 * @returns Array of parsed query objects with labels and position information
 */
export function splitMultiQueries(queryString: string): ParsedQuery[] {
  if (!queryString || !queryString.trim()) {
    return [];
  }

  const delimiterPositions = findDelimiterPositions(queryString);
  if (delimiterPositions.length === 0) {
    return [
      {
        label: 'A',
        query: queryString.trim(),
        startLine: 0,
        endLine: getLineNumber(queryString, queryString.length),
        startOffset: 0,
        endOffset: queryString.length,
      },
    ];
  }

  const queries: ParsedQuery[] = [];
  let currentIndex = 0;
  let queryIndex = 0;

  // Process each segment
  const allPositions = [...delimiterPositions, queryString.length];

  for (const delimPos of allPositions) {
    const segment = queryString.substring(currentIndex, delimPos);
    const trimmedSegment = segment.trim();

    if (trimmedSegment) {
      let actualStart = currentIndex;
      while (actualStart < delimPos && /\s/.test(queryString[actualStart])) {
        actualStart++;
      }

      let actualEnd = delimPos;
      while (actualEnd > actualStart && /\s/.test(queryString[actualEnd - 1])) {
        actualEnd--;
      }

      queries.push({
        label: getQueryLabel(queryIndex),
        query: trimmedSegment,
        startLine: getLineNumber(queryString, actualStart),
        endLine: getLineNumber(queryString, actualEnd),
        startOffset: actualStart,
        endOffset: actualEnd,
      });

      queryIndex++;
    }

    currentIndex = delimPos + 1;
  }

  return queries;
}
