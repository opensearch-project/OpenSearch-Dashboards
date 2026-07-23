/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Quote-aware parsing of a PPL field-path token. A segment may be wrapped in a
// matching quote pair (`` ` ``, `'`, `"`), so a dot inside `` `a.b` `` is part of
// the name, not a separator. Splitting and quote-stripping must match on both the
// reference and created-field sides or a created `` `total` `` won't match `total`.

const QUOTES: ReadonlySet<string> = new Set(['`', "'", '"']);

// Splits on unquoted dots. A quote only opens a span at a segment start; inside a
// span a backslash or a doubled delimiter escapes; both are kept verbatim (only
// the outer pair is stripped later). `balanced` is false on an unterminated quote.
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
        current += ch + raw[i + 1];
        i += 2;
        continue;
      }
      if (ch === quote) {
        if (raw[i + 1] === quote) {
          // Doubled delimiter is an escaped delimiter; the span stays open.
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

    // A quote only opens a span at a segment start; mid-segment it is literal.
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

function stripOneQuotePair(segment: string): string {
  return segment.length >= 2 && QUOTES.has(segment[0]) && segment[0] === segment[segment.length - 1]
    ? segment.slice(1, -1)
    : segment;
}

// Best-effort: an unterminated quote yields whatever accumulated (the string API
// does not suppress).
export function splitFieldPath(raw: string): string[] {
  return scanSegments(raw).segments;
}

// Split honoring quotes, strip one quote pair per segment, rejoin on `.` — so
// `` `a.b` `` → `a.b` and `'years'` → `years`.
export function normalizeFieldPath(raw: string): string {
  return splitFieldPath(raw).map(stripOneQuotePair).join('.');
}

// Leading segment before the first unquoted dot, or null for a single segment.
// Quote-aware, so `` `a.b`.c `` yields `a.b`. Used to match a dotted reference's
// prefix against join aliases.
export function fieldPathPrefix(raw: string): string | null {
  const segments = splitFieldPath(raw);
  if (segments.length < 2) {
    return null;
  }
  return stripOneQuotePair(segments[0]);
}

export interface ParsedFieldPath {
  segments: string[];
  /** `segments.join('.')` — the canonical dotted lookup key. */
  canonical: string;
}

// Returns undefined on an unbalanced quote so callers can suppress rather than
// guess. Uses the same scan as splitFieldPath, so both sides canonicalize alike.
export function parseFieldPath(raw: string): ParsedFieldPath | undefined {
  const { segments: rawSegments, balanced } = scanSegments(raw);
  if (!balanced) {
    return undefined;
  }
  const segments = rawSegments.map(stripOneQuotePair);
  return { segments, canonical: segments.join('.') };
}

// Canonical name, falling back to raw text on malformed input. Callers that must
// suppress on malformed input should use parseFieldPath and check for undefined.
export function normalizeFieldName(raw: string): string {
  return parseFieldPath(raw)?.canonical ?? raw;
}

export interface TypedPrefix {
  path: string;
  type: string;
}

// Longest prefix of `segments` with a typeMap entry, full path first: for
// `outer.inner.deep`, `outer.inner` wins over `outer`. Only flat-object-subfield
// uses this; exact-lookup rules must not inherit an ancestor's type.
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
