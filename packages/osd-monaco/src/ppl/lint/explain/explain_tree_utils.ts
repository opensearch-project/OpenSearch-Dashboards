/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExplainPlan, ExplainRelNode } from './explain_types';

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? '');
  } catch {
    return '';
  }
}

export function valueText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(valueText).join('\n');
  }
  if (value && typeof value === 'object') {
    return safeStringify(value);
  }
  return value == null ? '' : String(value);
}

/** Physical rel nodes from a `json_tree` plan. */
export function getPhysicalRels(plan: ExplainPlan): ExplainRelNode[] {
  const rels = plan.physicalTree?.rels;
  return Array.isArray(rels) ? rels : [];
}

export function relOpIncludes(rel: ExplainRelNode, needle: string): boolean {
  return String(rel.relOp ?? '').includes(needle);
}

export function hasRelOp(plan: ExplainPlan, needle: string): boolean {
  return getPhysicalRels(plan).some((rel) => relOpIncludes(rel, needle));
}

export function getPushDownContext(rel: ExplainRelNode): string {
  return valueText(rel.PushDownContext);
}

export function getSourceBuilder(rel: ExplainRelNode): string {
  return valueText(rel.sourceBuilder);
}

export function hasPushDownTag(plan: ExplainPlan, tag: string): boolean {
  return getPhysicalRels(plan).some((rel) => getPushDownContext(rel).includes(tag));
}

export function sourceBuilderText(plan: ExplainPlan): string {
  return getPhysicalRels(plan)
    .map((rel) => valueText(rel.sourceBuilder))
    .join('\n');
}

/** Legacy physical explain text, present only for old clusters/fallback tests. */
export function physicalPlanText(plan: ExplainPlan): string {
  return plan.physicalText ?? '';
}

/**
 * Detect a residual filter condition on coordinator-side Calc rels. RelJsonWriter
 * shape has varied across builds, so prefer explicit condition-like fields and
 * fall back to a small JSON-string canary for `$condition`.
 */
export function relTreeContainsCondition(plan: ExplainPlan): boolean {
  return getPhysicalRels(plan).some(isResidualFilterRel);
}

// Calcite rel names are <Convention><Operator> (EnumerableCalc, LogicalFilter),
// so suffix-matching the operator is anchored: it cannot collide with rels that
// merely *contain* the operator name ("CalciteEnumerableIndexScan" contains
// "Calc"; "EnumerableSortMergeJoin" contains "Sort").
const RESIDUAL_FILTER_REL_SUFFIXES = ['Calc', 'Filter'];

/**
 * True when a rel operator name belongs to the Calc/Filter family — the only
 * rels that can carry a residual (coordinator-side) filter condition. Join rels
 * also serialize a `condition` attribute (their join predicate), but a join
 * condition always evaluates at the coordinator by design and must not be
 * reported as a filter that failed to push down.
 */
export function isResidualFilterRelOp(relOp: string): boolean {
  return RESIDUAL_FILTER_REL_SUFFIXES.some((suffix) => relOp.endsWith(suffix));
}

export function isResidualFilterRel(rel: ExplainRelNode): boolean {
  if (!isResidualFilterRelOp(String(rel.relOp ?? ''))) {
    return false;
  }
  const keys = Object.keys(rel);
  if (keys.some((key) => key === '$condition' || key.toLowerCase() === 'condition')) {
    return true;
  }
  return safeStringify(rel).includes('$condition');
}
