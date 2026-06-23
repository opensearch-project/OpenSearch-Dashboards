/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext, ParseTree } from 'antlr4ng';
import { isRuleNode, isTerminalNode, findAllDescendantsByRule } from './rule_index';
import { RuleNameToIndex } from './rule_index';

export interface PipelineStage {
  command: string;
  node: ParserRuleContext;
}

export interface PipelineShape {
  stages: PipelineStage[];
  createdFields: Set<string>;
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

function collectCreatedFields(
  stage: PipelineStage,
  ruleNameToIndex: RuleNameToIndex,
  out: Set<string>
): void {
  const stack: ParseTree[] = [stage.node];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (!isRuleNode(node)) {
      continue;
    }
    const children = node.children ?? [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (isTerminalNode(child) && child.getText().toLowerCase() === 'as') {
        const next = children[i + 1];
        if (isRuleNode(next)) {
          const name = next.getText();
          if (name) {
            out.add(name);
          }
        }
      }
    }

    stack.push(...children);
  }

  const evalClauseIdx = ruleNameToIndex('evalClause');
  if (evalClauseIdx !== -1) {
    const fieldExprIdx = ruleNameToIndex('fieldExpression');
    const evalStack: ParseTree[] = [stage.node];
    while (evalStack.length > 0) {
      const node = evalStack.pop()!;
      if (!isRuleNode(node)) {
        continue;
      }
      if (node.ruleIndex === evalClauseIdx) {
        const first = (node.children ?? []).find(
          (c) => isRuleNode(c) && c.ruleIndex === fieldExprIdx
        ) as ParserRuleContext | undefined;
        if (first) {
          const name = first.getText();
          if (name) {
            out.add(name);
          }
        }
      }
      evalStack.push(...(node.children ?? []));
    }
  }
}

export function buildPipelineShape(
  tree: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): PipelineShape {
  const indexToCommand = buildIndexToCommandName(ruleNameToIndex);
  const stages: PipelineStage[] = [];
  const createdFields = new Set<string>();

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

  for (const stage of stages) {
    collectCreatedFields(stage, ruleNameToIndex, createdFields);
  }

  return { stages, createdFields };
}

/**
 * Subtrees whose field references belong to a different source (lookup, append
 * with inner source, subSearch, unionDataset). Pruned during field-validation.
 */
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

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'subSearch')) {
    subtrees.add(node);
  }

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'unionDataset')) {
    subtrees.add(node);
  }

  return subtrees;
}
