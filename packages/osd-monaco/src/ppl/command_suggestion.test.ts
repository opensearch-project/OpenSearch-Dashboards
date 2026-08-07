/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from './ppl_language_analyzer';
import {
  buildCommandSuggestion,
  damerauLevenshtein,
  suggestCommand,
  PPL_COMMAND_KEYWORDS,
} from './command_suggestion';

describe('damerauLevenshtein', () => {
  it('is zero for identical strings', () => {
    expect(damerauLevenshtein('where', 'where', 2)).toBe(0);
  });

  it('counts a single substitution as one edit', () => {
    expect(damerauLevenshtein('whare', 'where', 2)).toBe(1);
  });

  it('counts an adjacent transposition as ONE edit (OSA, not plain Levenshtein)', () => {
    // `fiedls` -> `fields` is a transposition: 1 under OSA, 2 under plain.
    expect(damerauLevenshtein('fiedls', 'fields', 2)).toBe(1);
  });

  it('returns length for an empty operand', () => {
    expect(damerauLevenshtein('', 'where', 5)).toBe(5);
    expect(damerauLevenshtein('where', '', 5)).toBe(5);
  });

  it('aborts early past the threshold with a value > maxDistance', () => {
    expect(damerauLevenshtein('zzzzzzzz', 'where', 1)).toBeGreaterThan(1);
  });
});

describe('suggestCommand', () => {
  const commands = [...PPL_COMMAND_KEYWORDS.values()];

  it('maps a one-edit typo to the nearest command', () => {
    expect(suggestCommand('wherre', commands)).toBe('where');
    expect(suggestCommand('hed', commands)).toBe('head');
    expect(suggestCommand('evaal', commands)).toBe('eval');
  });

  it('catches a transposition typo', () => {
    expect(suggestCommand('fiedls', commands)).toBe('fields');
  });

  it('returns undefined for garbage with no close command', () => {
    expect(suggestCommand('zzzzzzzz', commands)).toBeUndefined();
  });

  it('allows distance 2 for longer command names', () => {
    // `eventstats` (>= 8 chars) tolerates two edits.
    expect(suggestCommand('evenstat', commands)).toBe('eventstats');
  });

  it('does NOT suggest for a token no longer than the edit threshold', () => {
    // A 1-char token is distance 1 from any 2-char command (`ad`, `ml`), but
    // rewriting the whole token is a guess, not a typo correction.
    expect(suggestCommand('a', ['ad', 'ml', 'where'])).toBeUndefined();
  });

  it('still suggests for a genuine 2-char typo (longer than threshold)', () => {
    expect(suggestCommand('ae', ['ad', 'ml'])).toBe('ad');
  });
});

// End-to-end on the compiled (simplified-grammar) path via the real parser.
describe('buildCommandSuggestion via PPLLanguageAnalyzer.validate (compiled path)', () => {
  const analyzer = new PPLLanguageAnalyzer();
  const firstError = (query: string) => analyzer.validate(query).errors[0];

  it('suggests "where" for a misspelled command and attaches a fix', () => {
    const err = firstError('source=logs | wherre a > 1');
    expect(err.code).toBe('UNKNOWN_COMMAND'); // stable identity
    expect(err.fix?.text).toBe('where'); // actionable correction
    expect(err.message).toContain('where'); // prose: substring, not equality
  });

  it('suggests "head" for "hed"', () => {
    const err = firstError('source=logs | hed 10');
    expect(err.code).toBe('UNKNOWN_COMMAND');
    expect(err.fix?.text).toBe('head');
  });

  it('catches the "fiedls" transposition', () => {
    const err = firstError('source=logs | fiedls a, b');
    expect(err.code).toBe('UNKNOWN_COMMAND');
    expect(err.fix?.text).toBe('fields');
  });

  it("leaves ANTLR's message untouched for unrecognizable garbage", () => {
    const err = firstError('source=logs | zzzzzzzz');
    expect(err?.code).toBeUndefined();
    expect(err?.fix).toBeUndefined();
  });

  it('does not suggest inside a dangling expression (not a command position)', () => {
    const err = firstError('source=logs | where a >');
    expect(err?.code).toBeUndefined();
    expect(err?.fix).toBeUndefined();
  });

  it('does not suggest a command for a single stray character', () => {
    // `| a` is a 1-char token. A distance-1 match to `ad`/`ml` is not a typo, so
    // the structured suggestion stays out of the way and ANTLR's message wins.
    const err = firstError('source=logs | a');
    expect(err?.code).toBeUndefined();
    expect(err?.fix).toBeUndefined();
  });

  it('does not flag a correctly-spelled query', () => {
    expect(analyzer.validate('source=logs | where a > 1').isValid).toBe(true);
  });

  it('does not fire on a lexer-only recognizer (guards isParser)', () => {
    // buildCommandSuggestion bails when the recognizer is not a Parser. A null
    // offending symbol also bails. Exercise the direct guards.
    expect(
      buildCommandSuggestion(
        { vocabulary: { getSymbolicName: () => null } } as unknown as any,
        null,
        null
      )
    ).toBeUndefined();
  });
});
