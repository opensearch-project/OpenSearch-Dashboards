/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { buildPipelineShape, collectAlternateSourceSubtrees } from '../pipeline_shape';
import { rangeFromContext } from '../range_utils';

// eventstats is intentionally excluded — its by-clause window loses sort order.
const ORDER_PRESERVING_COMMANDS = new Set([
  'evalCommand',
  'whereCommand',
  'fieldsCommand',
  'tableCommand',
  'headCommand',
  'parseCommand',
  'grokCommand',
  'rexCommand',
  'spathCommand',
  'fillnullCommand',
  'expandCommand',
  'flattenCommand',
  'patternsCommand',
  'renameCommand',
  'regexCommand',
  'reverseCommand',
  'appendcolCommand',
  'dedupCommand',
  'streamstatsCommand',
  'binCommand',
]);

export const headWithoutSortDetector: Detector = (tree, config, _context, ruleNameToIndex) => {
  const diagnostics: Diagnostic[] = [];
  const { stages } = buildPipelineShape(tree, ruleNameToIndex);

  const altRoots = collectAlternateSourceSubtrees(tree, ruleNameToIndex);
  const isInsideAltSource = (node: ParserRuleContext): boolean => {
    // Walk from parent so top-level append/lookup is analyzed as order-destroying,
    // while stages inside their bracketed sub-pipeline are still pruned.
    for (
      let n: ParserRuleContext | null = node.parent as ParserRuleContext | null;
      n;
      n = n.parent as ParserRuleContext | null
    ) {
      if (altRoots.has(n)) {
        return true;
      }
    }
    return false;
  };

  let sawSort = false;
  for (const stage of stages) {
    if (isInsideAltSource(stage.node)) {
      continue;
    }
    if (stage.command === 'sortCommand') {
      sawSort = true;
      continue;
    }
    if (sawSort && !ORDER_PRESERVING_COMMANDS.has(stage.command)) {
      sawSort = false;
    }
    if (stage.command === 'headCommand') {
      if (!sawSort) {
        diagnostics.push({
          ruleId: config.id,
          severity: config.severity,
          message: config.message,
          range: rangeFromContext(stage.node),
          docUrl: config.docUrl,
        });
      }
    }
  }

  return diagnostics;
};
