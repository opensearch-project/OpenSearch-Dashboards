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
  isResidualFilterRel,
  isResidualFilterRelOp,
  physicalPlanText,
} from './explain_tree_utils';

/** Increment when outcome interpretation changes so probe cache keys remain sound. */
export const EXPLAIN_OUTCOME_DETECTOR_VERSION = '2';

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

/**
 * The per-relation signals both plan formats reduce to. Keeping the reduction
 * per scope (one rel, or one line of a legacy plan) is what makes the evidence
 * relation-local: a filter pushed on the scan cannot mask a residual filter on
 * a downstream Calc, and vice versa.
 */
interface ScopeSignals {
  /** The relation's operator name (text before `(` for a legacy line). */
  relOp: string;
  /** Text carrying push tags (`FILTER->` etc.) for this relation only. */
  pushDownText: string;
  /** Text carrying the compiled-script discriminator for this relation only. */
  scriptCarrierText: string;
  /** True when this relation carries a residual coordinator filter condition. */
  hasResidualCondition: boolean;
  scope: string;
}

/**
 * The single signal cascade shared by the tree and legacy paths, so the two
 * formats cannot drift in how they classify the same query.
 *
 * Coordinator aggregation/sort match on the relOp *suffix*: Calcite rel names
 * are `<Convention><Operator>` (EnumerableAggregate, EnumerableSortedAggregate,
 * EnumerableSort), so a suffix match is anchored — a bare substring match would
 * misread EnumerableSortMergeJoin (a join, not a sort) as a coordinator sort
 * and miss EnumerableSortedAggregate (which does not contain
 * "EnumerableAggregate").
 */
function addScopeOutcomes(
  evidence: ExplainOutcomeEvidence[],
  seen: Set<string>,
  signals: ScopeSignals,
  format: 'tree' | 'legacy'
): void {
  const { relOp, pushDownText, scriptCarrierText, hasResidualCondition, scope } = signals;
  const hasFilter = pushDownText.includes('FILTER->');
  const hasFilterScript =
    pushDownText.includes('SCRIPT->') && scriptCarrierText.includes(SCRIPT_DISCRIMINATOR);
  const hasAggregation = pushDownText.includes('AGGREGATION->');
  const hasSortExpression =
    pushDownText.includes('SORT_EXPR->') && scriptCarrierText.includes(SCRIPT_DISCRIMINATOR);
  const hasSort = pushDownText.includes('SORT->');

  if (hasFilter) {
    add(evidence, seen, 'filter:native', scope, format);
  }
  if (hasFilterScript) {
    add(evidence, seen, 'filter:script', scope, format);
  }
  if (hasResidualCondition && !hasFilter && !hasFilterScript) {
    add(evidence, seen, 'filter:coordinator', scope, format);
  }

  if (hasAggregation) {
    add(evidence, seen, 'aggregation:native', scope, format);
  }
  if (relOp.endsWith('Aggregate') && !hasAggregation) {
    add(evidence, seen, 'aggregation:coordinator', scope, format);
  }

  if (hasSort) {
    add(evidence, seen, 'sort:native', scope, format);
  }
  if (hasSortExpression) {
    add(evidence, seen, 'sort:script', scope, format);
  }
  if (relOp.endsWith('Sort') && !hasSort && !hasSortExpression) {
    add(evidence, seen, 'sort:coordinator', scope, format);
  }
}

function detectTreeOutcomes(plan: ExplainPlan): ExplainOutcomeEvidence[] {
  const evidence: ExplainOutcomeEvidence[] = [];
  const seen = new Set<string>();

  getPhysicalRels(plan).forEach((rel, index) => {
    addScopeOutcomes(
      evidence,
      seen,
      {
        relOp: String(rel.relOp ?? ''),
        pushDownText: getPushDownContext(rel),
        scriptCarrierText: getSourceBuilder(rel),
        hasResidualCondition: isResidualFilterRel(rel),
        scope: relScope(rel, index),
      },
      'tree'
    );
  });

  return evidence;
}

/** The relation's operator name on one line of a formatted legacy plan. */
function parseLegacyRelOp(line: string): string {
  const trimmed = line.trimStart();
  const parenIndex = trimmed.indexOf('(');
  return (parenIndex === -1 ? trimmed : trimmed.slice(0, parenIndex)).trim();
}

/**
 * Legacy plans expose one formatted string with one relation per line, so the
 * per-line pass keeps the same relation-locality as the tree path: a `FILTER->`
 * pushed on the index-scan line cannot mask a residual `$condition=` on a
 * downstream Calc line (partial pushdown, e.g. a second `where` after
 * `eventstats`). Recognize the version-tested tags and residual operators, but
 * never infer source ownership from them.
 */
function detectLegacyOutcomes(plan: ExplainPlan): ExplainOutcomeEvidence[] {
  const text = physicalPlanText(plan);
  if (!text) {
    return [];
  }

  const evidence: ExplainOutcomeEvidence[] = [];
  const seen = new Set<string>();

  text.split('\n').forEach((line, index) => {
    const relOp = parseLegacyRelOp(line);
    if (!relOp) {
      return;
    }
    addScopeOutcomes(
      evidence,
      seen,
      {
        relOp,
        pushDownText: line,
        scriptCarrierText: line,
        hasResidualCondition: isResidualFilterRelOp(relOp) && line.includes('$condition='),
        scope: `line:${index}`,
      },
      'legacy'
    );
  });

  return evidence;
}

export function detectExplainOutcomes(plan: ExplainPlan): ExplainOutcomeEvidence[] {
  if (!plan.isCalcite) {
    return [];
  }
  // toExplainPlan makes the formats mutually exclusive per field: `physical` is
  // either a rel tree or a legacy string, never both. An unrecognized tree
  // fails closed (no evidence) rather than falling back to text it cannot have.
  return plan.physicalTree ? detectTreeOutcomes(plan) : detectLegacyOutcomes(plan);
}

export function hasExplainOutcome(plan: ExplainPlan, outcome: ExplainOutcome): boolean {
  return detectExplainOutcomes(plan).some((evidence) => evidence.outcome === outcome);
}
