/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, ParserRuleContext, TerminalNode } from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';
import { flatObjectSubfieldDetector } from '../flat_object_subfield';
import { createCompiledRuleNameToIndex } from '../../rule_index';
import type { CatalogEntry, LintRunContext } from '../../types';

// Engine ground truth (see flat_object_subfield.ts header): a flat_object field
// cannot be referenced in a PPL expression at all — neither the bare root nor a
// dotted subfield — so this error-severity rule flags any reference whose LONGEST
// typed prefix is a flat_object. It self-suppresses without a typeMap and offers
// no quick-fix (there is no valid rewrite target).
//
// Pattern A exercises the real bundled catalog + registry + runner through
// PPLLanguageAnalyzer.lint (proving catalog wiring, needsContext gating, and the
// grammar surface). Pattern B calls the detector directly with a SENTINEL message
// to prove the emitted message flows from config, and drives a synthetic tree for
// the dedup path that no natural query produces.

describe('flat-object-subfield (compiled surface)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  // attributes is a flat_object; attributes.http is a separately-typed keyword
  // (so the longest-prefix logic must treat it as a real queryable field); name
  // is a plain text field.
  const ctx: LintRunContext = {
    typeMap: new Map([
      ['attributes', 'flat_object'],
      ['attributes.http', 'keyword'],
      ['name', 'text'],
    ]),
  };
  const flatOnly: LintRunContext = { typeMap: new Map([['attributes', 'flat_object']]) };

  const ids = (code: string, c?: LintRunContext) =>
    analyzer.lint(code, c).diagnostics.map((d) => d.ruleId);
  const flatDiags = (code: string, c?: LintRunContext) =>
    analyzer.lint(code, c).diagnostics.filter((d) => d.ruleId === 'flat-object-subfield');

  it('flags a bare root reference to a flat_object field', () =>
    expect(ids('search t | fields attributes', flatOnly)).toContain('flat-object-subfield'));

  it('flags a dotted child of a flat_object field', () =>
    expect(ids('search t | fields attributes.http.method', flatOnly)).toContain(
      'flat-object-subfield'
    ));

  it('flags a flat_object reference in a where clause (qualifiedName surface)', () =>
    expect(ids('search t | where attributes = 1', flatOnly)).toContain('flat-object-subfield'));

  it('flags a backtick-quoted root reference `attributes`.http', () =>
    expect(ids('search t | fields `attributes`.http', flatOnly)).toContain('flat-object-subfield'));

  describe('longest typed prefix', () => {
    it('does NOT flag attributes.http.method when attributes.http is a real keyword field', () =>
      expect(ids('search t | fields attributes.http.method', ctx)).not.toContain(
        'flat-object-subfield'
      ));

    it('DOES flag attributes.other where the longest typed prefix is the flat_object root', () =>
      expect(ids('search t | fields attributes.other', ctx)).toContain('flat-object-subfield'));
  });

  it('does NOT flag a non-flat path (name is text)', () =>
    expect(ids('search t | fields name', ctx)).not.toContain('flat-object-subfield'));

  it('self-suppresses when no typeMap is provided', () =>
    expect(ids('search t | fields attributes.http.method')).not.toContain('flat-object-subfield'));

  it('self-suppresses on an empty typeMap', () =>
    expect(ids('search t | fields attributes.http.method', { typeMap: new Map() })).not.toContain(
      'flat-object-subfield'
    ));

  describe('diagnostic shape', () => {
    it('reports hoverFacts {field, root, esType} and offers NO fix', () => {
      const diags = flatDiags('search t | fields attributes.http.method', flatOnly);
      expect(diags).toHaveLength(1);
      expect(diags[0].severity).toBe('error');
      expect(diags[0].hoverFacts).toEqual({
        field: 'attributes.http.method',
        root: 'attributes',
        esType: 'flat_object',
      });
      expect(diags[0].fix).toBeUndefined();
    });

    it('sets root to the matched typed prefix, not the leaf, for a bare root reference', () => {
      const diags = flatDiags('search t | fields attributes', flatOnly);
      expect(diags).toHaveLength(1);
      expect(diags[0].hoverFacts).toEqual({
        field: 'attributes',
        root: 'attributes',
        esType: 'flat_object',
      });
    });
  });
});

