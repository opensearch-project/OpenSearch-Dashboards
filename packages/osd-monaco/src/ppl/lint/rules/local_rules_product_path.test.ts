/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { runLint } from '../lint_runner';
import { getBundledCatalog } from '../catalog';
import { createCompiledRuleNameToIndex } from '../rule_index';
import type { CatalogEntry, LintRunContext } from '../types';

// Product-path test (design doc §9 "Product path") for the local type-aware rules
// that run on the COMPILED-SIMPLIFIED grammar surface. Unlike the per-rule detector
// unit tests (which call a detector directly), this drives each rule through the
// FULL path: real trees from SimplifiedOpenSearchPPLParser, the real bundled
// rules_catalog.json (getBundledCatalog), the real detector registry, and
// runLint()'s gating (enabled / needsContext / runtimeOnly / appliesTo). A
// plumbing regression — a catalog entry disabled or renamed, a detector left
// unregistered, an id/detector-key divergence, or a broken needsContext gate —
// fails here even though the bare-detector unit tests would still pass.
//
// On message assertions: each firing rule's message is compared to the message
// looked up from the real catalog by id. That proves the diagnostic carries the
// catalog's configured text end-to-end. It does NOT by itself prove the detector
// reads `config.message` rather than a hardcoded copy — a hardcoded string equal
// to the catalog value would also pass — so that guarantee is covered separately
// by the detector unit tests, which inject a SENTINEL config.message (e.g.
// rules/__tests__/agg_on_text.test.ts, type_mismatch_numeric.test.ts).

function buildTree(query: string): ParserRuleContext {
  const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(query));
  lexer.removeErrorListeners();
  const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
  parser.removeErrorListeners();
  return parser.root();
}

const ruleNameToIndex = createCompiledRuleNameToIndex();

// The real bundled catalog. Looked up by id so message assertions track the
// shipped text, not a copy pasted into the test.
const catalog: CatalogEntry[] = getBundledCatalog();
const messageFor = (id: string): string => {
  const entry = catalog.find((e) => e.id === id);
  if (!entry) {
    throw new Error(`catalog is missing an entry for "${id}"`);
  }
  return entry.message;
};

// Every rule under test runs on the compiled-simplified surface. `context` adds
// the typeMap (or lack of one) per case.
const run = (query: string, context: Partial<LintRunContext> = {}) =>
  runLint(buildTree(query), {
    catalog: getBundledCatalog(),
    ruleNameToIndex,
    context: { ...context, grammarSurface: 'compiled-simplified' },
  });

const ruleIds = (query: string, context?: Partial<LintRunContext>) =>
  run(query, context).map((d) => d.ruleId);

// A firing query + the typeMap it needs, for each rule that self-suppresses
// without type metadata.
const AGG_QUERY = 'search t | stats avg(name)';
const AGG_TYPES: Partial<LintRunContext> = { typeMap: new Map([['name', 'text']]) };

const FLAT_QUERY = 'search t | fields attributes';
const FLAT_TYPES: Partial<LintRunContext> = { typeMap: new Map([['attributes', 'flat_object']]) };

const MISMATCH_QUERY = 'search t | where age = "thirty"';
const MISMATCH_TYPES: Partial<LintRunContext> = { typeMap: new Map([['age', 'long']]) };

describe('local rules: product-path plumbing (catalog + registry + runLint, compiled-simplified)', () => {
  describe('each enabled rule fires end-to-end with the real catalog message', () => {
    it('agg-on-text fires on a numeric aggregation over a text field', () => {
      const diag = run(AGG_QUERY, AGG_TYPES).find((d) => d.ruleId === 'agg-on-text');
      expect(diag).toBeDefined();
      expect(diag?.message).toBe(messageFor('agg-on-text'));
    });

    it('flat-object-subfield fires on a reference whose type is flat_object', () => {
      const diag = run(FLAT_QUERY, FLAT_TYPES).find((d) => d.ruleId === 'flat-object-subfield');
      expect(diag).toBeDefined();
      expect(diag?.message).toBe(messageFor('flat-object-subfield'));
    });

    it('type-mismatch-numeric fires on a numeric field = non-coercible string literal', () => {
      const diag = run(MISMATCH_QUERY, MISMATCH_TYPES).find(
        (d) => d.ruleId === 'type-mismatch-numeric'
      );
      expect(diag).toBeDefined();
      expect(diag?.message).toBe(messageFor('type-mismatch-numeric'));
    });
  });

  describe('the typeMap-dependent rules self-suppress without type metadata (needsContext gate)', () => {
    it('agg-on-text is suppressed when the context carries no typeMap', () => {
      expect(ruleIds(AGG_QUERY)).not.toContain('agg-on-text');
    });

    it('flat-object-subfield is suppressed when the context carries no typeMap', () => {
      expect(ruleIds(FLAT_QUERY)).not.toContain('flat-object-subfield');
    });

    it('type-mismatch-numeric is suppressed when the context carries no typeMap', () => {
      expect(ruleIds(MISMATCH_QUERY)).not.toContain('type-mismatch-numeric');
    });
  });
});
