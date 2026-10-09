/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraceRow } from '../hooks/tree_utils';
import { parseLatencyMs, parseTimestampMs } from '../trace_details/utils/span_timerange_utils';
import {
  getSpanCategory,
  getCategoryMeta,
  SpanCategory,
} from '../../../../services/span_categorization';

export { parseLatencyMs, parseTimestampMs };

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

export const extractTimestamps = (node: TreeNode): { startMs: number; endMs: number } => {
  const raw = node.traceRow?.rawDocument;
  if (raw) {
    const rawStart = raw.startTime;
    const s = parseTimestampMs(rawStart);
    if (s > 0) {
      // Prefer durationInNanos for sub-ms precision; fall back to endTime.
      const durationNanos = (raw.durationInNanos as number) || 0;
      if (durationNanos > 0) {
        return { startMs: s, endMs: s + durationNanos / 1_000_000 };
      }
      const e = parseTimestampMs(raw.endTime);
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

/** Ids of all nodes that have children (used for expand all). */
export const collectExpandableIds = (
  nodes: TreeNode[],
  result = new Set<string>()
): Set<string> => {
  nodes.forEach((node) => {
    if (node.children && node.children.length > 0) {
      result.add(node.id);
      collectExpandableIds(node.children, result);
    }
  });
  return result;
};

/** Whether a span matches an in-trace search (name, kind, span id, status message, I/O). */
export const nodeMatchesQuery = (node: TreeNode, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const row = node.traceRow;
  const haystack = [
    node.label,
    node.kind,
    row?.spanId,
    row?.statusMessage,
    row?.input,
    row?.output,
  ];
  return haystack.some((value) => typeof value === 'string' && value.toLowerCase().includes(q));
};

/** Ids of spans matching the search, in tree (depth-first) order. */
export const findMatchingNodeIds = (flatNodes: TreeNode[], query: string): string[] =>
  flatNodes.filter((node) => nodeMatchesQuery(node, query)).map((node) => node.id);

/** Ids of error spans, in tree (depth-first) order. */
export const findErrorNodeIds = (flatNodes: TreeNode[]): string[] =>
  flatNodes.filter((node) => node.traceRow?.status === 'error').map((node) => node.id);

/**
 * The next (direction 1) or previous (-1) id in `ids` relative to the current node's
 * position in tree order, wrapping around. Returns undefined when `ids` is empty.
 */
export const stepToMatch = (
  flatNodes: TreeNode[],
  ids: string[],
  currentId: string | undefined,
  direction: 1 | -1
): string | undefined => {
  if (ids.length === 0) return undefined;
  const order = new Map(flatNodes.map((node, i) => [node.id, i]));
  const current = currentId !== undefined ? (order.get(currentId) ?? -1) : -1;
  const positions = ids.map((id) => order.get(id) ?? -1);
  if (direction === 1) {
    const next = positions.findIndex((p) => p > current);
    return ids[next >= 0 ? next : 0];
  }
  let prev = -1;
  positions.forEach((p, i) => {
    if (p < current) prev = i;
  });
  return ids[prev >= 0 ? prev : ids.length - 1];
};
