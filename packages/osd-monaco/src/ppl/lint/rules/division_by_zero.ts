/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllDescendantsByRule, isRuleNode, isTerminalNode } from '../rule_index';
import { rangeFromContext } from '../range_utils';

const DIVISION_OPERATOR = '/';

function isZeroLiteral(raw: string): boolean {
  let text = raw.trim();
  while (text.startsWith('(') && text.endsWith(')')) {
    text = text.slice(1, -1).trim();
  }
  if (text.startsWith('+') || text.startsWith('-')) {
    text = text.slice(1).trim();
  }
  return /^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(text) && Number(text) === 0;
}

export const divisionByZeroDetector: Detector = (tree, config, _context, ruleNameToIndex) => {
  const diagnostics: Diagnostic[] = [];
  const valueExpressions = findAllDescendantsByRule(tree, ruleNameToIndex, 'valueExpression');

  for (const node of valueExpressions) {
    const children = node.children ?? [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!isTerminalNode(child) || child.getText() !== DIVISION_OPERATOR) {
        continue;
      }
      const divisor = children.slice(i + 1).find(isRuleNode);
      if (divisor && isZeroLiteral(divisor.getText())) {
        diagnostics.push({
          ruleId: config.id,
          severity: config.severity,
          message:
            'Dividing by zero returns null silently — guard with coalesce() or a conditional.',
          range: rangeFromContext(divisor),
          docUrl: config.docUrl,
          hoverFacts: { literal: divisor.getText() },
        });
      }
    }
  }

  return diagnostics;
};
