/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext, ParseTree } from 'antlr4ng';
import { isRuleNode, findAllDescendantsByRule } from './rule_index';
import { RuleNameToIndex } from './rule_index';

export interface PipelineStage {
  command: string;
  node: ParserRuleContext;
}

export interface PipelineShape {
  stages: PipelineStage[];
}

const COMMAND_RULE_NAMES = [
  'searchCommand',
  'whereCommand',
  'fieldsCommand',
  'tableCommand',
  'joinCommand',
  'renameCommand',
  'statsCommand',
  'eventstatsCommand',
  'streamstatsCommand',
  'dedupCommand',
  'sortCommand',
  'evalCommand',
  'headCommand',
  'binCommand',
  'topCommand',
  'rareCommand',
  'grokCommand',
  'parseCommand',
  'spathCommand',
  'patternsCommand',
  'lookupCommand',
  'fillnullCommand',
  'trendlineCommand',
  'appendcolCommand',
  'appendCommand',
  'expandCommand',
  'flattenCommand',
  'reverseCommand',
  'regexCommand',
  'timechartCommand',
  'rexCommand',
  'replaceCommand',
  'unionCommand',
  'multisearchCommand',
];

function buildIndexToCommandName(ruleNameToIndex: RuleNameToIndex): Map<number, string> {
  const map = new Map<number, string>();
  for (const name of COMMAND_RULE_NAMES) {
    const idx = ruleNameToIndex(name);
    if (idx !== -1) {
      map.set(idx, name);
    }
  }
  return map;
}

export function buildPipelineShape(
  tree: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): PipelineShape {
  const indexToCommand = buildIndexToCommandName(ruleNameToIndex);
  const stages: PipelineStage[] = [];

  const visit = (node: ParseTree): void => {
    if (isRuleNode(node)) {
      const commandName = indexToCommand.get(node.ruleIndex);
      if (commandName) {
        stages.push({ command: commandName, node });
      }
      const children = node.children ?? [];
      for (const child of children) {
        visit(child);
      }
    }
  };
  visit(tree);

  return { stages };
}

/** Subtrees with an alternate field source, pruned during field-validation. */
export function collectAlternateSourceSubtrees(
  tree: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): Set<ParserRuleContext> {
  const subtrees = new Set<ParserRuleContext>();

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'lookupCommand')) {
    subtrees.add(node);
  }

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'appendCommand')) {
    if (findAllDescendantsByRule(node, ruleNameToIndex, 'searchCommand').length > 0) {
      subtrees.add(node);
    }
  }

  // appendcol's bracketed pipeline computes an attached column; its internal row
  // order is independent of the main pipeline, so commands inside it must not
  // affect (or be affected by) the top-level sort/head ordering analysis.
  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'appendcolCommand')) {
    subtrees.add(node);
  }

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'subSearch')) {
    subtrees.add(node);
  }

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'unionDataset')) {
    subtrees.add(node);
  }

  return subtrees;
}
