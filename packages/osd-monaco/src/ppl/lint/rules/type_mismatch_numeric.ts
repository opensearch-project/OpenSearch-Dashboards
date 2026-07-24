/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllDescendantsByRule, isRuleNode, RuleNameToIndex } from '../rule_index';
import { rangeFromContext } from '../range_utils';
import { parseFieldPath } from '../field_path';

// Live-verified (OpenSearch 3.7): a numeric field vs a non-coercible string
// literal (e.g. `age = "thirty"`) silently returns 0 rows. Only `=`/`==` verified.
const VERIFIED_OPERATORS: ReadonlySet<string> = new Set(['=', '==']);

// Mirrors OSD_FIELD_TYPES.NUMBER (data/common/osd_field_types).
const NUMERIC_TYPES: ReadonlySet<string> = new Set([
  'byte',
  'short',
  'integer',
  'long',
  'unsigned_long',
  'half_float',
  'float',
  'double',
  'scaled_float',
  'token_count',
]);

function asStringLiteral(operand: ParserRuleContext, ruleNameToIndex: RuleNameToIndex): boolean {
  const text = operand.getText();
  if (text.length < 2) {
    return false;
  }
  const first = text[0];
  const last = text[text.length - 1];
  const quoted = (first === '"' && last === '"') || (first === "'" && last === "'");
  if (!quoted) {
    return false;
  }
  // Require a stringLiteral node spanning the whole operand (rejects `"a" + "b"`).
  const literals = findAllDescendantsByRule(operand, ruleNameToIndex, 'stringLiteral');
  return literals.some((lit) => lit.getText() === text);
}

function asBareField(
  operand: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): string | undefined {
  const fields = findAllDescendantsByRule(operand, ruleNameToIndex, 'fieldExpression');
  if (fields.length !== 1) {
    return undefined;
  }
  const fieldText = fields[0].getText();
  if (fieldText !== operand.getText()) {
    return undefined;
  }
  return parseFieldPath(fieldText)?.canonical;
}

export const typeMismatchNumericDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  const typeMap = context.typeMap;
  if (!typeMap || typeMap.size === 0) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const operators = findAllDescendantsByRule(tree, ruleNameToIndex, 'comparisonOperator');

  for (const operator of operators) {
    if (!VERIFIED_OPERATORS.has(operator.getText())) {
      continue;
    }
    const parent = operator.parent;
    if (!isRuleNode(parent)) {
      continue;
    }
    // Operands are the rule-node children flanking the operator (itself a rule node).
    const operands = (parent.children ?? []).filter(
      (c): c is ParserRuleContext => isRuleNode(c) && c !== operator
    );
    if (operands.length !== 2) {
      continue;
    }
    const [left, right] = operands;

    let fieldName: string | undefined;
    let literalSide: ParserRuleContext | undefined;
    if (asStringLiteral(right, ruleNameToIndex)) {
      fieldName = asBareField(left, ruleNameToIndex);
      literalSide = right;
    } else if (asStringLiteral(left, ruleNameToIndex)) {
      fieldName = asBareField(right, ruleNameToIndex);
      literalSide = left;
    }

    if (fieldName === undefined || literalSide === undefined) {
      continue;
    }
    const esType = typeMap.get(fieldName);
    if (esType === undefined || !NUMERIC_TYPES.has(esType)) {
      continue;
    }
    // Quoted numeric strings coerce fine; only non-numeric ones fail. Number() is a
    // deliberately permissive oracle: over-accepting stays silent (false negative,
    // never false positive) pending live-engine evidence to widen detection.
    const literalText = literalSide.getText().slice(1, -1);
    if (literalText.trim() !== '' && !Number.isNaN(Number(literalText))) {
      continue;
    }

    diagnostics.push({
      ruleId: config.id,
      severity: config.severity,
      message: config.message,
      range: rangeFromContext(parent),
      docUrl: config.docUrl,
      hoverFacts: { field: fieldName, esType, literal: literalSide.getText() },
    });
  }

  return diagnostics;
};
