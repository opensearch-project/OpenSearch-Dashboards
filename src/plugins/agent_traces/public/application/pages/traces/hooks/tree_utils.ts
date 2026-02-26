/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment-timezone';
import { AgentSpan, formatDuration, traceHitToAgentSpan } from './span_transforms';
import { parseTimestampMs } from '../trace_details/utils/span_timerange_utils';
import { TraceHit } from '../trace_details/traces/ppl_to_trace_hits';

// Format timestamp to readable date/time respecting the configured timezone.
// PPL returns timestamps without timezone indicator (e.g. "2025-05-29 03:11:25.292"),
// so we parse as UTC first, then convert to the configured timezone.
export const formatTimestamp = (timestamp: string, timezone: string): string => {
  if (!timestamp) return '—';
  const m = moment.utc(timestamp);
  if (!m.isValid()) return '—';
  return m.tz(timezone).format('MM/DD/YYYY, h:mm:ss.SSS A');
};

export interface BaseRow {
  id: string;
  spanId: string;
  traceId: string;
  parentSpanId: string | null;
  status: 'success' | 'error';
  kind: string;
  name: string;
  input: string;
  output: string;
  startTime: string;
  endTime: string;
  latency: string;
  totalTokens: number | string;
  totalCost: string;
  isExpandable?: boolean;
  isExpanded?: boolean;
  level?: number;
  children?: BaseRow[];
  rawDocument?: Record<string, unknown>;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

/** Set nesting levels recursively */
export const setLevels = (rows: BaseRow[], level: number): void => {
  rows.forEach((row) => {
    row.level = level;
    if (row.children && row.children.length > 0) {
      setLevels(row.children, level + 1);
    }
  });
};

/** Convert an AgentSpan to a row, using the provided timestamp formatter */
export const spanToRow = (
  span: AgentSpan,
  index: number,
  formatTs: (ts: string) => string
): BaseRow => ({
  id: span.spanId || `span-${index}`,
  spanId: span.spanId,
  traceId: span.traceId,
  parentSpanId: span.parentSpanId,
  status: span.statusCode === 0 || span.statusCode === 1 ? 'success' : 'error',
  kind: span.operationName || 'Other',
  name: span.name || span.operationName || 'Unknown',
  input: span.input || '—',
  output: span.output || '—',
  startTime: formatTs(span.startTime),
  endTime: formatTs(span.endTime),
  latency: formatDuration(span.durationNanos),
  totalTokens:
    span.genAiTotalTokens ??
    (span.genAiInputTokens != null && span.genAiOutputTokens != null
      ? span.genAiInputTokens + span.genAiOutputTokens
      : '—'),
  totalCost: '—',
  level: 0,
  children: [],
  rawDocument: span.rawDocument,
});

/** Build hierarchical tree from flat spans, sorted children earliest-first */
export const buildFullSpanTree = (
  spans: AgentSpan[],
  formatTs: (ts: string) => string
): BaseRow[] => {
  const spanMap = new Map<string, BaseRow>();
  const rootSpans: BaseRow[] = [];

  spans.forEach((span, index) => {
    spanMap.set(span.spanId, spanToRow(span, index, formatTs));
  });

  spanMap.forEach((row) => {
    if (row.parentSpanId && spanMap.has(row.parentSpanId)) {
      const parent = spanMap.get(row.parentSpanId)!;
      parent.children = parent.children || [];
      parent.children.push(row);
      parent.isExpandable = true;
    } else {
      rootSpans.push(row);
    }
  });

  setLevels(rootSpans, 0);

  const sortChildren = (rows: BaseRow[]) => {
    rows.sort((a, b) => {
      const timeA = parseTimestampMs(a.rawDocument?.startTime);
      const timeB = parseTimestampMs(b.rawDocument?.startTime);
      return timeA - timeB;
    });
    rows.forEach((row) => {
      if (row.children && row.children.length > 0) {
        sortChildren(row.children);
      }
    });
  };
  sortChildren(rootSpans);

  return rootSpans;
};

/** Convert PPL response hits to AgentSpan array */
export const hitsToAgentSpans = (traceHits: TraceHit[]): AgentSpan[] =>
  traceHits.map((hit, i) => traceHitToAgentSpan(hit, i));
