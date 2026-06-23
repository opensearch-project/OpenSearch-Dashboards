/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { buildPipelineShape, collectAlternateSourceSubtrees } from '../pipeline_shape';
import { rangeFromContext } from '../range_utils';

const ORDER_PRESERVING_COMMANDS = new Set([
  'evalCommand',
  'whereCommand',
  'fieldsCommand',
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
]);

export const headWithoutSortDetector: Detector = (tree, config, _context, ruleNameToIndex) => {
  const diagnostics: Diagnostic[] = [];
  const { stages } = buildPipelineShape(tree, ruleNameToIndex);

  // A sort inside a subquery does not order the outer pipeline.
  const altRoots = collectAlternateSourceSubtrees(tree, ruleNameToIndex);
  const isInsideAltSource = (node: ParserRuleContext): boolean => {
    for (let n: ParserRuleContext | null = node; n; n = n.parent as ParserRuleContext | null) {
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
          message: 'head without a preceding sort returns nondeterministic rows.',
          range: rangeFromContext(stage.node),
          docUrl: config.docUrl,
        });
      }
    }
  }

  return diagnostics;
};
