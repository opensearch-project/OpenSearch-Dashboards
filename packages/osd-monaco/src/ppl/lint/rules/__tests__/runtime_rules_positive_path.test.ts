/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext, TerminalNode } from 'antlr4ng';
import { unionMinDatasetsDetector } from '../union_min_datasets';
import { replaceWildcardAsymmetryDetector } from '../replace_wildcard_asymmetry';
import { multisearchMinSubsearchDetector } from '../multisearch_min_subsearch';
import { disabledJoinTypeDetector } from '../disabled_join_type';
import type { CatalogEntry, LintRunContext } from '../../types';

// Helpers: build stub AST nodes that pass the duck-type guards in rule_index.ts.
// The detectors use findAllDescendantsByRule/findAllChildrenByRule which match by
// ruleIndex (number) against a ruleNameToIndex function.

const RULE_INDICES: Record<string, number> = {
  unionCommand: 100,
  unionDataset: 101,
  multisearchCommand: 200,
  subSearch: 201,
  replacePair: 300,
  stringLiteral: 301,
  joinCommand: 400,
  joinType: 401,
  sqlLikeJoinType: 402,
};

const ruleNameToIndex = (name: string) => RULE_INDICES[name] ?? -1;

function makeTerminal(text: string): TerminalNode {
  return ({
    symbol: { start: 0, stop: text.length - 1, line: 1, column: 0 },
    getText: () => text,
  } as unknown) as TerminalNode;
}

function makeRuleNode(
  ruleName: string,
  children: Array<ParserRuleContext | TerminalNode> = []
): ParserRuleContext {
  return ({
    ruleIndex: RULE_INDICES[ruleName],
    children,
    start: { start: 0, stop: 0, line: 1, column: 0 },
    stop: { start: 0, stop: 0, line: 1, column: 10 },
    getText: () => children.map((c) => (c as any).getText?.() ?? '').join(''),
  } as unknown) as ParserRuleContext;
}

function makeRoot(children: ParserRuleContext[]): ParserRuleContext {
  return ({
    ruleIndex: 0,
    children,
    start: { start: 0, stop: 0, line: 1, column: 0 },
    stop: { start: 0, stop: 0, line: 1, column: 20 },
    getText: () => '',
  } as unknown) as ParserRuleContext;
}

const makeConfig = (id: string): CatalogEntry => ({
  id,
  detector: id,
  enabled: true,
  severity: 'error',
  message: 'test',
  docUrl: 'https://example.com',
  appliesTo: {},
});

