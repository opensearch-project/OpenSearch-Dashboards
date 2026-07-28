/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { runLint } from '../lint_runner';
import { registerDetector, resetDetectorRegistry } from '../detector_registry';
import { createCompiledRuleNameToIndex } from '../rule_index';
import { CatalogEntry } from '../types';

const fakeTree = {} as unknown as ParserRuleContext;
const rni = () => -1;

function buildCompiledTree(query: string): ParserRuleContext {
  const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(query));
  lexer.removeErrorListeners();
  const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
  parser.removeErrorListeners();
  return parser.root();
}

function makeRule(overrides: Partial<CatalogEntry>): CatalogEntry {
  return {
    id: 'r',
    detector: 'r',
    enabled: true,
    severity: 'error',
    message: 'm',
    docUrl: 'd',
    appliesTo: {},
    ...overrides,
  };
}

describe('runLint resolution loop', () => {
  afterEach(() => {
    resetDetectorRegistry();
  });

  it('isolates a throwing detector and still runs the rest', () => {
    registerDetector('throws', () => {
      throw new Error('boom');
    });
    registerDetector('ok', (_t, cfg) => [
      {
        ruleId: cfg.id,
        severity: cfg.severity,
        message: 'ok',
        range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
      },
    ]);

    const catalog = [
      makeRule({ id: 'a', detector: 'throws' }),
      makeRule({ id: 'b', detector: 'ok' }),
    ];

    const diags = runLint(fakeTree, { catalog, ruleNameToIndex: rni, context: {} });
    expect(diags.map((d) => d.ruleId)).toEqual(['b']);
  });

  it('skips disabled rules', () => {
    registerDetector('ok', (_t, cfg) => [
      {
        ruleId: cfg.id,
        severity: cfg.severity,
        message: 'ok',
        range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
      },
    ]);
    const catalog = [makeRule({ id: 'a', detector: 'ok', enabled: false })];
    expect(runLint(fakeTree, { catalog, ruleNameToIndex: rni, context: {} })).toEqual([]);
  });

  it('skips a rule whose detector is unregistered (inert)', () => {
    const catalog = [makeRule({ id: 'a', detector: 'missing-detector' })];
    expect(runLint(fakeTree, { catalog, ruleNameToIndex: rni, context: {} })).toEqual([]);
  });

  it('gates needsContext rules on a non-empty fields set', () => {
    registerDetector('ctx', (_t, cfg) => [
      {
        ruleId: cfg.id,
        severity: cfg.severity,
        message: 'x',
        range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
      },
    ]);
    const catalog = [makeRule({ id: 'a', detector: 'ctx', needsContext: true })];

    expect(runLint(fakeTree, { catalog, ruleNameToIndex: rni, context: {} })).toEqual([]);
    expect(
      runLint(fakeTree, {
        catalog,
        ruleNameToIndex: rni,
        context: { fields: new Set(['f']) },
      })
    ).toHaveLength(1);
  });

  it('satisfies needsContext with a non-empty typeMap alone (no field set)', () => {
    registerDetector('ctx', (_t, cfg) => [
      {
        ruleId: cfg.id,
        severity: cfg.severity,
        message: 'x',
        range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
      },
    ]);
    const catalog = [makeRule({ id: 'a', detector: 'ctx', needsContext: true })];

    // An empty typeMap is still "empty context" and gates the rule out.
    expect(
      runLint(fakeTree, {
        catalog,
        ruleNameToIndex: rni,
        context: { typeMap: new Map() },
      })
    ).toEqual([]);
    // A populated typeMap alone lets the type-aware rules run.
    expect(
      runLint(fakeTree, {
        catalog,
        ruleNameToIndex: rni,
        context: { typeMap: new Map([['age', 'long']]) },
      })
    ).toHaveLength(1);
  });

  describe('runtimeOnly flag', () => {
    const probe = () => {
      registerDetector('probe', (_t, cfg) => [
        {
          ruleId: cfg.id,
          severity: cfg.severity,
          message: 'probe',
          range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
        },
      ]);
    };

    it('runs a runtimeOnly rule on the runtime-bundle surface', () => {
      probe();
      const catalog = [makeRule({ id: 'a', detector: 'probe', runtimeOnly: true })];
      expect(
        runLint(fakeTree, {
          catalog,
          ruleNameToIndex: rni,
          context: { grammarSurface: 'runtime-bundle' },
        })
      ).toHaveLength(1);
    });

    it('skips a runtimeOnly rule on the compiled-simplified fallback surface', () => {
      probe();
      const catalog = [makeRule({ id: 'a', detector: 'probe', runtimeOnly: true })];
      expect(
        runLint(fakeTree, {
          catalog,
          ruleNameToIndex: rni,
          context: { grammarSurface: 'compiled-simplified' },
        })
      ).toEqual([]);
    });

    it('skips a runtimeOnly rule when no grammarSurface is set (safe default)', () => {
      probe();
      const catalog = [makeRule({ id: 'a', detector: 'probe', runtimeOnly: true })];
      expect(runLint(fakeTree, { catalog, ruleNameToIndex: rni, context: {} })).toEqual([]);
    });

    it('runs a non-runtimeOnly rule on the compiled-simplified surface', () => {
      probe();
      const catalog = [makeRule({ id: 'a', detector: 'probe' })];
      expect(
        runLint(fakeTree, {
          catalog,
          ruleNameToIndex: rni,
          context: { grammarSurface: 'compiled-simplified' },
        })
      ).toHaveLength(1);
    });
  });

  describe('sourceScoped gate', () => {
    const compiledRni = createCompiledRuleNameToIndex();
    const probe = () =>
      registerDetector('scoped', (_t, cfg) => [
        {
          ruleId: cfg.id,
          severity: cfg.severity,
          message: 'x',
          range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
        },
      ]);
    const catalog = [makeRule({ id: 'a', detector: 'scoped', sourceScoped: true })];

    it('suppresses a sourceScoped rule when the query source differs from the selected pattern', () => {
      probe();
      const diags = runLint(buildCompiledTree('source=returns | head 5'), {
        catalog,
        ruleNameToIndex: compiledRni,
        context: { selectedSourcePattern: 'orders' },
      });
      expect(diags).toEqual([]);
    });

    it('runs a sourceScoped rule when the query source matches the selected pattern', () => {
      probe();
      const diags = runLint(buildCompiledTree('source=orders | head 5'), {
        catalog,
        ruleNameToIndex: compiledRni,
        context: { selectedSourcePattern: 'orders' },
      });
      expect(diags).toHaveLength(1);
    });

    it('runs a sourceScoped rule when no selected pattern is set (fails open)', () => {
      probe();
      const diags = runLint(buildCompiledTree('source=returns | head 5'), {
        catalog,
        ruleNameToIndex: compiledRni,
        context: {},
      });
      expect(diags).toHaveLength(1);
    });

    it('does not suppress a non-sourceScoped rule on a source mismatch', () => {
      probe();
      const plainCatalog = [makeRule({ id: 'a', detector: 'scoped' })];
      const diags = runLint(buildCompiledTree('source=returns | head 5'), {
        catalog: plainCatalog,
        ruleNameToIndex: compiledRni,
        context: { selectedSourcePattern: 'orders' },
      });
      expect(diags).toHaveLength(1);
    });
  });

  it('applies bundle overrides over local config', () => {
    registerDetector('ok', (_t, cfg) => [
      {
        ruleId: cfg.id,
        severity: cfg.severity,
        message: cfg.message,
        range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
      },
    ]);
    const catalog = [makeRule({ id: 'a', detector: 'ok', enabled: true })];

    // Bundle disables the rule.
    expect(
      runLint(fakeTree, {
        catalog,
        ruleNameToIndex: rni,
        context: {},
        bundleOverrides: { a: { enabled: false } },
      })
    ).toEqual([]);
  });
});
