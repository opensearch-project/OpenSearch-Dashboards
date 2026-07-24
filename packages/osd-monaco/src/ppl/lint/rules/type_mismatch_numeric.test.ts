/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { PPLLanguageAnalyzer } from '../../ppl_language_analyzer';
import { typeMismatchNumericDetector } from './type_mismatch_numeric';
import { createCompiledRuleNameToIndex } from '../rule_index';
import type { CatalogEntry, LintRunContext } from '../types';

// Plan §9 "Numeric mismatch": comparing a numeric field to a NON-coercible
// string literal (e.g. `age = "thirty"`) silently matches 0 rows on the engine.
// The detector fires only on the narrow bare-field-vs-bare-string-literal
// equality form (`=`/`==`), self-suppresses without a typeMap, and lets the
// engine's own coercion of quoted numeric strings (e.g. "32") pass unflagged.

const RULE_ID = 'type-mismatch-numeric';

// Numeric field `age` (long), numeric field `price` (double), non-numeric
// `name` (text). Coercibility keys off the ES type, not the value.
const typeMap = new Map<string, string>([
  ['age', 'long'],
  ['price', 'double'],
  ['name', 'text'],
  ['wordcount', 'token_count'],
]);
const ctx: LintRunContext = { typeMap };

// --- Pattern A: end-to-end through the analyzer (real bundled catalog) --------

describe('type-mismatch-numeric (compiled surface, analyzer path)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });
  const ids = (code: string, c?: LintRunContext) =>
    analyzer.lint(code, c).diagnostics.map((d) => d.ruleId);

  describe('flags a numeric field compared to a non-coercible string literal', () => {
    it('numeric field = "thirty"', () =>
      expect(ids('search t | where age = "thirty"', ctx)).toContain(RULE_ID));

    it('flags the reversed operand order "thirty" = age', () =>
      expect(ids('search t | where "thirty" = age', ctx)).toContain(RULE_ID));

    it('flags the == operator', () =>
      expect(ids('search t | where age == "thirty"', ctx)).toContain(RULE_ID));

    it('flags a double field too', () =>
      expect(ids('search t | where price = "cheap"', ctx)).toContain(RULE_ID));

    it('flags a token_count field (numeric per OSD_FIELD_TYPES.NUMBER)', () =>
      expect(ids('search t | where wordcount = "many"', ctx)).toContain(RULE_ID));
  });

  describe('does NOT flag coercible / non-numeric / unknown cases', () => {
    it('coercible quoted integer age = "32"', () =>
      expect(ids('search t | where age = "32"', ctx)).not.toContain(RULE_ID));

    it('coercible quoted decimal against a double field price = "3.14"', () =>
      expect(ids('search t | where price = "3.14"', ctx)).not.toContain(RULE_ID));

    it('non-numeric (text) field name = "thirty"', () =>
      expect(ids('search t | where name = "thirty"', ctx)).not.toContain(RULE_ID));

    it('unknown field (absent from typeMap)', () =>
      expect(ids('search t | where mystery = "thirty"', ctx)).not.toContain(RULE_ID));
  });

  describe('does NOT flag operators outside the verified set', () => {
    it('!= is deferred/excluded', () =>
      expect(ids('search t | where age != "thirty"', ctx)).not.toContain(RULE_ID));

    it('<> is deferred/excluded', () =>
      expect(ids('search t | where age <> "thirty"', ctx)).not.toContain(RULE_ID));

    it('range operator > is not an equality', () =>
      expect(ids('search t | where age > "thirty"', ctx)).not.toContain(RULE_ID));
  });

  describe('does NOT flag non-literal / non-bare-field operands', () => {
    it('field-to-field comparison age = other', () =>
      expect(ids('search t | where age = other', ctx)).not.toContain(RULE_ID));

    it('computed field operand abs(age) = "thirty"', () =>
      expect(ids('search t | where abs(age) = "thirty"', ctx)).not.toContain(RULE_ID));
  });

  describe('self-suppresses without type metadata', () => {
    it('no context at all', () =>
      expect(ids('search t | where age = "thirty"')).not.toContain(RULE_ID));

    it('empty typeMap', () =>
      expect(
        ids('search t | where age = "thirty"', { typeMap: new Map<string, string>() })
      ).not.toContain(RULE_ID));
  });
});

// --- Pattern B: direct detector call with a SENTINEL config -------------------
// Proves message flows from config.message (not a hardcoded string) and that the
// detector attaches the {field, esType, literal} hover facts.

function buildTree(query: string): ParserRuleContext {
  const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(query));
  lexer.removeErrorListeners();
  const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
  parser.removeErrorListeners();
  return parser.root();
}

const ruleNameToIndex = createCompiledRuleNameToIndex();
const SENTINEL = 'SENTINEL_CATALOG_MESSAGE_DO_NOT_MATCH_REAL';
const config: CatalogEntry = {
  id: RULE_ID,
  detector: RULE_ID,
  enabled: true,
  severity: 'warning',
  message: SENTINEL,
  docUrl: 'https://x',
  appliesTo: {},
};

describe('type-mismatch-numeric (direct detector, sentinel config)', () => {
  it('emits config.message, config.severity, and {field, esType, literal} hover facts', () => {
    const diags = typeMismatchNumericDetector(
      buildTree('search t | where age = "thirty"'),
      config,
      ctx,
      ruleNameToIndex
    );
    expect(diags).toHaveLength(1);
    expect(diags[0].ruleId).toBe(RULE_ID);
    expect(diags[0].severity).toBe('warning');
    // Message is the sentinel, proving it flows from config rather than a literal.
    expect(diags[0].message).toBe(SENTINEL);
    expect(diags[0].hoverFacts).toEqual({ field: 'age', esType: 'long', literal: '"thirty"' });
  });

  it('self-suppresses (returns []) when the typeMap is empty', () => {
    const diags = typeMismatchNumericDetector(
      buildTree('search t | where age = "thirty"'),
      config,
      { typeMap: new Map<string, string>() },
      ruleNameToIndex
    );
    expect(diags).toEqual([]);
  });
});
