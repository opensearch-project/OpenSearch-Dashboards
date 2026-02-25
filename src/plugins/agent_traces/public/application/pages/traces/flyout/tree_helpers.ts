/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraceRow } from '../hooks/use_agent_traces';
import {
  getSpanCategory,
  getCategoryMeta,
  SpanCategory,
} from '../../../../services/span_categorization';

export interface TreeNode {
  label: string;
  id: string;
  children?: TreeNode[];
  kind?: string;
  tokens?: number | string;
  latency?: string;
  traceRow?: TraceRow;
}

export interface TimelineSpan {
  node: TreeNode;
  depth: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  category: SpanCategory;
  categoryColor: string;
  hasChildren: boolean;
}

export const TIMELINE_ROW_HEIGHT = 28;

export const CATEGORY_BADGE_CLASS: Record<SpanCategory, string> = {
  AGENT: 'agent',
  LLM: 'llm',
  TOOL: 'tool',
  OTHER: 'other',
};

export const buildTreeFromTraceRow = (row: TraceRow): TreeNode => {
  const node: TreeNode = {
    label: row.name,
    id: row.id,
    kind: row.kind,
    tokens: row.totalTokens,
    latency: row.latency,
    traceRow: row,
    children: row.children?.map((child) => buildTreeFromTraceRow(child)),
  };

  return node;
};

export const flattenTree = (nodes: TreeNode[], result: TreeNode[] = []): TreeNode[] => {
  nodes.forEach((node) => {
    result.push(node);
    if (node.children) {
      flattenTree(node.children, result);
    }
  });
  return result;
};

export const countSpans = (nodes: TreeNode[]): number => {
  let count = 0;
  nodes.forEach((node) => {
    count += 1;
    if (node.children) {
      count += countSpans(node.children);
    }
  });
  return count;
};

export const sumTokens = (nodes: TreeNode[]): number => {
  let total = 0;
  nodes.forEach((node) => {
    if (typeof node.tokens === 'number') {
      total += node.tokens;
    }
    if (node.children) {
      total += sumTokens(node.children);
    }
  });
  return total;
};

export const parseLatencyMs = (latency?: string): number => {
  if (!latency || latency === '—') return 0;
  if (latency.endsWith('ms')) return parseFloat(latency) || 0;
  if (latency.endsWith('s')) return (parseFloat(latency) || 0) * 1000;
  return 0;
};

export const parseRawTimestampMs = (ts: unknown): number => {
  if (!ts || typeof ts !== 'string') return 0;
  let normalized = ts;
  if (ts.includes(' ') && !ts.includes('T')) {
    normalized = ts.replace(' ', 'T');
    if (!normalized.includes('Z') && !normalized.includes('+')) {
      normalized += 'Z';
    }
  }
  const ms = new Date(normalized).getTime();
  return isNaN(ms) ? 0 : ms;
};

export const extractTimestamps = (node: TreeNode): { startMs: number; endMs: number } => {
  const raw = node.traceRow?.rawDocument;
  if (raw) {
    const rawStart = raw.startTime;
    const s = parseRawTimestampMs(rawStart);
    if (s > 0) {
      // Prefer durationInNanos for sub-ms precision; fall back to endTime.
      const durationNanos = (raw.durationInNanos as number) || 0;
      if (durationNanos > 0) {
        return { startMs: s, endMs: s + durationNanos / 1_000_000 };
      }
      const e = parseRawTimestampMs(raw.endTime);
      if (e > 0) return { startMs: s, endMs: e };
    }
  }
  return { startMs: 0, endMs: 0 };
};

export const flattenVisibleNodes = (
  nodes: TreeNode[],
  expanded: Set<string>,
  depth = 0
): TimelineSpan[] => {
  const result: TimelineSpan[] = [];
  for (const node of nodes) {
    const { startMs, endMs } = extractTimestamps(node);
    const category = node.traceRow ? getSpanCategory(node.traceRow) : 'OTHER';
    const meta = getCategoryMeta(category);
    result.push({
      node,
      depth,
      startMs,
      endMs,
      durationMs: Math.max(0, endMs - startMs),
      category,
      categoryColor: meta.color,
      hasChildren: (node.children?.length || 0) > 0,
    });
    if (node.children && node.children.length > 0 && expanded.has(node.id)) {
      result.push(...flattenVisibleNodes(node.children, expanded, depth + 1));
    }
  }
  return result;
};

export const calculateTimelineRange = (
  nodes: TreeNode[]
): { minMs: number; maxMs: number; durationMs: number } => {
  let minMs = Infinity;
  let maxMs = -Infinity;
  const walk = (ns: TreeNode[]) => {
    for (const n of ns) {
      const { startMs, endMs } = extractTimestamps(n);
      if (startMs > 0 && startMs < minMs) minMs = startMs;
      if (endMs > 0 && endMs > maxMs) maxMs = endMs;
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  if (minMs === Infinity || maxMs === -Infinity) {
    return { minMs: 0, maxMs: 0, durationMs: 0 };
  }
  return { minMs, maxMs, durationMs: maxMs - minMs };
};
