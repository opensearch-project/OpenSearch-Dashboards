/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { TraceRow } from '../application/pages/traces/hooks/use_agent_traces';

export type SpanCategory = 'AGENT' | 'LLM' | 'TOOL' | 'EMBEDDINGS' | 'RETRIEVAL' | 'OTHER';

export interface CategorizedSpan extends TraceRow {
  category: SpanCategory;
  categoryLabel: string;
  categoryColor: string;
  displayName: string;
}

interface CategoryMeta {
  color: string;
  bgColor: string;
  textColor: string;
  label: string;
}

function getCategoryColor(category: SpanCategory): string {
  switch (category) {
    case 'LLM':
      return euiThemeVars.euiColorVis3;
    case 'AGENT':
      return euiThemeVars.euiColorPrimary;
    case 'EMBEDDINGS':
      return euiThemeVars.euiColorVis1;
    case 'TOOL':
      return euiThemeVars.euiColorDarkShade;
    case 'RETRIEVAL':
      return euiThemeVars.euiColorVis4;
    case 'OTHER':
    default:
      return euiThemeVars.euiColorMediumShade;
  }
}

const CATEGORY_LABEL: Record<SpanCategory, string> = {
  AGENT: 'Agent',
  LLM: 'LLM',
  TOOL: 'Tool',
  EMBEDDINGS: 'Embeddings',
  RETRIEVAL: 'Retrieval',
  OTHER: 'Other',
};

export function getCategoryMeta(category: SpanCategory): CategoryMeta {
  const color = getCategoryColor(category);
  return {
    color,
    bgColor: hexToRgba(color, 0.12),
    textColor: color,
    label: CATEGORY_LABEL[category],
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Well-known gen_ai.operation.name values mapped to categories.
 * See: https://opentelemetry.io/docs/specs/semconv/attributes-registry/gen-ai/
 */
const OPERATION_CATEGORY: Record<string, SpanCategory> = {
  chat: 'LLM',
  text_completion: 'LLM',
  generate_content: 'LLM',
  embeddings: 'EMBEDDINGS',
  execute_tool: 'TOOL',
  retrieval: 'RETRIEVAL',
  invoke_agent: 'AGENT',
  create_agent: 'AGENT',
};

/** Reverse mapping: category → list of operation names that belong to it. */
const CATEGORY_OPERATIONS: Record<SpanCategory, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const [op, cat] of Object.entries(OPERATION_CATEGORY)) {
    (map[cat] ??= []).push(op);
  }
  return map as Record<SpanCategory, string[]>;
})();

/** Get all operation names that map to a given category. */
export function getOperationNamesForCategory(category: SpanCategory): string[] {
  return CATEGORY_OPERATIONS[category] || [];
}

/**
 * Determine span category from the gen_ai.operation.name attribute.
 * The operation name is stored in TraceRow.kind.
 */
export function getSpanCategory(span: { kind?: string }): SpanCategory {
  const operationName = span.kind?.toLowerCase() || '';
  return OPERATION_CATEGORY[operationName] ?? 'OTHER';
}

function categorizeSpan(span: TraceRow): CategorizedSpan {
  const category = getSpanCategory(span);
  const meta = getCategoryMeta(category);
  const name = span.name || 'Unknown';

  return {
    ...span,
    category,
    categoryLabel: meta.label,
    categoryColor: meta.color,
    displayName: name.length > 40 ? name.substring(0, 37) + '...' : name,
  };
}

export function categorizeSpanTree(spans: TraceRow[]): CategorizedSpan[] {
  return spans.map((span) => {
    const categorized = categorizeSpan(span);
    if (span.children && span.children.length > 0) {
      categorized.children = categorizeSpanTree(span.children);
    }
    return categorized;
  });
}
