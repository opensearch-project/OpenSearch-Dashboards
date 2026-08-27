/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveServiceNameFromSpan } from '../traces/ppl_resolve_helpers';
import { extractSpanDuration } from '../utils/span_data_utils';
import { nanoToMilliSec } from '../utils/helper_functions';

/**
 * Largest `valueOf(item)` across an iterable, folded pairwise (no `Math.max(...spread)`,
 * so no call-stack argument limit and no intermediate array). `seed` is also the
 * result for an empty iterable (defaults to 1, a safe denominator for bar scaling).
 */
const maxBy = <T>(items: Iterable<T>, valueOf: (item: T) => number, seed = 1): number => {
  let max = seed;
  for (const item of items) max = Math.max(max, valueOf(item));
  return max;
};

/**
 * Minimal span shape needed to build a per-trace service flow. Compatible with
 * the transformed trace hits produced by the trace details view.
 */
export interface ServiceFlowHit {
  spanId: string;
  parentSpanId?: string;
  serviceName?: string;
  status?: { code?: number };
  [key: string]: any;
}

/** A single labeled metric bar on a service node. */
export interface ServiceMetric {
  label: string;
  value: number;
  max: number;
  color: string;
  formattedValue: string;
}

/** Node data for @osd/apm-topology's MetricsCardNode (type: 'metricsCard'). */
export interface ServiceFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    id: string;
    title: string;
    color?: string;
    hasError: boolean;
    errorLabel?: string;
    metrics: ServiceMetric[];
  };
}

/** Edge data for @osd/apm-topology's VolumeEdge (type: 'volumeEdge'). */
export interface ServiceFlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: { volume: number; maxVolume: number; hasError: boolean; label: string };
}

export interface ServiceFlowMap {
  root: { nodes: ServiceFlowNode[]; edges: ServiceFlowEdge[] };
}

export interface ServiceFlowResult {
  map: ServiceFlowMap;
  /** Representative "entry" span per service (kept for callers that need it). */
  entrySpanByService: Record<string, string>;
}

const UNKNOWN_SERVICE = 'unknown';
const OK_COLOR = '#017D73'; // EUI success
const ERROR_COLOR = '#BD271E'; // EUI danger
const COUNT_COLOR = '#69707D'; // EUI subdued
const DURATION_COLOR = '#0268BC'; // EUI primary

const serviceOf = (hit: ServiceFlowHit): string =>
  resolveServiceNameFromSpan(hit) || hit.serviceName || UNKNOWN_SERVICE;

export const formatDuration = (ms: number): string => {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms >= 1) return `${Math.round(ms)}ms`;
  return `${ms.toFixed(2)}ms`;
};

/**
 * Build a per-trace service topology. Each service node carries three per-trace
 * RED-style metric bars (Requests = span count, Errors = error rate, Duration =
 * total service time), scaled against the max across services so bars are
 * comparable. Edges carry the cross-service call count + whether a call errored.
 */
export const spansToServiceFlow = (
  hits: ServiceFlowHit[],
  colorMap: Record<string, string> = {}
): ServiceFlowResult => {
  if (!hits || hits.length === 0) {
    return { map: { root: { nodes: [], edges: [] } }, entrySpanByService: {} };
  }

  const id2svc = new Map<string, string>();
  const spanCounts = new Map<string, number>();
  const errorCounts = new Map<string, number>();
  const durationNanos = new Map<string, number>();

  hits.forEach((hit) => {
    const service = serviceOf(hit);
    id2svc.set(hit.spanId, service);
    spanCounts.set(service, (spanCounts.get(service) || 0) + 1);
    if (hit.status?.code === 2) errorCounts.set(service, (errorCounts.get(service) || 0) + 1);
    durationNanos.set(service, (durationNanos.get(service) || 0) + extractSpanDuration(hit));
  });

  // Entry span per service (span whose parent is in a different service).
  const entrySpanByService: Record<string, string> = {};
  const firstSpanByService: Record<string, string> = {};
  hits.forEach((hit) => {
    const service = serviceOf(hit);
    if (!(service in firstSpanByService)) firstSpanByService[service] = hit.spanId;
    const parentService = hit.parentSpanId ? id2svc.get(hit.parentSpanId) : undefined;
    if (!(service in entrySpanByService) && parentService !== service) {
      entrySpanByService[service] = hit.spanId;
    }
  });
  Object.keys(firstSpanByService).forEach((service) => {
    if (!(service in entrySpanByService)) entrySpanByService[service] = firstSpanByService[service];
  });

  // Cross-service edges with call counts + error flag.
  const edgeCounts = new Map<string, number>();
  const edgeHasError = new Set<string>();
  hits.forEach((hit) => {
    const childService = serviceOf(hit);
    if (hit.parentSpanId && id2svc.has(hit.parentSpanId)) {
      const parentService = id2svc.get(hit.parentSpanId)!;
      if (parentService !== childService) {
        const key = `${parentService}->${childService}`;
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
        if (hit.status?.code === 2) edgeHasError.add(key);
      }
    }
  });

  const services = Array.from(spanCounts.keys());
  const maxSpanCount = maxBy(services, (s) => spanCounts.get(s) || 0);
  const maxDurationMs = maxBy(services, (s) => nanoToMilliSec(durationNanos.get(s) || 0));

  const nodes: ServiceFlowNode[] = services.map((service) => {
    const spans = spanCounts.get(service) || 0;
    const errors = errorCounts.get(service) || 0;
    const totalMs = nanoToMilliSec(durationNanos.get(service) || 0);
    const errorRate = spans > 0 ? (errors / spans) * 100 : 0;
    return {
      id: service,
      type: 'metricsCard',
      position: { x: 0, y: 0 },
      data: {
        id: service,
        title: service,
        color: colorMap[service],
        hasError: errors > 0,
        errorLabel:
          errors > 0
            ? `${errors} error${errors === 1 ? '' : 's'} in this service (${errorRate.toFixed(0)}%)`
            : undefined,
        metrics: [
          {
            label: 'Requests',
            value: spans,
            max: maxSpanCount,
            color: COUNT_COLOR,
            formattedValue: `${spans}`,
          },
          {
            label: 'Errors',
            value: errors,
            max: spans || 1,
            color: errors > 0 ? ERROR_COLOR : OK_COLOR,
            formattedValue: errors > 0 ? `${errors} (${errorRate.toFixed(0)}%)` : '0',
          },
          {
            label: 'Duration',
            value: totalMs,
            max: maxDurationMs,
            color: DURATION_COLOR,
            formattedValue: formatDuration(totalMs),
          },
        ],
      },
    };
  });

  const maxVolume = maxBy(edgeCounts.values(), (v) => v);
  const edges: ServiceFlowEdge[] = Array.from(edgeCounts.entries()).map(([key, count]) => {
    const [source, target] = key.split('->');
    return {
      id: key,
      source,
      target,
      type: 'volumeEdge',
      data: {
        volume: count,
        maxVolume,
        hasError: edgeHasError.has(key),
        label: `${count} call${count === 1 ? '' : 's'}`,
      },
    };
  });

  return { map: { root: { nodes, edges } }, entrySpanByService };
};
