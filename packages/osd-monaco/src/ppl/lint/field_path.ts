/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Shared field-path parsing for the PPL lint rules. A PPL field reference is a
// dot-separated path whose segments may be backtick-quoted (references) or
// single/double-quoted (created aliases such as `... as 'years'`). Splitting
// naively on `.` mis-parses a quoted segment that itself contains a dot
// (`` `a.b` ``), so this module scans once, splitting only on dots that fall
// outside a quoted region, then strips one enclosing quote pair per segment.
//
// This replaces the earlier `pipeline_shape.normalizeFieldName`, which split on
// every dot and therefore carried the documented `` `a.b` `` limitation. The
// canonical output is unchanged for every unquoted-dot path, so created-field
// registration and reference lookup stay in lock-step; only the quoted-dot case
// is corrected (and now matches an index field literally named `a.b`).

// The three identifier/string delimiters PPL accepts around a path segment. A
// backtick quotes an identifier (reference or created name); single/double
// quotes appear only on the created-alias side and are stripped one-directionally
// so a reference is never reinterpreted.
const SEGMENT_QUOTES: ReadonlySet<string> = new Set(['`', "'", '"']);

export interface ParsedFieldPath {
  /** Canonical, quote-stripped segments in path order. */
  segments: string[];
  /** `segments.join('.')` — the canonical dotted lookup key. */
  canonical: string;
}

/** Strip exactly one enclosing quote pair from a segment when it is fully wrapped. */
function stripOneQuotePair(segment: string): string {
  if (
    segment.length >= 2 &&
    SEGMENT_QUOTES.has(segment[0]) &&
    segment[0] === segment[segment.length - 1]
  ) {
    return segment.slice(1, -1);
  }
  return segment;
}

/**
 * Parse a raw field reference into canonical segments, splitting on dots that
 * fall outside a quoted region. Returns `undefined` for an unbalanced/malformed
 * quoted path so callers can suppress rather than guess.
 *
 * Quote handling follows the PPL lexer: inside a quoted region a doubled
 * delimiter (`` `` ``, `''`, `""`) is an escaped delimiter (region stays open)
 * and a backslash escapes the next character. Escapes and doubled delimiters are
 * preserved verbatim in the segment text — this module only removes the single
 * outer pair, matching the pre-existing normalizer's behavior for every case it
 * already handled.
 */
export function parseFieldPath(raw: string): ParsedFieldPath | undefined {
  const rawSegments: string[] = [];
  let current = '';
  let quote: string | null = null;
  let i = 0;

  while (i < raw.length) {
    const ch = raw[i];

    if (quote !== null) {
      if (ch === '\\' && i + 1 < raw.length) {
        // Backslash escape: keep both characters, consume the escaped one too.
        current += ch + raw[i + 1];
        i += 2;
        continue;
      }
      if (ch === quote) {
        if (raw[i + 1] === quote) {
          // Doubled delimiter is an escaped delimiter; the region stays open.
          current += ch + raw[i + 1];
          i += 2;
          continue;
        }
        // Closing delimiter.
        current += ch;
        quote = null;
        i += 1;
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }

    if (ch === '.') {
      rawSegments.push(current);
      current = '';
      i += 1;
      continue;
    }
    if (SEGMENT_QUOTES.has(ch)) {
      quote = ch;
    }
    current += ch;
    i += 1;
  }

  if (quote !== null) {
    // Unterminated quote — malformed, no canonical lookup.
    return undefined;
  }
  rawSegments.push(current);

  const segments = rawSegments.map(stripOneQuotePair);
  return { segments, canonical: segments.join('.') };
}

/**
 * Canonical name for a raw reference. Best-effort fallback to the raw text on
 * malformed input, preserving the earlier normalizer's contract for
 * error-recovered created-field collection. Type/existence lookups that must
 * suppress on malformed input should call {@link parseFieldPath} directly and
 * check for `undefined`.
 */
export function normalizeFieldName(raw: string): string {
  return parseFieldPath(raw)?.canonical ?? raw;
}

export interface TypedPrefix {
  /** The matched dotted prefix (a lookup key present in the type map). */
  path: string;
  /** The mapped type for that prefix. */
  type: string;
}

/**
 * Longest dotted prefix of `segments` that has an entry in `typeMap`, searching
 * from the full path toward the root. For `outer.inner.deep`, an entry for
 * `outer.inner` takes precedence over `outer`. Only `flat-object-subfield` uses
 * this; exact-lookup rules must not inherit an ancestor's type.
 */
export function findLongestTypedPrefix(
  segments: string[],
  typeMap: Map<string, string>
): TypedPrefix | undefined {
  for (let k = segments.length; k >= 1; k--) {
    const path = segments.slice(0, k).join('.');
    const type = typeMap.get(path);
    if (type !== undefined) {
      return { path, type };
    }
  }
  return undefined;
}
