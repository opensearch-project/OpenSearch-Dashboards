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
  return getPhysicalRels(plan).some(relContainsCondition);
}

export function relContainsCondition(rel: ExplainRelNode): boolean {
  const keys = Object.keys(rel);
  if (keys.some((key) => key === '$condition' || key.toLowerCase() === 'condition')) {
    return true;
  }
  return safeStringify(rel).includes('$condition');
}
