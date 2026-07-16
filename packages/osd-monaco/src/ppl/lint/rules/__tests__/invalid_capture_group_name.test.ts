/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';
import { invalidCaptureGroupNameDetector } from '../invalid_capture_group_name';
import { createCompiledRuleNameToIndex } from '../../rule_index';
import type { CatalogEntry, LintRunContext } from '../../types';
import type { Diagnostic } from '../../diagnostic';

const RULE = 'invalid-capture-group-name';

// A backslash in a TS string literal must be doubled: '\\d' below produces the
// two characters `\d` in the query text the lexer sees.

// --------------------------------------------------------------------------
// Pattern A — end-to-end through the analyzer against the REAL bundled catalog.
// Proves the rule is registered, enabled, and wired for parse/grok/rex on the
// compiled-simplified surface. The rule ships enabled with severity `error`.
// --------------------------------------------------------------------------
describe('invalid-capture-group-name (compiled surface, real catalog)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  const captureDiags = (code: string, ctx?: LintRunContext): Diagnostic[] =>
    analyzer.lint(code, ctx).diagnostics.filter((d) => d.ruleId === RULE);
  const flagged = (code: string): boolean => captureDiags(code).length > 0;

  describe('valid Java named groups are NOT flagged', () => {
    it('parse (?<year>...)', () =>
      expect(flagged('search t | parse body "(?<year>\\d+)"')).toBe(false));
    it('grok (?<year>...)', () =>
      expect(flagged('search t | grok body "(?<year>\\d+)"')).toBe(false));
    it('rex field= (?<year>...)', () =>
      expect(flagged('search t | rex field=body "(?<year>\\d+)"')).toBe(false));
  });

  describe('the same invalid group is flagged in parse AND grok AND rex', () => {
    it('parse (?<1year>...)', () =>
      expect(flagged('search t | parse body "(?<1year>\\d+)"')).toBe(true));
    it('grok (?<1year>...)', () =>
      expect(flagged('search t | grok body "(?<1year>\\d+)"')).toBe(true));
    it('rex field= (?<1year>...)', () =>
      expect(flagged('search t | rex field=body "(?<1year>\\d+)"')).toBe(true));
  });

  it('flags a name with invalid characters (?<year-1>) at severity error', () => {
    const diags = captureDiags('search t | parse body "(?<year-1>x)"');
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe('error');
    expect(diags[0].hoverFacts?.literal).toBe('(?<year-1>');
  });

  it('flags a leading-digit name (?<1year>) and offers a sanitized fix', () => {
    const diags = captureDiags('search t | grok body "(?<1year>x)"');
    expect(diags).toHaveLength(1);
    expect(diags[0].hoverFacts?.literal).toBe('(?<1year>');
    // Leading digits are stripped, leaving a Java-valid name.
    expect(diags[0].fix?.text).toBe('year');
  });

  it('flags an empty name (?<>) with NO fix', () => {
    const diags = captureDiags('search t | parse body "(?<>x)"');
    expect(diags).toHaveLength(1);
    expect(diags[0].hoverFacts?.literal).toBe('(?<>');
    expect(diags[0].fix).toBeUndefined();
  });

  it('flags the Python (?P<year>) opener with a fix even though the name is valid', () => {
    const diags = captureDiags('search t | rex field=body "(?P<year>\\d+)"');
    expect(diags).toHaveLength(1);
    expect(diags[0].hoverFacts?.literal).toBe('(?P<year>');
    // The fix deletes the single `P`; its replacement text is empty.
    expect(diags[0].fix).toBeDefined();
    expect(diags[0].fix?.text).toBe('');
  });

  describe('lookbehind assertions are NOT capture groups (regression on the (?![=!]) fix)', () => {
    it('positive lookbehind (?<=foo)', () =>
      expect(flagged('search t | parse body "(?<=foo)bar"')).toBe(false));
    it('negative lookbehind (?<!foo)', () =>
      expect(flagged('search t | parse body "(?<!foo)bar"')).toBe(false));
  });

  it('flags every bad group when several appear in one pattern', () => {
    const diags = captureDiags('search t | parse body "(?<1a>x)(?<2b>y)"');
    expect(diags).toHaveLength(2);
  });

  it('flags only the bad group when a valid and an invalid group share a pattern', () => {
    const diags = captureDiags('search t | grok body "(?<good>x)(?<2bad>y)"');
    expect(diags).toHaveLength(1);
    expect(diags[0].hoverFacts?.literal).toBe('(?<2bad>');
  });
});

