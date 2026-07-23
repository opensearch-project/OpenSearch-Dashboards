/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { PPLLanguageAnalyzer } from '../../ppl_language_analyzer';
import { aggOnTextDetector } from './agg_on_text';
import { createCompiledRuleNameToIndex } from '../rule_index';
import type { CatalogEntry, LintRunContext } from '../types';

// agg-on-text (design doc §9 "Aggregations"): a numeric aggregation
// (avg/sum/median/var_*/stddev_*) on a `text`/`keyword` field silently returns
// null on the engine. The rule needs field type metadata, so it self-suppresses
// without a typeMap. `count`/`min`/`max` are type-agnostic and excluded;
// `percentile` parses through its own alternative and never reaches the rule.

// Type metadata for the field names used across the query fixtures.
const ctx: LintRunContext = {
  fields: new Set(['name', 'tag', 'age', 'balance']),
  typeMap: new Map<string, string>([
    ['name', 'text'],
    ['tag', 'keyword'],
    ['age', 'long'],
    ['balance', 'double'],
  ]),
};

describe('agg-on-text (compiled surface, Pattern A)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  const ids = (code: string, c?: LintRunContext) =>
    analyzer.lint(code, c).diagnostics.map((d) => d.ruleId);
  const diags = (code: string, c?: LintRunContext) => analyzer.lint(code, c).diagnostics;

  describe('flags numeric-only aggregations on text/keyword fields', () => {
    it.each(['avg', 'sum', 'median', 'var_samp', 'stddev_pop'])(
      'flags %s() on a text field',
      (agg) => {
        expect(ids(`search t | stats ${agg}(name)`, ctx)).toContain('agg-on-text');
      }
    );

    it('flags avg() on a keyword field (keyword is treated as text)', () => {
      expect(ids('search t | stats avg(tag)', ctx)).toContain('agg-on-text');
    });
  });

  describe('does not flag numeric aggregations on numeric fields', () => {
    it('does not flag avg() on a long field', () => {
      expect(ids('search t | stats avg(age)', ctx)).not.toContain('agg-on-text');
    });

    it('does not flag sum() on a double field', () => {
      expect(ids('search t | stats sum(balance)', ctx)).not.toContain('agg-on-text');
    });
  });

  describe('excludes type-agnostic and dedicated-shape aggregations', () => {
    it('does not flag count() on a text field', () => {
      expect(ids('search t | stats count(name)', ctx)).not.toContain('agg-on-text');
    });

    it('does not flag min() on a text field', () => {
      expect(ids('search t | stats min(name)', ctx)).not.toContain('agg-on-text');
    });

    it('does not flag max() on a text field', () => {
      expect(ids('search t | stats max(name)', ctx)).not.toContain('agg-on-text');
    });

    it('does not flag percentile() on a text field (routes through its own alternative)', () => {
      expect(ids('search t | stats percentile(name, 95)', ctx)).not.toContain('agg-on-text');
    });
  });

  describe('self-suppresses without type metadata', () => {
    it('emits no agg-on-text with no lint context', () => {
      expect(ids('search t | stats avg(name)')).not.toContain('agg-on-text');
    });

    it('emits no agg-on-text with an empty typeMap', () => {
      expect(
        ids('search t | stats avg(name)', { typeMap: new Map<string, string>() })
      ).not.toContain('agg-on-text');
    });
  });

  describe('leaves computed aggregation arguments alone', () => {
    it('does not flag avg(balance / 2)', () => {
      expect(ids('search t | stats avg(balance / 2)', ctx)).not.toContain('agg-on-text');
    });

    // A computed argument over a text field is still skipped: the rule only fires
    // on a single bare field, not an expression that merely contains one.
    it('does not flag avg(name / 2) even though name is text', () => {
      expect(ids('search t | stats avg(name / 2)', ctx)).not.toContain('agg-on-text');
    });
  });

  describe('per-instance hover facts', () => {
    it('records { field, esType, aggName } on the diagnostic', () => {
      const finding = diags('search t | stats avg(name)', ctx).find(
        (d) => d.ruleId === 'agg-on-text'
      );
      expect(finding).toBeDefined();
      expect(finding?.hoverFacts).toEqual({ field: 'name', esType: 'text', aggName: 'avg' });
    });
  });
});

// Pattern B — call the detector directly with a sentinel config to prove the
// diagnostic message flows from `config.message`, not a hardcoded literal.
describe('agg-on-text (direct detector, sentinel config, Pattern B)', () => {
  const ruleNameToIndex = createCompiledRuleNameToIndex();
  const SENTINEL = 'SENTINEL_CATALOG_MESSAGE_DO_NOT_MATCH_REAL';
  const config: CatalogEntry = {
    id: 'agg-on-text',
    detector: 'agg-on-text',
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

  it('emits the configured message and carries hover facts', () => {
    const context: LintRunContext = { typeMap: new Map([['name', 'text']]) };
    const found = aggOnTextDetector(
      buildTree('source=t | stats avg(name)'),
      config,
      context,
      ruleNameToIndex
    );
    expect(found).toHaveLength(1);
    expect(found[0].message).toBe(SENTINEL);
    expect(found[0].severity).toBe('warning');
    expect(found[0].hoverFacts).toEqual({ field: 'name', esType: 'text', aggName: 'avg' });
  });

  it('self-suppresses when the typeMap is absent', () => {
    const found = aggOnTextDetector(
      buildTree('source=t | stats avg(name)'),
      config,
      {},
      ruleNameToIndex
    );
    expect(found).toEqual([]);
  });
});
