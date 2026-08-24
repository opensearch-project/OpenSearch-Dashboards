/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveServiceNameFromSpan } from '../traces/ppl_resolve_helpers';

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

/** A node shaped for @osd/apm-topology's ServiceCircleNode (CelestialCardProps). */
export interface ServiceFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    id: string;
    title: string;
    color?: string;
    metrics: { requests: number; faults5xx: number; errors4xx: number };
    keyAttributes: Record<string, string>;
  };
}

/** A directed service-to-service edge for @osd/apm-topology's celestial edge. */
export interface ServiceFlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: { style: { type: string; marker: string; animationType: string } };
}

/** The `map` prop shape expected by CelestialMap: a single "root" group. */
export interface ServiceFlowMap {
  root: { nodes: ServiceFlowNode[]; edges: ServiceFlowEdge[] };
}

const UNKNOWN_SERVICE = 'unknown';

/**
 * Build a per-trace service topology from a trace's spans: one node per service
 * (span count -> requests, error spans -> faults) and one edge per distinct
 * parent-service -> child-service call. Mirrors the aggregation used by the
 * legacy ReactFlow service map, shaped for @osd/apm-topology's ServiceCircleNode.
 */
export const spansToServiceFlow = (
  hits: ServiceFlowHit[],
  colorMap: Record<string, string> = {}
): ServiceFlowMap => {
  if (!hits || hits.length === 0) {
    return { root: { nodes: [], edges: [] } };
  }

  const id2svc = new Map<string, string>();
  const requestCounts = new Map<string, number>();
  const errorCounts = new Map<string, number>();

  hits.forEach((hit) => {
    const serviceName = resolveServiceNameFromSpan(hit) || hit.serviceName || UNKNOWN_SERVICE;
    id2svc.set(hit.spanId, serviceName);
    requestCounts.set(serviceName, (requestCounts.get(serviceName) || 0) + 1);
    if (hit.status?.code === 2) {
      errorCounts.set(serviceName, (errorCounts.get(serviceName) || 0) + 1);
    }
  });

  // Distinct parent-service -> child-service edges (skip self-calls).
  const edgeSet = new Set<string>();
  hits.forEach((hit) => {
    const childService = resolveServiceNameFromSpan(hit) || hit.serviceName || UNKNOWN_SERVICE;
    if (hit.parentSpanId && id2svc.has(hit.parentSpanId)) {
      const parentService = id2svc.get(hit.parentSpanId)!;
      if (parentService !== childService) {
        edgeSet.add(`${parentService}->${childService}`);
      }
    }
  });

  const nodes: ServiceFlowNode[] = Array.from(requestCounts.keys()).map((service) => ({
    id: service,
    type: 'serviceCircle',
    position: { x: 0, y: 0 }, // Dagre repositions in CelestialMap
    data: {
      id: service,
      title: service,
      color: colorMap[service],
      metrics: {
        requests: requestCounts.get(service) || 0,
        faults5xx: errorCounts.get(service) || 0,
        errors4xx: 0,
      },
      keyAttributes: {},
    },
  }));

  const edges: ServiceFlowEdge[] = Array.from(edgeSet).map((key) => {
    const [source, target] = key.split('->');
    return {
      id: key,
      source,
      target,
      type: 'celestialEdge',
      data: { style: { type: 'solid', marker: 'arrowClosed', animationType: 'flow' } },
    };
  });

  return { root: { nodes, edges } };
};
