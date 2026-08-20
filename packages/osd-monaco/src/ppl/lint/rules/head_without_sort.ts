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
  ORDER_ESTABLISHING_COMMANDS,
  ORDER_PRESERVING_COMMANDS,
} from '../pipeline_shape';
import { rangeFromContext } from '../range_utils';

export const headWithoutSortDetector: Detector = (tree, config, _context, ruleNameToIndex) => {
  const diagnostics: Diagnostic[] = [];
  const { stages } = buildPipelineShape(tree, ruleNameToIndex);

  const altRoots = collectAlternateSourceSubtrees(tree, ruleNameToIndex);

  // Ordering comes from the shared command classification in pipeline_shape, so
  // a newly supported command is classified once for every consumer rather than
  // silently defaulting to order-preserving here.
  let sawSort = false;
  for (const stage of stages) {
    if (isInsideAltSource(stage.node, altRoots, true)) {
      continue;
    }
    if (ORDER_ESTABLISHING_COMMANDS.has(stage.command)) {
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
