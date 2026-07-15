/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { expandOnNonArrayDetector } from '../expand_on_non_array';
import { createCompiledRuleNameToIndex } from '../../rule_index';
import { runLint } from '../../lint_runner';
import { getBundledCatalog } from '../../catalog';
import { CatalogEntry, LintRunContext } from '../../types';
import { Diagnostic } from '../../diagnostic';

// `expand-on-non-array` ships DISABLED in the catalog (#5065): the mapping never
// records primitive-array cardinality, so the only array-like evidence is a
// `nested`/`object` type. These tests prove (a) the detector's per-field logic
// against a SENTINEL config so the message is shown to flow from config, and
// (b) the product path — the runner suppresses it by default and fires it only
// when the catalog entry is overridden `enabled:true`.

const ruleNameToIndex = createCompiledRuleNameToIndex();

function buildTree(query: string): ParserRuleContext {
  const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(query));
  lexer.removeErrorListeners();
  const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
  parser.removeErrorListeners();
  return parser.root();
}

const SENTINEL = 'SENTINEL_CATALOG_MESSAGE_DO_NOT_MATCH_REAL';
const DOC_URL = 'https://example.test/expand';
const config: CatalogEntry = {
  id: 'expand-on-non-array',
  detector: 'expand-on-non-array',
  enabled: true,
  severity: 'warning',
  message: SENTINEL,
  docUrl: DOC_URL,
  appliesTo: {},
};

function expandDiagnostics(query: string, context: LintRunContext): Diagnostic[] {
  return expandOnNonArrayDetector(buildTree(query), config, context, ruleNameToIndex);
}

const typed = (entries: Array<[string, string]>): LintRunContext => ({
  typeMap: new Map(entries),
});

describe('expand-on-non-array (compiled-simplified surface, direct detector)', () => {
  describe('flags a scalar (non-array-like) expand target', () => {
    it('flags a keyword field and reports message/severity/docUrl from config', () => {
      const diags = expandDiagnostics('search t | expand foo', typed([['foo', 'keyword']]));
      expect(diags).toHaveLength(1);
      expect(diags[0].ruleId).toBe('expand-on-non-array');
      expect(diags[0].severity).toBe('warning');
      // Message flows from the catalog entry, not a hardcoded literal.
      expect(diags[0].message).toBe(SENTINEL);
      expect(diags[0].docUrl).toBe(DOC_URL);
      expect(diags[0].hoverFacts).toEqual({ field: 'foo', esType: 'keyword' });
    });

    it('flags a numeric (long) field', () => {
      const diags = expandDiagnostics('search t | expand foo', typed([['foo', 'long']]));
      expect(diags).toHaveLength(1);
      expect(diags[0].hoverFacts).toEqual({ field: 'foo', esType: 'long' });
    });
  });

  describe('does NOT flag array-like or unknown targets', () => {
    it('does not flag a nested field', () => {
      expect(expandDiagnostics('search t | expand foo', typed([['foo', 'nested']]))).toEqual([]);
    });

    it('does not flag an object field', () => {
      expect(expandDiagnostics('search t | expand foo', typed([['foo', 'object']]))).toEqual([]);
    });

    it('does not flag a field absent from the typeMap (unknown type)', () => {
      // typeMap is non-empty (so the rule does not self-suppress) but lacks `foo`.
      expect(expandDiagnostics('search t | expand foo', typed([['bar', 'keyword']]))).toEqual([]);
    });
  });

  describe('self-suppresses without type metadata', () => {
    it('returns nothing when the typeMap is absent', () => {
      expect(expandDiagnostics('search t | expand foo', {})).toEqual([]);
    });

    it('returns nothing when the typeMap is empty', () => {
      expect(expandDiagnostics('search t | expand foo', { typeMap: new Map() })).toEqual([]);
    });
  });
});

describe('expand-on-non-array (product path: catalog + registry + runLint)', () => {
  const runIds = (
    query: string,
    context: LintRunContext,
    bundleOverrides?: Record<string, Partial<CatalogEntry>>
  ): string[] =>
    runLint(buildTree(query), {
      catalog: getBundledCatalog(),
      ruleNameToIndex,
      context,
      bundleOverrides,
    }).map((d) => d.ruleId);

  it('is suppressed by default (catalog enabled:false) even for a scalar expand target', () => {
    // A scalar keyword target WOULD fire if the rule were enabled; the disabled
    // catalog entry keeps it out of the product-path output.
    expect(runIds('search t | expand foo', typed([['foo', 'keyword']]))).not.toContain(
      'expand-on-non-array'
    );
  });

  it('fires through the runner when the catalog entry is overridden enabled:true', () => {
    const diags = runLint(buildTree('search t | expand foo'), {
      catalog: getBundledCatalog(),
      ruleNameToIndex,
      context: typed([['foo', 'keyword']]),
      bundleOverrides: { 'expand-on-non-array': { enabled: true } },
    });
    const hit = diags.find((d) => d.ruleId === 'expand-on-non-array');
    expect(hit).toBeDefined();
    // The message is the real catalog text (flows through mergeConfig), and the
    // per-instance facts survive the runner.
    const catalogMessage = getBundledCatalog().find((e) => e.id === 'expand-on-non-array')?.message;
    expect(hit?.message).toBe(catalogMessage);
    expect(hit?.hoverFacts).toEqual({ field: 'foo', esType: 'keyword' });
  });

  it('stays suppressed when overridden enabled:true but the typeMap is empty (needsContext)', () => {
    expect(
      runIds(
        'search t | expand foo',
        { typeMap: new Map() },
        {
          'expand-on-non-array': { enabled: true },
        }
      )
    ).not.toContain('expand-on-non-array');
  });
});
