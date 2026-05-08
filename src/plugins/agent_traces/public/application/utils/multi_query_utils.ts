/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ParsedQuery,
  getQueryLabel,
  getLineNumber,
  splitMultiQueries,
  supportsMultiQuery,
} from '../../../../data/common';

export { splitMultiQueries };

/**
 * Finds which query segment contains the given cursor position
 *
 * @param queryString - The full multi-query string
 * @param cursorOffset - The cursor position (character offset)
 * @returns The parsed query containing the cursor, or undefined if not found
 */
export function findQueryAtPosition(
  queryString: string,
  cursorOffset: number
): ParsedQuery | undefined {
  const queries = splitMultiQueries(queryString);

  if (queries.length === 0) {
    return undefined;
  }

  // Check each query - use < for endOffset since it's exclusive
  for (const query of queries) {
    if (cursorOffset >= query.startOffset && cursorOffset < query.endOffset) {
      return query;
    }
  }

  // If cursor is exactly at the end of a query (on the last character)
  for (const query of queries) {
    if (cursorOffset === query.endOffset) {
      return query;
    }
  }

  // If cursor is after all queries, return the last one (user typing at end)
  const lastQuery = queries[queries.length - 1];
  if (cursorOffset >= lastQuery.endOffset) {
    return lastQuery;
  }

  // If cursor is between queries (on delimiter or whitespace), find the next query
  // This handles the case where user just typed a semicolon and is starting a new query
  for (let i = 0; i < queries.length - 1; i++) {
    const currentQuery = queries[i];
    const nextQuery = queries[i + 1];

    if (cursorOffset >= currentQuery.endOffset && cursorOffset < nextQuery.startOffset) {
      return nextQuery;
    }
  }

  return queries[0];
}

/**
 * Gets the query-relative cursor offset for autocomplete
 *
 * @param queryString - The full multi-query string
 * @param cursorOffset - The absolute cursor position
 * @returns Object with the query segment and relative cursor position
 */
export function getQueryRelativePosition(
  queryString: string,
  cursorOffset: number
): { query: ParsedQuery; relativeOffset: number } | undefined {
  const queries = splitMultiQueries(queryString);

  if (queries.length === 0) {
    return undefined;
  }

  const currentQuery = findQueryAtPosition(queryString, cursorOffset);

  if (!currentQuery) {
    const lastQuery = queries[queries.length - 1];
    const textAfterLastQuery = queryString.substring(lastQuery.endOffset);

    if (textAfterLastQuery.includes(';') && cursorOffset > lastQuery.endOffset) {
      const semicolonPos = queryString.indexOf(';', lastQuery.endOffset);
      if (semicolonPos !== -1 && cursorOffset > semicolonPos) {
        const newQueryStart = semicolonPos + 1;
        let actualStart = newQueryStart;
        while (actualStart < cursorOffset && /\s/.test(queryString[actualStart])) {
          actualStart++;
        }
        const partialQuery = queryString.substring(actualStart, cursorOffset).trim();

        return {
          query: {
            label: getQueryLabel(queries.length),
            query: partialQuery,
            startLine: getLineNumber(queryString, actualStart),
            endLine: getLineNumber(queryString, cursorOffset),
            startOffset: actualStart,
            endOffset: cursorOffset,
          },
          relativeOffset: cursorOffset - actualStart,
        };
      }
    }

    return undefined;
  }

  return {
    query: currentQuery,
    relativeOffset: cursorOffset - currentQuery.startOffset,
  };
}

/**
 * Creates a cache key for a specific query in a multi-query context
 */
export function createMultiQueryCacheKey(label: string, queryString: string): string {
  return `${label}:${queryString}`;
}

/**
 * Parses a multi-query cache key back to label and query
 */
export function parseMultiQueryCacheKey(cacheKey: string): { label: string; query: string } | null {
  const match = cacheKey.match(/^([A-Z]+):(.*)$/);
  if (!match) return null;
  return { label: match[1], query: match[2] };
}

