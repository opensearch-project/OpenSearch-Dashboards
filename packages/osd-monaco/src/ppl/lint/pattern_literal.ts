/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { findAllDescendantsByRule, findChildByRule, RuleNameToIndex } from './rule_index';

// Shared lookup for the string-literal pattern argument used by
// invalid-capture-group-name. Pattern extraction commands use different parse
// shapes, so keeping the tree walk here avoids duplicating that grammar detail.

/**
 * Find the regex pattern's string-literal node for an extraction command node.
 *
 * `grok`/`parse` carry the pattern as a direct `stringLiteral` child. `rex`
 * nests it as `rexCommand → rexExpr → pattern=stringLiteral`, so a direct-child
 * lookup misses it and the descendant fallback runs: the pattern is always the
 * last string literal in source order (a quoted field/mode argument, when
 * present, precedes it), and `findAllDescendantsByRule` yields nodes in DFS
 * pop order rather than source order, so we select by source position.
 *
 * Works whether `command` is a `rexCommand`, `rexExpr`, `parseCommand`, or
 * `grokCommand` node: `rexOption` carries only integer/qualifiedName arguments
 * (never a `stringLiteral`), so the single pattern literal is unambiguous.
 */
export function findPatternLiteral(
  command: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): ParserRuleContext | undefined {
  const direct = findChildByRule(command, ruleNameToIndex, 'stringLiteral');
  if (direct) {
    return direct;
  }
  const descendants = findAllDescendantsByRule(command, ruleNameToIndex, 'stringLiteral');
  let pattern: ParserRuleContext | undefined;
  for (const node of descendants) {
    if (!pattern || (node.start?.start ?? -1) > (pattern.start?.start ?? -1)) {
      pattern = node;
    }
  }
  return pattern;
}
