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
  pplCommands: 1,
  commands: 2,
  unionCommand: 100,
  unionDataset: 101,
  multisearchCommand: 200,
  subSearch: 201,
  replacePair: 300,
  stringLiteral: 301,
  joinCommand: 400,
  joinType: 401,
  sqlLikeJoinType: 402,
  joinOption: 403,
};

const ruleNameToIndex = (name: string) => RULE_INDICES[name] ?? -1;

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
  return {
    ruleIndex: RULE_INDICES[ruleName],
    children,
    start: { start: 0, stop: 0, line: 1, column: 0 },
    stop: { start: 0, stop: 0, line: 1, column: 10 },
    getText: () => children.map((c) => (c as any).getText?.() ?? '').join(''),
  } as unknown as ParserRuleContext;
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

/** Wire each child's `.parent` to `parent` so parent-rule discrimination works. */
function setParent(parent: ParserRuleContext, ...children: ParserRuleContext[]): ParserRuleContext {
  for (const child of children) {
    (child as { parent?: ParserRuleContext }).parent = parent;
  }
  return parent;
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

    it('fires when a query-initial union has fewer than 2 datasets', () => {
      const unionCmd = makeRuleNode('unionCommand', [makeRuleNode('unionDataset')]);
      const pplCommands = setParent(makeRuleNode('pplCommands', [unionCmd]), unionCmd);
      const tree = makeRoot([pplCommands]);

      const diags = unionMinDatasetsDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(1);
      expect(diags[0].ruleId).toBe('union-min-datasets');
      // Reads config.message rather than a hardcoded literal.
      expect(diags[0].message).toBe(config.message);
    });

    it('does not fire on a mid-pipeline union with a single explicit dataset', () => {
      // `... | union [subsearch]` — the upstream pipeline is the implicit first
      // dataset, so a lone explicit unionDataset is valid. The union node's parent
      // is `commands`, not `pplCommands`.
      const unionCmd = makeRuleNode('unionCommand', [makeRuleNode('unionDataset')]);
      const commands = setParent(makeRuleNode('commands', [unionCmd]), unionCmd);
      const tree = makeRoot([commands]);

      const diags = unionMinDatasetsDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(0);
    });

    it('does not fire when a query-initial union has 2+ datasets', () => {
      const unionCmd = makeRuleNode('unionCommand', [
        makeRuleNode('unionDataset'),
        makeRuleNode('unionDataset'),
      ]);
      const pplCommands = setParent(makeRuleNode('pplCommands', [unionCmd]), unionCmd);
      const tree = makeRoot([pplCommands]);

      const diags = unionMinDatasetsDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(0);
    });

    it('does not fire when isCalcite is false', () => {
      const unionCmd = makeRuleNode('unionCommand', [makeRuleNode('unionDataset')]);
      const pplCommands = setParent(makeRuleNode('pplCommands', [unionCmd]), unionCmd);
      const tree = makeRoot([pplCommands]);

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
      expect(diags[0].message).toBe(config.message);
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
      expect(diags[0].message).toBe(config.message);
      expect(diags[0].hoverFacts).toEqual({ patternWildcards: 2, replacementWildcards: 1 });
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

    // `type=<kw>` lives under a `joinOption` child of the join, matching the
    // real grammar (`joinCommand : JOIN (joinOption)* ...`, `joinOption : TYPE
    // EQUAL joinType`).
    const makeJoinWithType = (keyword: string): ParserRuleContext => {
      const joinType = makeRuleNode('joinType', [makeTerminal(keyword)]);
      const joinOption = makeRuleNode('joinOption', [makeTerminal('type'), joinType]);
      return makeRuleNode('joinCommand', [joinOption]);
    };

    it('fires for cross join type when allJoinTypesAllowed is false', () => {
      const tree = makeRoot([makeJoinWithType('cross')]);
      const context: LintRunContext = { settings: { allJoinTypesAllowed: false } };

      const diags = disabledJoinTypeDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(1);
      expect(diags[0].ruleId).toBe('disabled-join-type');
      expect(diags[0].hoverFacts).toEqual({ joinType: 'cross' });
    });

    it('suppresses when allJoinTypesAllowed is true (end-to-end settings wiring)', () => {
      const tree = makeRoot([makeJoinWithType('cross')]);
      const context: LintRunContext = { settings: { allJoinTypesAllowed: true } };

      const diags = disabledJoinTypeDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(0);
    });

    it('does not flag inner join', () => {
      const tree = makeRoot([makeJoinWithType('inner')]);
      const context: LintRunContext = {};

      const diags = disabledJoinTypeDetector(tree, config, context, ruleNameToIndex);
      expect(diags).toHaveLength(0);
    });

    it('reports the nested join exactly once and does not mask the outer type', () => {
      // Outer `join type=full b [ ... | join type=cross d ]`: the outer join's own
      // `full` must be reported, and the nested `cross` must be reported exactly
      // once (not duplicated, not masking the outer). Modeled as two separate
      // joinCommand nodes, the inner nested under the outer via a subSearch.
      const innerJoin = makeJoinWithType('cross');
      const subSearch = makeRuleNode('subSearch', [innerJoin]);
      const outerJoinType = makeRuleNode('joinType', [makeTerminal('full')]);
      const outerJoinOption = makeRuleNode('joinOption', [makeTerminal('type'), outerJoinType]);
      const outerJoin = makeRuleNode('joinCommand', [outerJoinOption, subSearch]);
      const tree = makeRoot([outerJoin]);
      const context: LintRunContext = {};

      const diags = disabledJoinTypeDetector(tree, config, context, ruleNameToIndex);
      const keywords = diags.map((d) => d.hoverFacts?.joinType).sort();
      expect(keywords).toEqual(['cross', 'full']);
    });
  });
});
