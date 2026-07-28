/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { decodePatternLiteral, leadingLiteralToken } from '../pattern_literal';

// `findPatternLiteral` needs a parse tree and is exercised end-to-end through the
// analyzer in rex_scan_cost.test.ts / invalid_capture_group_name.test.ts. Here we
// cover the two pure functions that carry the correctness-critical logic: the PPL
// string decode and the leading-literal-token scan.

describe('decodePatternLiteral', () => {
  it('strips a double-quote wrapper', () => {
    expect(decodePatternLiteral('"abc"')).toBe('abc');
  });

  it('strips a single-quote wrapper', () => {
    expect(decodePatternLiteral("'abc'")).toBe('abc');
  });

  it('collapses doubled double-quotes inside a double-quoted literal', () => {
    // Raw source `"""level"":""(?<l>[^""]+)"""` -> regex `"level":"(?<l>[^"]+)"`.
    expect(decodePatternLiteral('"""level"":""(?<l>[^""]+)"""')).toBe('"level":"(?<l>[^"]+)"');
  });

  it('leaves the inner (non-delimiter) quote char untouched', () => {
    // Single-quoted wrapper: the inner double quotes are plain literals.
    expect(decodePatternLiteral(`'"level":"(?<l>[^"]+)"'`)).toBe('"level":"(?<l>[^"]+)"');
  });

  it('collapses doubled single-quotes inside a single-quoted literal', () => {
    expect(decodePatternLiteral("'it''s'")).toBe("it's");
  });

  it('passes backslashes through verbatim (no unescaping)', () => {
    expect(decodePatternLiteral('"\\d{3}"')).toBe('\\d{3}');
    expect(decodePatternLiteral('"a\\.b"')).toBe('a\\.b');
  });

  it('returns input unchanged when not a quoted literal', () => {
    expect(decodePatternLiteral('abc')).toBe('abc');
    expect(decodePatternLiteral('`ident`')).toBe('`ident`');
    expect(decodePatternLiteral('"')).toBe('"');
    expect(decodePatternLiteral('')).toBe('');
  });
});

describe('leadingLiteralToken', () => {
  describe('emits a token for a clean leading literal run', () => {
    it('names an analyzed token from a punctuation-wrapped run', () => {
      expect(leadingLiteralToken('"level":"(?<l>[^"]+)"')).toBe('level');
    });

    it('names the leading word before a group', () => {
      expect(leadingLiteralToken('error(?<r>.*)')).toBe('error');
    });

    it('picks the longest surviving token in the run', () => {
      // `ab` is below the length floor; `message` survives and is longer.
      expect(leadingLiteralToken('ab message (?<x>.*)')).toBe('message');
    });

    it('handles a bare leading word terminated by whitespace', () => {
      expect(leadingLiteralToken('status (?<s>\\d+)')).toBe('status');
    });
  });

  describe('emits nothing when no provably-safe token exists', () => {
    it('bails on a top-level alternation', () => {
      expect(leadingLiteralToken('GET|POST (?<m>.*)')).toBeUndefined();
    });

    it('does not bail on alternation nested inside a group', () => {
      expect(leadingLiteralToken('error(?<x>a|b)')).toBe('error');
    });

    it('bails on a leading inline flag', () => {
      expect(leadingLiteralToken('(?i)abc(?<x>.*)')).toBeUndefined();
    });

    it('bails on a leading anchor', () => {
      expect(leadingLiteralToken('^INFO (?<x>.*)')).toBeUndefined();
    });

    it('bails on a leading metaclass', () => {
      expect(leadingLiteralToken('\\d{3}-(?<c>.*)')).toBeUndefined();
    });

    it('emits nothing for a punctuation-only run (zero analyzer tokens)', () => {
      expect(leadingLiteralToken('://(?<h>[^/]+)')).toBeUndefined();
    });

    it('emits nothing when the only token is below the length floor', () => {
      expect(leadingLiteralToken('id=(?<x>.*)')).toBeUndefined();
    });

    it('emits nothing for a pure-numeric leading token', () => {
      expect(leadingLiteralToken('2026-(?<m>\\d\\d)')).toBeUndefined();
    });

    it('emits nothing for an underscore-glued token', () => {
      // The standard tokenizer keeps `error_code` as one token; slicing to
      // `error` would under-match, so we drop it entirely.
      expect(leadingLiteralToken('error_code=(?<x>.*)')).toBeUndefined();
    });

    it('emits nothing for a non-ASCII leading token', () => {
      expect(leadingLiteralToken('café=(?<x>.*)')).toBeUndefined();
    });

    it('emits nothing for a stopword', () => {
      expect(leadingLiteralToken('with (?<m>.*)')).toBeUndefined();
    });

    it('emits nothing for an empty pattern', () => {
      expect(leadingLiteralToken('')).toBeUndefined();
    });

    it('emits nothing when the pattern starts with a group', () => {
      expect(leadingLiteralToken('(?<x>.*)')).toBeUndefined();
    });

    it("emits nothing for grok's %{...} macro (starts with % then {)", () => {
      // `%` is a literal, then `{` is a metachar terminating the run at `%`,
      // which yields no token — safe by construction.
      expect(leadingLiteralToken('%{IP:client}')).toBeUndefined();
    });
  });
});
