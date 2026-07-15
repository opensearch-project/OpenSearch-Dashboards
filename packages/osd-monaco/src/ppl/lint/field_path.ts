/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Quote-aware normalization of a PPL field-path token.
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
 * single quoted name `a.b` (path depth 1). The scanner below tracks whether it is
 * inside a quote, so a dot within a quoted segment is treated as literal.
 *
 * References can only be backtick-quoted, but created names written as
 * `` as 'years' `` reach this helper too, so single/double quotes are stripped as
 * well. That is one-directional and safe: it rescues a created name without
 * changing how any reference is interpreted (a reference never carries `'`/`"`).
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
