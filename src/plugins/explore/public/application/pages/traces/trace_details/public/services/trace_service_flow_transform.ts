/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveServiceNameFromSpan } from '../traces/ppl_resolve_helpers';
import { extractSpanDuration } from '../utils/span_data_utils';
import { nanoToMilliSec } from '../utils/helper_functions';

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

/** A node shaped for @osd/apm-topology's ServiceCardNode (CelestialCardProps). */
export interface ServiceFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    id: string;
    title: string;
    subtitle?: string;
    color?: string;
    metrics: { requests: number; faults5xx: number; errors4xx: number };
    health?: { status: string; breached: number; recovered: number; total: number };
    typeBadge: false | { label: string; color: string; textColor?: string };
    actionButton: false;
    showDonut: false;
    keyAttributes: Record<string, string>;
  };
}

/** A directed service-to-service edge for @osd/apm-topology's celestial edge. */
export interface ServiceFlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: {
    style: {
      type: string;
      marker: string;
      animationType: string;
      color?: string;
      label?: string;
    };
  };
}

/** The `map` prop shape expected by CelestialMap: a single "root" group. */
export interface ServiceFlowMap {
  root: { nodes: ServiceFlowNode[]; edges: ServiceFlowEdge[] };
}

export interface ServiceFlowResult {
  map: ServiceFlowMap;
  /** Representative "entry" span per service, for wiring node click -> span selection. */
  entrySpanByService: Record<string, string>;
}

const UNKNOWN_SERVICE = 'unknown';

const serviceOf = (hit: ServiceFlowHit): string =>
  resolveServiceNameFromSpan(hit) || hit.serviceName || UNKNOWN_SERVICE;

const formatDuration = (ms: number): string => {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms >= 1) return `${Math.round(ms)}ms`;
  return `${ms.toFixed(2)}ms`;
};

/**
 * Build a per-trace service topology from a trace's spans, shaped for
 * @osd/apm-topology's ServiceCardNode. Per service we surface a per-trace RED
 * analog: span count (rate), error count/rate (errors), and total time
 * (duration). Edges carry the cross-service call count and turn red when a
 * call span errored. Also returns each service's entry span so a node click can
 * select a meaningful span rather than an arbitrary one.
 */
export const spansToServiceFlow = (
  hits: ServiceFlowHit[],
  colorMap: Record<string, string> = {}
): ServiceFlowResult => {
  if (!hits || hits.length === 0) {
    return { map: { root: { nodes: [], edges: [] } }, entrySpanByService: {} };
  }

  const id2svc = new Map<string, string>();
  const requestCounts = new Map<string, number>();
  const errorCounts = new Map<string, number>();
  const durationNanos = new Map<string, number>();

  hits.forEach((hit) => {
    const service = serviceOf(hit);
    id2svc.set(hit.spanId, service);
    requestCounts.set(service, (requestCounts.get(service) || 0) + 1);
    if (hit.status?.code === 2) {
      errorCounts.set(service, (errorCounts.get(service) || 0) + 1);
    }
    durationNanos.set(service, (durationNanos.get(service) || 0) + extractSpanDuration(hit));
  });

  // Entry span per service = first span whose parent is in a different service
  // (or has no known parent). Falls back to the first span seen for the service.
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

  // Distinct parent-service -> child-service edges with call counts + error flag.
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

  const nodes: ServiceFlowNode[] = Array.from(requestCounts.keys()).map((service) => {
    const requests = requestCounts.get(service) || 0;
    const errors = errorCounts.get(service) || 0;
    const totalMs = nanoToMilliSec(durationNanos.get(service) || 0);
    return {
      id: service,
      type: 'serviceCard',
      position: { x: 0, y: 0 }, // Dagre repositions in CelestialMap
      data: {
        id: service,
        title: service,
        subtitle: `${formatDuration(totalMs)} · ${requests} span${requests === 1 ? '' : 's'}`,
        color: colorMap[service],
        // Per-trace RED analog: requests = span count, errors4xx = error spans.
        metrics: { requests, faults5xx: 0, errors4xx: errors },
        // Error spans -> Datadog-style red border + SLI badge on the service card.
        health:
          errors > 0
            ? { status: 'breached', breached: errors, recovered: 0, total: requests }
            : undefined,
        typeBadge: false,
        actionButton: false,
        showDonut: false,
        keyAttributes: {},
      },
    };
  });

  const edges: ServiceFlowEdge[] = Array.from(edgeCounts.entries()).map(([key, count]) => {
    const [source, target] = key.split('->');
    const hasError = edgeHasError.has(key);
    return {
      id: key,
      source,
      target,
      type: 'celestialEdge',
      data: {
        style: {
          type: 'solid',
          marker: 'arrowClosed',
          animationType: 'flow',
          label: count > 1 ? `${count} calls` : '1 call',
          ...(hasError ? { color: 'var(--osd-color-status-error)' } : {}),
        },
      },
    };
  });

  return { map: { root: { nodes, edges } }, entrySpanByService };
};
