/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllChildrenByRule, findAllDescendantsByRule, isRuleNode } from '../rule_index';
import { rangeFromContext } from '../range_utils';

// Engine ground truth: union with fewer than two datasets throws
// "Union command requires at least two datasets" (CalciteRelNodeVisitor).
// Runtime-only + Calcite-gated, minVersion 3.7.0.
//
// `unionCommand` is legal both query-initial (grammar rule `pplCommands`) and
// mid-pipeline (grammar rule `commands`). Mid-pipeline, the upstream pipeline is
// the implicit first dataset (Union.attach prepends it; Calcite counts it), so a
// single explicit `unionDataset` is valid — e.g. `... | union [subsearch]`. We
// only enforce the ≥2 rule when the union is query-initial, discriminated by a
// `pplCommands` parent. A positive gate keeps us silent whenever the parent can't
// be resolved to `pplCommands` (fragments, pipe-first parses), which is the safe
// default for an error-severity rule.

export const unionMinDatasetsDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  if (context.isCalcite !== true) {
    return [];
  }

  const pplCommandsIndex = ruleNameToIndex('pplCommands');
  if (pplCommandsIndex === -1) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  // `unionCommand` is runtime-only; absent on the compiled surface → [].
  const commands = findAllDescendantsByRule(tree, ruleNameToIndex, 'unionCommand');

  for (const command of commands) {
    const parent = command.parent;
    const isQueryInitial = isRuleNode(parent) && parent.ruleIndex === pplCommandsIndex;
    if (!isQueryInitial) {
      continue;
    }

    const datasets = findAllChildrenByRule(command, ruleNameToIndex, 'unionDataset');
    if (datasets.length < 2) {
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