describe('runtime-only rules: positive-path (detector fires on matching tree)', () => {
  describe('union-min-datasets', () => {
    const config = makeConfig('union-min-datasets');
    const context: LintRunContext = { isCalcite: true, grammarSurface: 'runtime-bundle' };

    it('fires when union has fewer than 2 datasets', () => {
      const unionCmd = makeRuleNode('unionCommand', [makeRuleNode('unionDataset')]);
      const tree = makeRoot([unionCmd]);

      const diags = unionMinDatasetsDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(1);
      expect(diags[0].ruleId).toBe('union-min-datasets');
    });

    it('does not fire when union has 2+ datasets', () => {
      const unionCmd = makeRuleNode('unionCommand', [
        makeRuleNode('unionDataset'),
        makeRuleNode('unionDataset'),
      ]);
      const tree = makeRoot([unionCmd]);

      const diags = unionMinDatasetsDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(0);
    });

    it('does not fire when isCalcite is false', () => {
      const unionCmd = makeRuleNode('unionCommand', [makeRuleNode('unionDataset')]);
      const tree = makeRoot([unionCmd]);

      const diags = unionMinDatasetsDetector(
        tree,
        config,
        { ...context, isCalcite: false },
        ruleNameToIndex
      );
      expect(diags).toHaveLength(0);
    });
  });

  describe('multisearch-min-subsearch', () => {
    const config = makeConfig('multisearch-min-subsearch');
    const context: LintRunContext = { grammarSurface: 'runtime-bundle' };

    it('fires when multisearch has fewer than 2 subsearches', () => {
      const cmd = makeRuleNode('multisearchCommand', [makeRuleNode('subSearch')]);
      const tree = makeRoot([cmd]);

      const diags = multisearchMinSubsearchDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(1);
      expect(diags[0].ruleId).toBe('multisearch-min-subsearch');
    });

    it('does not fire when multisearch has 2+ subsearches', () => {
      const cmd = makeRuleNode('multisearchCommand', [
        makeRuleNode('subSearch'),
        makeRuleNode('subSearch'),
      ]);
      const tree = makeRoot([cmd]);

      const diags = multisearchMinSubsearchDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(0);
    });
  });

  describe('replace-wildcard-asymmetry', () => {
    const config = makeConfig('replace-wildcard-asymmetry');
    const context: LintRunContext = { isCalcite: true, grammarSurface: 'runtime-bundle' };

    it('fires on asymmetric wildcard counts', () => {
      const pattern = makeRuleNode('stringLiteral', [makeTerminal("'a*b*c'")]);
      const replacement = makeRuleNode('stringLiteral', [makeTerminal("'x*y'")]);
      const pair = makeRuleNode('replacePair', [pattern, replacement]);
      const tree = makeRoot([pair]);

      const diags = replaceWildcardAsymmetryDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(1);
      expect(diags[0].ruleId).toBe('replace-wildcard-asymmetry');
    });

    it('does not fire on symmetric wildcard counts', () => {
      const pattern = makeRuleNode('stringLiteral', [makeTerminal("'a*b'")]);
      const replacement = makeRuleNode('stringLiteral', [makeTerminal("'x*y'")]);
      const pair = makeRuleNode('replacePair', [pattern, replacement]);
      const tree = makeRoot([pair]);

      const diags = replaceWildcardAsymmetryDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(0);
    });

    it('does not fire when replacement has zero wildcards (any-to-fixed is allowed)', () => {
      const pattern = makeRuleNode('stringLiteral', [makeTerminal("'a*b*c'")]);
      const replacement = makeRuleNode('stringLiteral', [makeTerminal("'xyz'")]);
      const pair = makeRuleNode('replacePair', [pattern, replacement]);
      const tree = makeRoot([pair]);

      const diags = replaceWildcardAsymmetryDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(0);
    });

    it('does not fire when isCalcite is false', () => {
      const pattern = makeRuleNode('stringLiteral', [makeTerminal("'a*b*c'")]);
      const replacement = makeRuleNode('stringLiteral', [makeTerminal("'x*y'")]);
      const pair = makeRuleNode('replacePair', [pattern, replacement]);
      const tree = makeRoot([pair]);

      const diags = replaceWildcardAsymmetryDetector(
        tree,
        config,
        { ...context, isCalcite: false },
        ruleNameToIndex
      );
      expect(diags).toHaveLength(0);
    });
  });

  describe('disabled-join-type (positive suppression via settings)', () => {
    const config = makeConfig('disabled-join-type');

    it('fires for cross join type when allJoinTypesAllowed is false', () => {
      const joinType = makeRuleNode('joinType', [makeTerminal('cross')]);
      const joinCmd = makeRuleNode('joinCommand', [joinType]);
      const tree = makeRoot([joinCmd]);
      const context: LintRunContext = { settings: { allJoinTypesAllowed: false } };

      const diags = disabledJoinTypeDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(1);
      expect(diags[0].ruleId).toBe('disabled-join-type');
    });

    it('suppresses when allJoinTypesAllowed is true (end-to-end settings wiring)', () => {
      const joinType = makeRuleNode('joinType', [makeTerminal('cross')]);
      const joinCmd = makeRuleNode('joinCommand', [joinType]);
      const tree = makeRoot([joinCmd]);
      const context: LintRunContext = { settings: { allJoinTypesAllowed: true } };

      const diags = disabledJoinTypeDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(0);
    });

    it('does not flag inner join', () => {
      const joinType = makeRuleNode('joinType', [makeTerminal('inner')]);
      const joinCmd = makeRuleNode('joinCommand', [joinType]);
      const tree = makeRoot([joinCmd]);
      const context: LintRunContext = {};

      const diags = disabledJoinTypeDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(0);
    });
  });
});
