/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { TraceRow } from '../application/pages/traces/hooks/use_agent_traces';

export type SpanCategory =
  | 'AGENT'
  | 'LLM'
  | 'TOOL'
  | 'CONTENT'
  | 'EMBEDDINGS'
  | 'RETRIEVAL'
  | 'OTHER';

export interface CategorizedSpan extends TraceRow {
  category: SpanCategory;
  categoryLabel: string;
  categoryColor: string;
  categoryIcon: string;
  displayName: string;
}

interface CategoryMeta {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
}

function getCategoryColor(category: SpanCategory): string {
  switch (category) {
    case 'LLM':
      return euiThemeVars.euiColorVis2;
    case 'AGENT':
      return euiThemeVars.euiColorVis0;
    case 'EMBEDDINGS':
      return euiThemeVars.euiColorVis3;
    case 'TOOL':
      return euiThemeVars.euiColorVis6;
    case 'CONTENT':
      return euiThemeVars.euiColorVis4;
    case 'RETRIEVAL':
      return euiThemeVars.euiColorVis5;
    case 'OTHER':
      return euiThemeVars.euiColorMediumShade;
  }
}

const CATEGORY_STATIC: Record<SpanCategory, { icon: string; label: string }> = {
  AGENT: { icon: 'Bot', label: 'Agent' },
  LLM: { icon: 'Zap', label: 'LLM' },
  TOOL: { icon: 'Wrench', label: 'Tool' },
  CONTENT: { icon: 'Document', label: 'Content' },
  EMBEDDINGS: { icon: 'Aggregate', label: 'Embeddings' },
  RETRIEVAL: { icon: 'Search', label: 'Retrieval' },
  OTHER: { icon: 'Circle', label: 'Other' },
};

export function getCategoryMeta(category: SpanCategory): CategoryMeta {
  const color = getCategoryColor(category);
  const { icon, label } = CATEGORY_STATIC[category];
  return { color, bgColor: color, icon, label };
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Returns inline style for a category badge (kind badge).
 * Uses runtime theme colors so it adapts to light/dark mode.
 */
export function getCategoryBadgeStyle(
  category: SpanCategory
): { color: string; borderColor: string; backgroundColor: string } {
  const color = getCategoryColor(category);
  return {
    color,
    borderColor: color,
    backgroundColor: hexToRgba(color, 0.1),
  };
}

/**
 * Well-known gen_ai.operation.name values mapped to categories.
 * See: https://opentelemetry.io/docs/specs/semconv/attributes-registry/gen-ai/
 */
const OPERATION_CATEGORY: Record<string, SpanCategory> = {
  chat: 'LLM',
  text_completion: 'CONTENT',
  generate_content: 'CONTENT',
  embeddings: 'EMBEDDINGS',
  execute_tool: 'TOOL',
  retrieval: 'RETRIEVAL',
  invoke_agent: 'AGENT',
  create_agent: 'AGENT',
};

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
    categoryIcon: meta.icon,
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
