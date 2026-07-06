/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllChildrenByRule, findAllDescendantsByRule } from '../rule_index';
import { rangeFromContext } from '../range_utils';

// Engine ground truth: union with fewer than two datasets throws
// "Union command requires at least two datasets" (CalciteRelNodeVisitor).
// Runtime-only + Calcite-gated, minVersion 3.7.0.

export const unionMinDatasetsDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  if (context.isCalcite !== true) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  // `unionCommand` is runtime-only; absent on the compiled surface → [].
  const commands = findAllDescendantsByRule(tree, ruleNameToIndex, 'unionCommand');

  for (const command of commands) {
    const datasets = findAllChildrenByRule(command, ruleNameToIndex, 'unionDataset');
    if (datasets.length < 2) {
      diagnostics.push({
        ruleId: config.id,
        severity: config.severity,
        message: 'union requires at least two datasets.',
        range: rangeFromContext(command),
        docUrl: config.docUrl,
      });
    }
  }

  return diagnostics;
};