// --------------------------------------------------------------------------
// Pattern B — direct detector call with a SENTINEL config. Proves the message,
// severity, hoverFacts, fix, and highlight range all flow from the detector's
// per-instance computation and the passed config, not hardcoded literals.
// --------------------------------------------------------------------------
describe('invalidCaptureGroupNameDetector (direct, sentinel config)', () => {
  const ruleNameToIndex = createCompiledRuleNameToIndex();
  const SENTINEL = 'SENTINEL_CATALOG_MESSAGE_DO_NOT_MATCH_REAL';
  const config: CatalogEntry = {
    id: RULE,
    detector: RULE,
    enabled: true,
    severity: 'warning',
    message: SENTINEL,
    docUrl: 'https://x',
    appliesTo: {},
  };

  function buildTree(query: string): ParserRuleContext {
    const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(query));
    lexer.removeErrorListeners();
    const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
    parser.removeErrorListeners();
    return parser.root();
  }

  const detect = (query: string): Diagnostic[] =>
    invalidCaptureGroupNameDetector(buildTree(query), config, {}, ruleNameToIndex);

  it('emits message and severity from the config, not a literal', () => {
    const diags = detect('search t | parse body "(?<1yr>x)"');
    expect(diags).toHaveLength(1);
    expect(diags[0].message).toBe(SENTINEL);
    expect(diags[0].severity).toBe('warning');
    expect(diags[0].ruleId).toBe(RULE);
    expect(diags[0].docUrl).toBe('https://x');
  });

  it('highlights the exact name span within the literal token', () => {
    const query = 'search t | parse body "(?<1yr>x)"';
    const diags = detect(query);
    expect(diags).toHaveLength(1);
    const range = diags[0].range;
    // Opening quote column; the name follows `"(?<`.
    const quoteCol = query.indexOf('"');
    const expectedStart = quoteCol + '"(?<'.length;
    expect(range.startLine).toBe(1);
    expect(range.endLine).toBe(1);
    expect(range.startColumn).toBe(expectedStart);
    expect(range.endColumn).toBe(expectedStart + '1yr'.length);
    // And it stays inside the quoted literal.
    const literalEndCol = quoteCol + query.slice(quoteCol).indexOf('"', 1) + 1;
    expect(range.startColumn).toBeGreaterThan(quoteCol);
    expect(range.endColumn).toBeLessThan(literalEndCol);
  });

  it('carries the opener+name in hoverFacts.literal for an invalid name', () => {
    const diags = detect('search t | grok body "(?<year-1>x)"');
    expect(diags).toHaveLength(1);
    expect(diags[0].hoverFacts?.literal).toBe('(?<year-1>');
    expect(diags[0].fix?.text).toBe('year1');
  });

  it('offers a Python-opener fix that targets the single `P`, distinct from the squiggle', () => {
    const diags = detect('search t | rex field=body "(?P<year>x)"');
    expect(diags).toHaveLength(1);
    expect(diags[0].hoverFacts?.literal).toBe('(?P<year>');
    const fixRange = diags[0].fix?.range;
    expect(diags[0].fix?.text).toBe('');
    // The fix has its own range (the `P`) spanning exactly one character, and it
    // sits before the squiggled name.
    expect(fixRange).toBeDefined();
    expect((fixRange?.endColumn ?? 0) - (fixRange?.startColumn ?? 0)).toBe(1);
    expect(fixRange?.startColumn ?? 0).toBeLessThan(diags[0].range.startColumn);
  });

  it('offers no fix for an empty name and highlights the `<>` pair', () => {
    const query = 'search t | parse body "(?<>x)"';
    const diags = detect(query);
    expect(diags).toHaveLength(1);
    expect(diags[0].hoverFacts?.literal).toBe('(?<>');
    expect(diags[0].fix).toBeUndefined();
    // Empty name has no name span, so the `<>` pair (length 2) is highlighted.
    expect(diags[0].range.endColumn - diags[0].range.startColumn).toBe(2);
  });

  it('does not flag lookbehind openers', () => {
    expect(detect('search t | parse body "(?<=foo)bar"')).toEqual([]);
    expect(detect('search t | parse body "(?<!foo)bar"')).toEqual([]);
  });

  it('reports one diagnostic per bad group in a multi-group pattern', () => {
    const diags = detect('search t | grok body "(?<1a>x)(?P<2b>y)"');
    expect(diags).toHaveLength(2);
    expect(diags.map((d) => d.hoverFacts?.literal).sort()).toEqual(['(?<1a>', '(?P<2b>']);
    // Every diagnostic carries the sentinel message.
    expect(diags.every((d) => d.message === SENTINEL)).toBe(true);
  });
});
