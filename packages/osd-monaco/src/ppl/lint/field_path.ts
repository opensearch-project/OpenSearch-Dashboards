/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Quote-aware parsing and normalization of a PPL field-path token.
 *
 * A PPL field reference is a dot-separated path where any segment may be wrapped
 * in a matching quote pair — a backtick, single quote, or double quote. Field
 * validation compares a written reference against the set of known field names,
 * so both the created-field side and the reference side must strip those quotes
 * the same way, or a created `` `total` `` would never match a bare `total`.
 *
 * This replaces the earlier `pipeline_shape.normalizeFieldName`, whose
 * `raw.split('.')` split *before* stripping quotes and therefore mis-parsed a
 * quoted segment that itself contained a dot: `` `a.b` `` split into `` `a `` and
 * `` b` ``, normalized to the two-segment `a.b` (path depth 2) instead of the
 * single quoted name `a.b` (path depth 1). The scanners below track whether they
 * are inside a quote, so a dot within a quoted segment is treated as literal.
 *
 * References can only be backtick-quoted, but created names written as
 * `` as 'years' `` reach these helpers too, so single/double quotes are stripped
 * as well. That is one-directional and safe: it rescues a created name without
 * changing how any reference is interpreted (a reference never carries `'`/`"`).
 *
 * Two APIs coexist here:
 *   - `splitFieldPath` / `normalizeFieldPath` / `fieldPathPrefix` — the string
 *     helpers the field-existence pass, pipeline-shape collection, and top-level
 *     source classifier use.
 *   - `parseFieldPath` / `normalizeFieldName` / `findLongestTypedPrefix` — the
 *     structured API the type-aware rules use: it returns quote-stripped
 *     segments plus a canonical key, handles lexer escapes, and reports
 *     malformed input as `undefined` so a type lookup can suppress rather than
 *     guess.
 */

const QUOTES = new Set(['`', "'", '"']);

/**
 * Split a raw field-path token into its dot-separated segments, honoring quotes:
 * a `.` inside a matching quote pair is part of the segment, not a separator.
 * A quote only opens a span when it starts a segment (so `a'b` — a stray quote
 * mid-segment — is not treated as an opener and stays literal), matching how the
 * grammar only quotes whole identifiers.
 */
export function splitFieldPath(raw: string): string[] {
  const segments: string[] = [];
  let current = '';
  let quote: string | undefined;
  let atSegmentStart = true;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (quote) {
      current += ch;
      if (ch === quote) {
        quote = undefined;
      }
      continue;
    }

    if (ch === '.') {
      segments.push(current);
      current = '';
      atSegmentStart = true;
      continue;
    }

    // A quote only opens a span at the start of a segment; a quote appearing
    // mid-segment is a literal character.
    if (atSegmentStart && QUOTES.has(ch)) {
      quote = ch;
    }
    current += ch;
    atSegmentStart = false;
  }
  segments.push(current);

  return segments;
}

/** Strip one enclosing quote pair from a single segment, if present. */
function unquoteSegment(segment: string): string {
  return segment.length >= 2 && QUOTES.has(segment[0]) && segment[0] === segment[segment.length - 1]
    ? segment.slice(1, -1)
    : segment;
}

/**
 * Normalize a created/derived or referenced field-path token so the two sides
 * match: split into segments honoring quotes, strip one enclosing quote pair per
 * segment, and rejoin on `.`.
 *
 *   `` `total` ``     → `total`
 *   `` a.`b` ``       → `a.b`
 *   `` `a.b` ``       → `a.b`   (one quoted segment containing a dot)
 *   `'years'`         → `years`
 */
export function normalizeFieldPath(raw: string): string {
  return splitFieldPath(raw).map(unquoteSegment).join('.');
}

/**
 * The leading segment of a normalized field path — the part before the first
 * *unquoted* dot — or null when the path has a single segment. Used to test a
 * dotted reference's prefix against declared join aliases. Because the split is
 * quote-aware, `` `a.b`.c `` yields the prefix `a.b`, not `a`.
 */
export function fieldPathPrefix(raw: string): string | null {
  const segments = splitFieldPath(raw);
  if (segments.length < 2) {
    return null;
  }
  return unquoteSegment(segments[0]);
}

// The three identifier/string delimiters PPL accepts around a path segment. A
// backtick quotes an identifier (reference or created name); single/double
// quotes appear only on the created-alias side and are stripped one-directionally
// so a reference is never reinterpreted. (Same set as QUOTES above, retyped as a
// ReadonlySet for the structured parser below.)
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
