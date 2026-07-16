/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { runLint } from '../../lint_runner';
import { getBundledCatalog } from '../../catalog';
import { createCompiledRuleNameToIndex } from '../../rule_index';
import type { CatalogEntry, LintRunContext } from '../../types';

// Product-path test (design doc §9 "Product path") for the five local rules that
// run on the COMPILED-SIMPLIFIED grammar surface. Unlike the per-rule detector
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
// the typeMap (or lack of one) per case; `bundleOverrides` is threaded through
// for the expand enable/suppress cases.
const run = (
  query: string,
  context: Partial<LintRunContext> = {},
  bundleOverrides?: Record<string, Partial<CatalogEntry>>
) =>
  runLint(buildTree(query), {
    catalog: getBundledCatalog(),
    ruleNameToIndex,
    bundleOverrides,
    context: { ...context, grammarSurface: 'compiled-simplified' },
  });

const ruleIds = (
  query: string,
  context?: Partial<LintRunContext>,
  bundleOverrides?: Record<string, Partial<CatalogEntry>>
) => run(query, context, bundleOverrides).map((d) => d.ruleId);

// A firing query + the typeMap it needs, for each rule that self-suppresses
// without type metadata. Capture-group is context-independent and handled apart.
const AGG_QUERY = 'search t | stats avg(name)';
const AGG_TYPES: Partial<LintRunContext> = { typeMap: new Map([['name', 'text']]) };

const FLAT_QUERY = 'search t | fields attributes';
const FLAT_TYPES: Partial<LintRunContext> = { typeMap: new Map([['attributes', 'flat_object']]) };

const MISMATCH_QUERY = 'search t | where age = "thirty"';
const MISMATCH_TYPES: Partial<LintRunContext> = { typeMap: new Map([['age', 'long']]) };

const EXPAND_QUERY = 'search t | expand user';
const EXPAND_TYPES: Partial<LintRunContext> = { typeMap: new Map([['user', 'keyword']]) };

const CAPTURE_QUERY = 'search t | parse message "(?P<year>x)"';

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

    it('invalid-capture-group-name fires on a Python (?P<name>) opener (no typeMap needed)', () => {
      const diag = run(CAPTURE_QUERY).find((d) => d.ruleId === 'invalid-capture-group-name');
      expect(diag).toBeDefined();
      expect(diag?.message).toBe(messageFor('invalid-capture-group-name'));
    });
  });

  describe('expand-on-non-array ships disabled and is togglable via bundleOverrides', () => {
    it('is SUPPRESSED by default even when a scalar-typed expand target is present', () => {
      // The catalog entry is enabled:false; runLint drops it before the detector
      // runs. The typeMap is supplied so this proves the *enabled* flag suppresses
      // it, not the needsContext gate.
      expect(ruleIds(EXPAND_QUERY, EXPAND_TYPES)).not.toContain('expand-on-non-array');
    });

    it('DOES fire once bundleOverrides re-enables it', () => {
      const diags = run(EXPAND_QUERY, EXPAND_TYPES, {
        'expand-on-non-array': { enabled: true },
      });
      const diag = diags.find((d) => d.ruleId === 'expand-on-non-array');
      expect(diag).toBeDefined();
      // The override flips `enabled` only; the message still flows from the catalog.
      expect(diag?.message).toBe(messageFor('expand-on-non-array'));
    });
  });

  describe('the four typeMap-dependent rules self-suppress without type metadata (needsContext gate)', () => {
    it('agg-on-text is suppressed when the context carries no typeMap', () => {
      expect(ruleIds(AGG_QUERY)).not.toContain('agg-on-text');
    });

    it('flat-object-subfield is suppressed when the context carries no typeMap', () => {
      expect(ruleIds(FLAT_QUERY)).not.toContain('flat-object-subfield');
    });

    it('type-mismatch-numeric is suppressed when the context carries no typeMap', () => {
      expect(ruleIds(MISMATCH_QUERY)).not.toContain('type-mismatch-numeric');
    });

    it('expand-on-non-array is suppressed by the needsContext gate even when re-enabled', () => {
      // Enable it via override but pass no typeMap: the needsContext gate (empty
      // context) must still drop it, isolating that gate from the enabled flag.
      expect(ruleIds(EXPAND_QUERY, {}, { 'expand-on-non-array': { enabled: true } })).not.toContain(
        'expand-on-non-array'
      );
    });
  });
});
