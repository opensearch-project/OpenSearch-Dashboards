/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ExplainOutcome,
  ExplainOutcomeEvidence,
  ExplainPlan,
  ExplainRelNode,
} from './explain_types';
import {
  getPhysicalRels,
  getPushDownContext,
  getSourceBuilder,
  physicalPlanText,
  relContainsCondition,
  relOpIncludes,
} from './explain_tree_utils';

/** Increment when outcome interpretation changes so probe cache keys remain sound. */
export const EXPLAIN_OUTCOME_DETECTOR_VERSION = '1';

const SCRIPT_DISCRIMINATOR = 'opensearch_compounded_script';

function add(
  evidence: ExplainOutcomeEvidence[],
  seen: Set<string>,
  outcome: ExplainOutcome,
  scope: string,
  format: 'tree' | 'legacy'
): void {
  const key = `${outcome}:${scope}:${format}`;
  if (!seen.has(key)) {
    seen.add(key);
    evidence.push({ outcome, scope, format });
  }
}

function relScope(rel: ExplainRelNode, index: number): string {
  return rel.id == null ? `rel:${index}` : `rel:${String(rel.id)}`;
}

function detectTreeOutcomes(plan: ExplainPlan): ExplainOutcomeEvidence[] {
  const evidence: ExplainOutcomeEvidence[] = [];
  const seen = new Set<string>();

  getPhysicalRels(plan).forEach((rel, index) => {
    const scope = relScope(rel, index);
    const pushDown = getPushDownContext(rel);
    const sourceBuilder = getSourceBuilder(rel);
    const hasFilter = pushDown.includes('FILTER->');
    const hasFilterScript =
      pushDown.includes('SCRIPT->') && sourceBuilder.includes(SCRIPT_DISCRIMINATOR);
    const hasAggregation = pushDown.includes('AGGREGATION->');
    const hasSortExpression =
      pushDown.includes('SORT_EXPR->') && sourceBuilder.includes(SCRIPT_DISCRIMINATOR);
    const hasSort = pushDown.includes('SORT->');

    if (hasFilter) {
      add(evidence, seen, 'filter:native', scope, 'tree');
    }
    if (hasFilterScript) {
      add(evidence, seen, 'filter:script', scope, 'tree');
    }
    if (relContainsCondition(rel) && !hasFilter && !hasFilterScript) {
      add(evidence, seen, 'filter:coordinator', scope, 'tree');
    }

    if (hasAggregation) {
      add(evidence, seen, 'aggregation:native', scope, 'tree');
    }
    if (relOpIncludes(rel, 'EnumerableAggregate') && !hasAggregation) {
      add(evidence, seen, 'aggregation:coordinator', scope, 'tree');
    }

    if (hasSort) {
      add(evidence, seen, 'sort:native', scope, 'tree');
    }
    if (hasSortExpression) {
      add(evidence, seen, 'sort:script', scope, 'tree');
    }
    if (relOpIncludes(rel, 'EnumerableSort') && !hasSort && !hasSortExpression) {
      add(evidence, seen, 'sort:coordinator', scope, 'tree');
    }
  });

  return evidence;
}

/**
 * Legacy plans expose only one formatted string. Recognize the version-tested
 * tags and residual operators, but never infer source ownership from them.
 */
function detectLegacyOutcomes(plan: ExplainPlan): ExplainOutcomeEvidence[] {
  const text = physicalPlanText(plan);
  if (!text) {
    return [];
  }

  const evidence: ExplainOutcomeEvidence[] = [];
  const seen = new Set<string>();
  const scope = 'plan';
  const hasFilter = text.includes('FILTER->');
  const hasFilterScript = text.includes('SCRIPT->') && text.includes(SCRIPT_DISCRIMINATOR);
  const hasAggregation = text.includes('AGGREGATION->');
  const hasSortExpression = text.includes('SORT_EXPR->') && text.includes(SCRIPT_DISCRIMINATOR);
  const hasSort = text.includes('SORT->');

  if (hasFilter) {
    add(evidence, seen, 'filter:native', scope, 'legacy');
  }
  if (hasFilterScript) {
    add(evidence, seen, 'filter:script', scope, 'legacy');
  }
  if (text.includes('$condition=') && !hasFilter && !hasFilterScript) {
    add(evidence, seen, 'filter:coordinator', scope, 'legacy');
  }

  if (hasAggregation) {
    add(evidence, seen, 'aggregation:native', scope, 'legacy');
  }
  if (text.includes('EnumerableAggregate') && !hasAggregation) {
    add(evidence, seen, 'aggregation:coordinator', scope, 'legacy');
  }

  if (hasSort) {
    add(evidence, seen, 'sort:native', scope, 'legacy');
  }
  if (hasSortExpression) {
    add(evidence, seen, 'sort:script', scope, 'legacy');
  }
  if (text.includes('EnumerableSort') && !hasSort && !hasSortExpression) {
    add(evidence, seen, 'sort:coordinator', scope, 'legacy');
  }

  return evidence;
}

export function detectExplainOutcomes(plan: ExplainPlan): ExplainOutcomeEvidence[] {
  if (!plan.isCalcite) {
    return [];
  }
  const treeEvidence = detectTreeOutcomes(plan);
  return treeEvidence.length > 0 || plan.physicalTree ? treeEvidence : detectLegacyOutcomes(plan);
}

export function hasExplainOutcome(plan: ExplainPlan, outcome: ExplainOutcome): boolean {
  return detectExplainOutcomes(plan).some((evidence) => evidence.outcome === outcome);
}
