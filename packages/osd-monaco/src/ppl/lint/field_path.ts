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
 * The scanners track whether they are inside a quote, so a dot within a quoted
 * segment (`` `a.b` `` is one field named `a.b`, not two) is treated as literal.
 *
 * References can only be backtick-quoted, but created names written as
 * `` as 'years' `` reach these helpers too, so single/double quotes are stripped
 * as well. That is one-directional and safe: it rescues a created name without
 * changing how any reference is interpreted (a reference never carries `'`/`"`).
 */

// The three identifier/string delimiters PPL accepts around a path segment.
const QUOTES: ReadonlySet<string> = new Set(['`', "'", '"']);

/**
 * The one quote-aware segment scanner shared by both the string and structured
 * APIs, so a reference canonicalizes identically no matter which side reads it.
 *
 * Splits `raw` on dots that fall outside a quoted region, honoring the PPL lexer
 * rules: a quote only opens a span at the start of a segment (a stray quote
 * mid-segment — `a'b` — stays literal, matching how the grammar only quotes
 * whole identifiers); inside a region a backslash escapes the next character and
 * a doubled delimiter (`` `` ``, `''`, `""`) is an escaped delimiter that keeps
 * the region open. Escapes and doubled delimiters are preserved verbatim; only
 * the outer pair is stripped later. `balanced` is false when a quote never
 * closes, so the structured API can suppress rather than guess while the string
 * API stays best-effort.
 */
function scanSegments(raw: string): { segments: string[]; balanced: boolean } {
  const segments: string[] = [];
  let current = '';
  let quote: string | null = null;
  let atSegmentStart = true;
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
      segments.push(current);
      current = '';
      atSegmentStart = true;
      i += 1;
      continue;
    }

    // A quote only opens a span at the start of a segment; a quote appearing
    // mid-segment is a literal character.
    if (atSegmentStart && QUOTES.has(ch)) {
      quote = ch;
    }
    current += ch;
    atSegmentStart = false;
    i += 1;
  }
  segments.push(current);

  return { segments, balanced: quote === null };
}

/** Strip exactly one enclosing quote pair from a segment when it is fully wrapped. */
function stripOneQuotePair(segment: string): string {
  return segment.length >= 2 && QUOTES.has(segment[0]) && segment[0] === segment[segment.length - 1]
    ? segment.slice(1, -1)
    : segment;
}

/**
 * Split a raw field-path token into its dot-separated segments, honoring quotes:
 * a `.` inside a matching quote pair is part of the segment, not a separator.
 * Best-effort — an unterminated quote yields whatever accumulated rather than
 * failing, matching the string API's non-suppressing contract.
 */
export function splitFieldPath(raw: string): string[] {
  return scanSegments(raw).segments;
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
  return splitFieldPath(raw).map(stripOneQuotePair).join('.');
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
  return stripOneQuotePair(segments[0]);
}

export interface ParsedFieldPath {
  /** Canonical, quote-stripped segments in path order. */
  segments: string[];
  /** `segments.join('.')` — the canonical dotted lookup key. */
  canonical: string;
}

/**
 * Parse a raw field reference into canonical segments, splitting on dots that
 * fall outside a quoted region. Returns `undefined` for an unbalanced/malformed
 * quoted path so callers can suppress rather than guess. Shares the exact
 * segment scan {@link splitFieldPath} uses, so the string and structured sides
 * can never canonicalize the same reference differently.
 */
export function parseFieldPath(raw: string): ParsedFieldPath | undefined {
  const { segments: rawSegments, balanced } = scanSegments(raw);
  if (!balanced) {
    // Unterminated quote — malformed, no canonical lookup.
    return undefined;
  }
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
