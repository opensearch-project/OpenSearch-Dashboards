/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllDescendantsByRule, findChildByRule } from '../rule_index';
import { rangeFromContext } from '../range_utils';
import { parseFieldPath } from '../field_path';

// Ground truth (#5065): OpenSearch has no literal `array` esType; a primitive
// field can still hold multiple values, and the mapping does not record that.
// So the only mapping-level evidence of an array-like field is a `nested` or
// `object` type. This rule ships DISABLED BY DEFAULT (catalog `enabled:false`):
// enabling it would label valid primitive arrays as non-arrays. Self-suppresses
// without a typeMap.
//
// `expandCommand` exists only on the compiled-simplified grammar; on the runtime
// bundle `findAllDescendantsByRule` returns [] (rule name absent), so this
// no-ops cleanly there without an explicit surface guard.
const ARRAY_LIKE_TYPES: ReadonlySet<string> = new Set(['nested', 'object']);

export const expandOnNonArrayDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  const typeMap = context.typeMap;
  if (!typeMap || typeMap.size === 0) {
    return []; // self-suppress without type metadata
  }

  const diagnostics: Diagnostic[] = [];
  const commands = findAllDescendantsByRule(tree, ruleNameToIndex, 'expandCommand');

  for (const command of commands) {
    const fieldExpr = findChildByRule(command, ruleNameToIndex, 'fieldExpression');
    if (!fieldExpr) {
      continue;
    }
    // Exact canonical lookup: an ancestor's type must not classify a child.
    const parsed = parseFieldPath(fieldExpr.getText());
    if (!parsed) {
      continue; // malformed quoted path — suppress rather than guess
    }
    const esType = typeMap.get(parsed.canonical);
    // Only flag when we know the type and it is not array-like.
    if (esType !== undefined && !ARRAY_LIKE_TYPES.has(esType)) {
      diagnostics.push({
        ruleId: config.id,
        severity: config.severity,
        message: config.message,
        range: rangeFromContext(fieldExpr),
        docUrl: config.docUrl,
        hoverFacts: { field: parsed.canonical, esType },
      });
    }
  }

  return diagnostics;
};
