/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext, TerminalNode } from 'antlr4ng';
import { runLint } from '../../lint_runner';
import { getBundledCatalog } from '../../catalog';
import { createRuntimeRuleNameToIndex } from '../../rule_index';
import type { LintRunContext } from '../../types';

// These tests drive the runtime-only rules through the FULL product path —
// getBundledCatalog() (the real rules_catalog.json), the real detector registry,
// and runLint()'s runtimeOnly/appliesTo/isCalcite gating — rather than calling a
// detector directly. They use stub trees that carry the runtime grammar's rule
// names, so a plumbing regression (a catalog entry disabled, the runtimeOnly
// filter broken, a detector unregistered, or a rule-name / id divergence) fails
// here even though the bare-detector unit tests in runtime_rules_positive_path
// would still pass. This directly answers "would a plumbing regression pass CI?".

// Runtime grammar rule-name → index map. The exact indices are arbitrary; only
// the NAMES must match what the detectors look up (unionCommand, unionDataset,
// pplCommands, multisearchCommand, subSearch, replacePair, stringLiteral).
const RUNTIME_RULE_INDICES: Record<string, number> = {
  pplCommands: 1,
  commands: 2,
  unionCommand: 100,
  unionDataset: 101,
  multisearchCommand: 200,
  subSearch: 201,
  replacePair: 300,
  stringLiteral: 301,
};

const runtimeRuleNameToIndex = createRuntimeRuleNameToIndex(
  new Map(Object.entries(RUNTIME_RULE_INDICES))
);

function makeTerminal(text: string): TerminalNode {
  return {
    symbol: { start: 0, stop: text.length - 1, line: 1, column: 0 },
    getText: () => text,
  } as unknown as TerminalNode;
}

function makeRuleNode(
  ruleName: string,
  children: Array<ParserRuleContext | TerminalNode> = []
): ParserRuleContext {
  const node = {
    ruleIndex: RUNTIME_RULE_INDICES[ruleName],
    children,
    start: { start: 0, stop: 0, line: 1, column: 0 },
    stop: { start: 0, stop: 0, line: 1, column: 10 },
    getText: () => children.map((c) => (c as any).getText?.() ?? '').join(''),
  } as unknown as ParserRuleContext;
  for (const child of children) {
    (child as { parent?: ParserRuleContext }).parent = node;
  }
  return node;
}

function makeRoot(children: ParserRuleContext[]): ParserRuleContext {
  return {
    ruleIndex: 0,
    children,
    start: { start: 0, stop: 0, line: 1, column: 0 },
    stop: { start: 0, stop: 0, line: 1, column: 20 },
    getText: () => '',
  } as unknown as ParserRuleContext;
}

const runtimeContext: LintRunContext = {
  isCalcite: true,
  grammarSurface: 'runtime-bundle',
  dataSourceVersion: '3.8.0',
};

const runRuntime = (tree: ParserRuleContext, context: LintRunContext = runtimeContext) =>
  runLint(tree, {
    catalog: getBundledCatalog(),
    ruleNameToIndex: runtimeRuleNameToIndex,
    dataSourceVersion: context.dataSourceVersion,
    context,
  });

describe('runtime-only rules: product-path plumbing (catalog + registry + runLint)', () => {
  it('fires union-min-datasets end-to-end for a query-initial single-dataset union', () => {
    const unionCmd = makeRuleNode('unionCommand', [makeRuleNode('unionDataset')]);
    const tree = makeRoot([makeRuleNode('pplCommands', [unionCmd])]);

    const diags = runRuntime(tree);
    const union = diags.find((d) => d.ruleId === 'union-min-datasets');
    expect(union).toBeDefined();
    // Message flows from the catalog, not a hardcoded literal.
    expect(union?.message).toBe('union requires at least two datasets.');
  });

  it('does not fire union-min-datasets on a mid-pipeline single-dataset union', () => {
    const unionCmd = makeRuleNode('unionCommand', [makeRuleNode('unionDataset')]);
    const tree = makeRoot([makeRuleNode('commands', [unionCmd])]);

    const diags = runRuntime(tree);
    expect(diags.map((d) => d.ruleId)).not.toContain('union-min-datasets');
  });

  it('fires multisearch-min-subsearch end-to-end for a single-subsearch multisearch', () => {
    const cmd = makeRuleNode('multisearchCommand', [makeRuleNode('subSearch')]);
    const tree = makeRoot([makeRuleNode('pplCommands', [cmd])]);

    const diags = runRuntime(tree);
    const multi = diags.find((d) => d.ruleId === 'multisearch-min-subsearch');
    expect(multi).toBeDefined();
    expect(multi?.message).toBe('multisearch requires at least two subsearches.');
  });

  it('fires replace-wildcard-asymmetry end-to-end for asymmetric wildcard counts', () => {
    const pattern = makeRuleNode('stringLiteral', [makeTerminal("'a*b*c'")]);
    const replacement = makeRuleNode('stringLiteral', [makeTerminal("'x*y'")]);
    const pair = makeRuleNode('replacePair', [pattern, replacement]);
    const tree = makeRoot([makeRuleNode('pplCommands', [pair])]);

    const diags = runRuntime(tree);
    const replace = diags.find((d) => d.ruleId === 'replace-wildcard-asymmetry');
    expect(replace).toBeDefined();
    expect(replace?.message).toBe(
      'replace pattern and replacement have asymmetric wildcard counts.'
    );
    expect(replace?.hoverFacts).toEqual({ patternWildcards: 2, replacementWildcards: 1 });
  });

  it('suppresses runtime-only rules on the compiled-simplified surface (runtimeOnly gate)', () => {
    const unionCmd = makeRuleNode('unionCommand', [makeRuleNode('unionDataset')]);
    const tree = makeRoot([makeRuleNode('pplCommands', [unionCmd])]);

    const diags = runRuntime(tree, {
      ...runtimeContext,
      grammarSurface: 'compiled-simplified',
    });
    expect(diags.map((d) => d.ruleId)).not.toContain('union-min-datasets');
  });

  it('suppresses Calcite-gated runtime rules when isCalcite is false', () => {
    const unionCmd = makeRuleNode('unionCommand', [makeRuleNode('unionDataset')]);
    const tree = makeRoot([makeRuleNode('pplCommands', [unionCmd])]);

    const diags = runRuntime(tree, { ...runtimeContext, isCalcite: false });
    expect(diags.map((d) => d.ruleId)).not.toContain('union-min-datasets');
  });
});
