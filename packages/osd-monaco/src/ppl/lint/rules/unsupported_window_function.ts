/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParserRuleContext } from 'antlr4ng';
import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import {
  findAllDescendantsByRule,
  findChildByRule,
  getTokenText,
  RuleNameToIndex,
} from '../rule_index';
import { rangeFromContext } from '../range_utils';

const UNSUPPORTED_WINDOW_FUNCTIONS: ReadonlySet<string> = new Set([
  'rank',
  'dense_rank',
  'percent_rank',
  'cume_dist',
  'nth',
  'ntile',
  'first',
  'last',
]);

const WINDOW_COMMAND_RULES = ['eventstatsCommand', 'streamstatsCommand'];

function collectWindowFunctionNames(
  aggTerm: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): Array<{ name: string; node: ParserRuleContext }> {
  const results: Array<{ name: string; node: ParserRuleContext }> = [];
  const windowFns = findAllDescendantsByRule(aggTerm, ruleNameToIndex, 'windowFunction');
  for (const windowFn of windowFns) {
    const nameNode = findChildByRule(windowFn, ruleNameToIndex, 'windowFunctionName');
    if (!nameNode) {
      continue;
    }
    const scalarNode = findChildByRule(nameNode, ruleNameToIndex, 'scalarWindowFunctionName');
    const targetNode = scalarNode ?? nameNode;
    const text = getTokenText(targetNode).toLowerCase();
    if (text) {
      results.push({ name: text, node: targetNode });
    }
  }
  return results;
}

export const unsupportedWindowFunctionDetector: Detector = (
  tree,
  config,
  _context,
  ruleNameToIndex
) => {
  const diagnostics: Diagnostic[] = [];

  const commands: ParserRuleContext[] = [];
  for (const ruleName of WINDOW_COMMAND_RULES) {
    commands.push(...findAllDescendantsByRule(tree, ruleNameToIndex, ruleName));
  }

  for (const command of commands) {
    const fns = collectWindowFunctionNames(command, ruleNameToIndex);
    for (const fn of fns) {
      if (UNSUPPORTED_WINDOW_FUNCTIONS.has(fn.name)) {
        diagnostics.push({
          ruleId: config.id,
          severity: config.severity,
          message: config.message,
          range: rangeFromContext(fn.node),
          docUrl: config.docUrl,
          hoverFacts: { windowFunction: fn.name },
        });
      }
    }
  }

  return diagnostics;
};