/**
 * Converts a character offset within a string to line and column position (1-indexed, Monaco style)
 *
 * @param text - The text to analyze
 * @param offset - The character offset (0-indexed)
 * @returns Object with lineNumber and column (both 1-indexed for Monaco compatibility)
 */
export function offsetToLineColumn(
  text: string,
  offset: number
): { lineNumber: number; column: number } {
  const clampedOffset = Math.max(0, Math.min(offset, text.length));
  let lineNumber = 1;
  let lastNewlineIndex = -1;

  for (let i = 0; i < clampedOffset; i++) {
    if (text[i] === '\n') {
      lineNumber++;
      lastNewlineIndex = i;
    }
  }

  return { lineNumber, column: clampedOffset - lastNewlineIndex };
}

/**
 * Result of getting editor position for a multi-query context
 */
export interface MultiQueryEditorPosition {
  /** The extracted query text for the current segment */
  queryText: string;
  /** The cursor offset relative to the current query segment */
  relativeOffset: number;
  /** Line number within the query segment (1-indexed, Monaco style) */
  lineNumber: number;
  /** Column within the query segment (1-indexed, Monaco style) */
  column: number;
  /** The full parsed query information */
  query: ParsedQuery;
}

/**
 * Gets editor position information for multi-query autocomplete.
 * Extracts the current query segment and calculates relative position for autocomplete.
 *
 * @param fullText - The full multi-query string
 * @param absoluteOffset - The absolute cursor position in the full text
 * @returns Position information for the current query segment, or undefined if not found
 */
export function getEditorPositionForMultiQuery(
  fullText: string,
  absoluteOffset: number
): MultiQueryEditorPosition | undefined {
  const queryPosition = getQueryRelativePosition(fullText, absoluteOffset);
  if (!queryPosition) {
    return undefined;
  }

  const relativePos = offsetToLineColumn(queryPosition.query.query, queryPosition.relativeOffset);

  return {
    queryText: queryPosition.query.query,
    relativeOffset: queryPosition.relativeOffset,
    lineNumber: relativePos.lineNumber,
    column: relativePos.column,
    query: queryPosition.query,
  };
}

/**
 * Result of getting autocomplete context, with position information
 */
interface AutocompleteContext {
  /** The query text to use for autocomplete */
  queryText: string;
  /** Selection start offset (relative to queryText) */
  selectionStart: number;
  /** Selection end offset (relative to queryText) */
  selectionEnd: number;
  /** Line number for position (1-indexed) */
  lineNumber: number;
  /** Column for position (1-indexed) */
  column: number;
}

/**
 * Gets autocomplete context for a given cursor position, handling multi-query languages.
 * For languages that support multi-query, extracts the current query segment.
 * For other languages, returns the full text with original position.
 *
 * @param fullText - The full editor text
 * @param absoluteOffset - The absolute cursor position
 * @param lineNumber - The current line number (1-indexed)
 * @param column - The current column (1-indexed)
 * @param language - The query language
 * @returns Autocomplete context with query text and position information
 */
export function getAutocompleteContext(
  fullText: string,
  absoluteOffset: number,
  lineNumber: number,
  column: number,
  language: string
): AutocompleteContext {
  if (supportsMultiQuery(language)) {
    const multiQueryPos = getEditorPositionForMultiQuery(fullText, absoluteOffset);
    if (multiQueryPos) {
      return {
        queryText: multiQueryPos.queryText,
        selectionStart: multiQueryPos.relativeOffset,
        selectionEnd: multiQueryPos.relativeOffset,
        lineNumber: multiQueryPos.lineNumber,
        column: multiQueryPos.column,
      };
    }
  }

  // Default: return full text with original position
  return {
    queryText: fullText,
    selectionStart: absoluteOffset,
    selectionEnd: absoluteOffset,
    lineNumber,
    column,
  };
}
