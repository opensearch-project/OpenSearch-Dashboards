/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import {
  buildPipelineShape,
  collectAlternateSourceSubtrees,
  isInsideAltSource,
} from '../pipeline_shape';
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

  let sawSort = false;
  for (const stage of stages) {
    if (isInsideAltSource(stage.node, altRoots, true)) {
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
