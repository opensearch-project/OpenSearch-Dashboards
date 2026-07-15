/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext, TerminalNode } from 'antlr4ng';
import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import {
  findAllChildrenByRule,
  findAllDescendantsByRule,
  findChildByRule,
  isTerminalNode,
  RuleNameToIndex,
} from '../rule_index';
import { rangeFromContext } from '../range_utils';

// Engine ground truth: Join.java (highCostJoinTypes = RIGHT/CROSS/FULL) and
// AstBuilder.validateJoinType reject these join types unless
// plugins.calcite.all_join_types.allowed is set. `outer` is an alias for `left`
// and must never be flagged. Fires on all clusters regardless of engine.
//
// Two grammar spots carry the keyword (labeled alternatives collapse under the
// parser, so we read the direct terminal tokens rather than a labeled node):
//   1. sqlLikeJoinType — the prefix form (`join right t ...`) on the runtime grammar.
//   2. joinType         — the option form (`join type=cross t ...`) on any surface.
const DISABLED_JOIN_KEYWORDS: ReadonlySet<string> = new Set(['right', 'full', 'cross']);

/** Direct terminal token texts (lowercased) of a node. */
function directTokenTexts(ctx: ParserRuleContext): string[] {
  const children = ctx.children ?? [];
  return children
    .filter((c): c is TerminalNode => isTerminalNode(c))
    .map((c) => c.getText().toLowerCase());
}

function detectJoinTypeKeyword(
  joinCommand: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): { keyword: string; node: ParserRuleContext } | undefined {
  const sqlLikeType = findChildByRule(joinCommand, ruleNameToIndex, 'sqlLikeJoinType');
  if (sqlLikeType) {
    for (const tok of directTokenTexts(sqlLikeType)) {
      if (DISABLED_JOIN_KEYWORDS.has(tok)) {
        return { keyword: tok, node: sqlLikeType };
      }
    }
  }

  // Read `joinType` only from this join's OWN direct `joinOption` children. A
  // descendant search would also reach the `joinType` of a join nested inside a
  // subsearch (`join type=inner b [ ... | join type=cross c ]`), reporting the
  // nested keyword twice and masking the outer join's own type. Every legitimate
  // `type=<kw>` is a direct `joinOption` of its own `joinCommand`, and nested
  // joins are enumerated separately by the caller's `joinCommand` walk.
  const joinOptions = findAllChildrenByRule(joinCommand, ruleNameToIndex, 'joinOption');
  for (const joinOption of joinOptions) {
    const joinTypeNode = findChildByRule(joinOption, ruleNameToIndex, 'joinType');
    if (!joinTypeNode) {
      continue;
    }
    for (const tok of directTokenTexts(joinTypeNode)) {
      if (DISABLED_JOIN_KEYWORDS.has(tok)) {
        return { keyword: tok, node: joinTypeNode };
      }
    }
  }

  return undefined;
}

export const disabledJoinTypeDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  if (context.settings?.allJoinTypesAllowed === true) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const joinCommands = findAllDescendantsByRule(tree, ruleNameToIndex, 'joinCommand');

  for (const joinCommand of joinCommands) {
    const detected = detectJoinTypeKeyword(joinCommand, ruleNameToIndex);
    if (detected) {
      diagnostics.push({
        ruleId: config.id,
        severity: config.severity,
        message: config.message,
        range: rangeFromContext(detected.node),
        docUrl: config.docUrl,
        hoverFacts: { joinType: detected.keyword },
      });
    }
  }

  return diagnostics;
};