// Pattern B — direct detector call with a SENTINEL config so the assertion proves
// diagnostic.message === config.message (not a hardcoded literal), plus a
// synthetic tree for the multi-rule-name dedup path.
describe('flat-object-subfield (detector unit + sentinel message)', () => {
  const ruleNameToIndex = createCompiledRuleNameToIndex();
  const SENTINEL = 'SENTINEL_CATALOG_MESSAGE_DO_NOT_MATCH_REAL';
  const config: CatalogEntry = {
    id: 'flat-object-subfield',
    detector: 'flat-object-subfield',
    enabled: true,
    severity: 'error',
    message: SENTINEL,
    docUrl: 'https://x',
    appliesTo: {},
  };
  const ctx: LintRunContext = { typeMap: new Map([['attributes', 'flat_object']]) };

  function buildTree(query: string): ParserRuleContext {
    const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(query));
    lexer.removeErrorListeners();
    const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
    parser.removeErrorListeners();
    return parser.root();
  }

  it('emits config.message (SENTINEL), the configured id/severity/docUrl, and no fix', () => {
    const diags = flatObjectSubfieldDetector(
      buildTree('search t | fields attributes.http'),
      config,
      ctx,
      ruleNameToIndex
    );
    expect(diags).toHaveLength(1);
    expect(diags[0].message).toBe(SENTINEL);
    expect(diags[0].ruleId).toBe('flat-object-subfield');
    expect(diags[0].severity).toBe('error');
    expect(diags[0].docUrl).toBe('https://x');
    expect(diags[0].fix).toBeUndefined();
  });

  it('self-suppresses (returns []) when the typeMap is empty', () => {
    const diags = flatObjectSubfieldDetector(
      buildTree('search t | fields attributes.http'),
      config,
      { typeMap: new Map() },
      ruleNameToIndex
    );
    expect(diags).toEqual([]);
  });

  // Dedup: the same source reference reachable via more than one dotted-path rule
  // name (qualifiedName AND wcQualifiedName) at the same start offset is reported
  // once. No natural query produces this overlap, so build the shape directly with
  // the compiled rule indices.
  it('reports a reference reachable via two rule names exactly once', () => {
    const QUALIFIED_NAME = SimplifiedOpenSearchPPLParser.ruleNames.indexOf('qualifiedName');
    const WC_QUALIFIED_NAME = SimplifiedOpenSearchPPLParser.ruleNames.indexOf('wcQualifiedName');

    const makeTerminal = (text: string): TerminalNode =>
      ({
        symbol: { start: 0, stop: text.length - 1, line: 1, column: 0 },
        getText: () => text,
      }) as unknown as TerminalNode;

    // Two distinct rule nodes for the same source position (start.start === 5) —
    // dedup keys on that offset.
    const makeRef = (ruleIndex: number, text: string, start: number): ParserRuleContext =>
      ({
        ruleIndex,
        children: [makeTerminal(text)],
        start: { start, stop: start, line: 1, column: 0 },
        stop: { start, stop: start, line: 1, column: 0 },
        getText: () => text,
      }) as unknown as ParserRuleContext;

    const root = {
      ruleIndex: 0,
      children: [
        makeRef(QUALIFIED_NAME, 'attributes', 5),
        makeRef(WC_QUALIFIED_NAME, 'attributes', 5),
      ],
      start: { start: 0, stop: 0, line: 1, column: 0 },
      stop: { start: 0, stop: 0, line: 1, column: 20 },
      getText: () => '',
    } as unknown as ParserRuleContext;

    const diags = flatObjectSubfieldDetector(root, config, ctx, ruleNameToIndex);
    expect(diags).toHaveLength(1);
    expect(diags[0].hoverFacts).toEqual({
      field: 'attributes',
      root: 'attributes',
      esType: 'flat_object',
    });
  });
});
