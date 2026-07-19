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

// Engine ground truth (verified live, OpenSearch 3.7): comparing a numeric field
// to a NON-coercible string literal (e.g. `age = "thirty"`) returns 0 rows with
// HTTP 200 and no error — a silent failure. A coercible quoted number like
// `age = "32"` works correctly and must NOT be flagged. Warning severity;
// self-suppresses without a typeMap.
//
// SCOPE: deliberately the narrow literal-vs-field equality form. The general
// type-mismatch case (computed expressions, field-vs-field) requires dataflow
// tracking and is deferred.
//
// OPERATORS: only `=` and `==` are live-verified. `!=`/`<>` are deferred until a
// live engine probe establishes their exact result semantics for non-coercible
// literals — including them now risks a false positive on an unverified path.
//
// Grammar anchor (both surfaces): an equality comparison parses to an
// `expression`/`comparisonExpression` whose children are [left,
// comparisonOperator, right]. `comparisonOperator` exists on BOTH the compiled
// simplified grammar and the runtime grammar, so this detector keys on it rather
// than on the runtime-only `comparisonExpression` rule.
const VERIFIED_OPERATORS: ReadonlySet<string> = new Set(['=', '==']);

// Kept in sync with the platform's numeric esType list (OSD_FIELD_TYPES.NUMBER
// in data/common/osd_field_types/osd_field_types_factory.ts).
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

/** Is this operand a bare string literal (e.g. `"thirty"`), not a computed expr? */
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
  // Confirm the operand actually wraps a stringLiteral node spanning its whole
  // text (rejects `"a" + "b"`, which also starts/ends with a quote).
  const literals = findAllDescendantsByRule(operand, ruleNameToIndex, 'stringLiteral');
  return literals.some((lit) => lit.getText() === text);
}

/**
 * If this operand is a bare field reference, return its canonical name;
 * otherwise undefined. A computed operand (more than the field name) is rejected.
 */
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
    return undefined; // operand is more than just the bare field
  }
  return parseFieldPath(fieldText)?.canonical;
}

export const typeMismatchNumericDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  const typeMap = context.typeMap;
  if (!typeMap || typeMap.size === 0) {
    return []; // self-suppress without type metadata
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
    // The operands are the rule-node children flanking the operator. The
    // `comparisonOperator` is itself a rule node, so exclude it explicitly.
    const operands = (parent.children ?? []).filter(
      (c): c is ParserRuleContext => isRuleNode(c) && c !== operator
    );
    if (operands.length !== 2) {
      continue;
    }
    const [left, right] = operands;

    // One side must be a bare field, the other a bare string literal. Support
    // both operand orders.
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
    // The engine coerces quoted *numeric* strings correctly (e.g. "32"); only a
    // non-numeric string literal is a silent failure.
    //
    // `Number()` is deliberately used as a PERMISSIVE oracle: it accepts a few
    // forms the engine's Long/Double parse would reject (hex `"0x10"`, `"0o17"`,
    // `"Infinity"`, whitespace-padded `" 32 "`). Treating those as coercible means
    // this rule stays silent on them — a false negative, never a false positive.
    // That direction is intentional: flagging them would assume the engine rejects
    // them, and the plan requires live-engine evidence before widening detection.
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
