/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllDescendantsByRule, findChildByRule } from '../rule_index';
import { rangeFromContext } from '../range_utils';
import { parseFieldPath } from '../field_path';

// Live-verified (OpenSearch 3.7): these aggs on a text/keyword field silently return null.
// count/min/max are type-agnostic; percentile* parse via a different alternative, so both are excluded.
const NUMERIC_ONLY_AGGS: ReadonlySet<string> = new Set([
  'avg',
  'sum',
  'var_samp',
  'var_pop',
  'stddev_samp',
  'stddev_pop',
  'median',
]);

const TEXT_TYPES: ReadonlySet<string> = new Set(['text', 'keyword']);

export const aggOnTextDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  const typeMap = context.typeMap;
  if (!typeMap || typeMap.size === 0) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const statsFunctions = findAllDescendantsByRule(tree, ruleNameToIndex, 'statsFunction');

  for (const statsFunction of statsFunctions) {
    const nameNode = findChildByRule(statsFunction, ruleNameToIndex, 'statsFunctionName');
    if (!nameNode) {
      continue;
    }
    const aggName = nameNode.getText().toLowerCase();
    if (!NUMERIC_ONLY_AGGS.has(aggName)) {
      continue;
    }

    // Only flag a single bare field argument; leave computed args like avg(balance / 2) alone.
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
      continue;
    }

    // Match on the full canonical path, not a prefix, so an ancestor's type never classifies a child.
    const parsed = parseFieldPath(fieldExpr.getText());
    if (!parsed) {
      continue;
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
