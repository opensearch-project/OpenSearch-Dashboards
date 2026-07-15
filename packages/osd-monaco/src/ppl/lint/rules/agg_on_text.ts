/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllDescendantsByRule, findChildByRule } from '../rule_index';
import { rangeFromContext } from '../range_utils';
import { parseFieldPath } from '../field_path';

// Engine ground truth (verified live, OpenSearch 3.7): a numeric aggregation
// (avg/sum/stddev/var/median) on a `text`/`keyword` field returns null with a
// `double` schema type and no error — a silent failure. This is a warning and
// self-suppresses without a typeMap.
//
// Grammar anchor (both surfaces):
//   statsFunction : ... | statsFunctionName LT_PRTHS functionArgs RT_PRTHS  # statsFunctionCall
//   statsFunctionName : AVG | COUNT | SUM | MIN | MAX | VAR_SAMP | VAR_POP
//                     | STDDEV_SAMP | STDDEV_POP | MEDIAN
//
// Exclusions:
//   - `count`/`min`/`max` are type-agnostic and deliberately excluded.
//   - `percentile`/`percentile_approx` use a dedicated argument shape
//     (`percentileAggFunction` on the runtime surface, comma-separated args on
//     both) and are excluded from this rule pending a separate live-verified
//     follow-up. They never reach here anyway: they parse through their own
//     alternative, so `statsFunctionName` is absent — but the exclusion is
//     documented so the follow-up is explicit.
const NUMERIC_ONLY_AGGS: ReadonlySet<string> = new Set([
  'avg',
  'sum',
  'var_samp',
  'var_pop',
  'stddev_samp',
  'stddev_pop',
  'median',
]);

// esTypes that hold non-numeric text and so cannot be numerically aggregated.
const TEXT_TYPES: ReadonlySet<string> = new Set(['text', 'keyword']);

export const aggOnTextDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  const typeMap = context.typeMap;
  if (!typeMap || typeMap.size === 0) {
    return []; // self-suppress without type metadata
  }

  const diagnostics: Diagnostic[] = [];
  const statsFunctions = findAllDescendantsByRule(tree, ruleNameToIndex, 'statsFunction');

  for (const statsFunction of statsFunctions) {
    const nameNode = findChildByRule(statsFunction, ruleNameToIndex, 'statsFunctionName');
    if (!nameNode) {
      continue; // count()/percentile(x,p)/take(...) route through other alternatives
    }
    const aggName = nameNode.getText().toLowerCase();
    if (!NUMERIC_ONLY_AGGS.has(aggName)) {
      continue;
    }

    // Resolve the aggregation argument. Open-world: only flag when the argument
    // is a single bare field (the functionArgs text equals the one field name).
    // A computed argument like `avg(balance / 2)` carries operators and is left
    // alone.
    const argsNode = findChildByRule(statsFunction, ruleNameToIndex, 'functionArgs');
    if (!argsNode) {
      continue;
    }
    const fieldExprs = findAllDescendantsByRule(argsNode, ruleNameToIndex, 'fieldExpression');
    if (fieldExprs.length !== 1) {
      continue;
    }
    const fieldExpr = fieldExprs[0];
    if (fieldExpr.getText() !== argsNode.getText()) {
      continue; // argument is more than just the bare field
    }

    // Exact canonical lookup: an ancestor's type must never classify a child, so
    // this uses the full canonical path, not a prefix.
    const parsed = parseFieldPath(fieldExpr.getText());
    if (!parsed) {
      continue; // malformed quoted path — suppress rather than guess
    }
    const esType = typeMap.get(parsed.canonical);
    if (esType !== undefined && TEXT_TYPES.has(esType)) {
      diagnostics.push({
        ruleId: config.id,
        severity: config.severity,
        message: config.message,
        range: rangeFromContext(statsFunction),
        docUrl: config.docUrl,
        hoverFacts: { field: parsed.canonical, esType, aggName },
      });
    }
  }

  return diagnostics;
};
