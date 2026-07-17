/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParserRuleContext } from 'antlr4ng';
import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllDescendantsByRule } from '../rule_index';
import { rangeFromContext } from '../range_utils';

// Engine ground truth: `dedup consecutive=true` throws CalciteUnsupportedException
// which is unconditionally caught by the Calcite-to-v2 fallback, and v2's
// DedupeOperator supports it. So the query succeeds via fallback (a warning),
// and only on Calcite sources.

/**
 * Scan the flattened token text of a `dedupCommand` for `consecutive=true`,
 * tolerant of whitespace between tokens. The grammar collapses labeled
 * alternatives, so a token-text scan is the reliable way to read the boolean.
 */
function hasConsecutiveTrue(command: ParserRuleContext): boolean {
  const text = command.getText().toLowerCase();
  const match = /consecutive=(true|false)/.exec(text);
  return match ? match[1] === 'true' : false;
}

export const dedupConsecutiveUnsupportedDetector: Detector = (
  tree,
  config,
  context,
  ruleNameToIndex
) => {
  // Calcite gating is also enforced by the version filter, but guard here too
  // so a direct detector invocation respects the engine predicate.
  if (context.isCalcite !== true) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const commands = findAllDescendantsByRule(tree, ruleNameToIndex, 'dedupCommand');

  for (const command of commands) {
    if (hasConsecutiveTrue(command)) {
      diagnostics.push({
        ruleId: config.id,
        severity: config.severity,
        message: config.message,
        range: rangeFromContext(command),
        docUrl: config.docUrl,
      });
    }
  }

  return diagnostics;
};
