/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveServiceNameFromSpan } from '../traces/ppl_resolve_helpers';
import { extractSpanDuration } from '../utils/span_data_utils';
import { nanoToMilliSec } from '../utils/helper_functions';
import {
  classifySpanDependency,
  normalizeSpanKind,
  dependencyTypeLabel,
  DependencyInfo,
  DependencyType,
  getSpanAttr,
} from './dependency_classifier';

// The aggregated APM map's icons for each dependency type (dashboards-observability
// platform_utils), so a dependency looks the same on both maps.
const DEPENDENCY_ICON_TYPES: Record<DependencyType, string> = {
  database: 'AWS::RDS',
  messaging: 'Kafka',
  external: 'AWS::CloudFront',
};

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
    /** Set on synthesized dependency nodes: 'database' | 'messaging' | 'external'. */
    dependencyType?: string;
    /** Human-readable subtitle for dependency nodes (e.g. "Database"). */
    subtitle?: string;
    /** Icon key for dependency nodes (see @osd/apm-topology ICONS). */
    iconType?: string;
    /**
     * Span filter that selects this dependency's spans (e.g. `attributes.server.address` =
     * `valkey-cart`), applied when the node is clicked. Absent when no attribute names it.
     */
    dependencyFilter?: { field: string; value: string };
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
    return { map: { root: { nodes: [], edges: [] } } };
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

  // ---- Synthesize dependency nodes (database / messaging / external) --------
  // Mirrors the aggregated APM service map: represent DB/broker/external targets
  // the calling spans reach, using attributes the trace already carries. These
  // are additive to the service-to-service topology above.

  const spanById = new Map<string, ServiceFlowHit>();
  hits.forEach((hit) => spanById.set(hit.spanId, hit));
  const parentOf = (hit: ServiceFlowHit) =>
    hit.parentSpanId ? spanById.get(hit.parentSpanId) : undefined;
  const isClient = (hit: ServiceFlowHit) => normalizeSpanKind(hit.kind) === 'CLIENT';

  // Which spans reached a traced service? A span with a child from a different
  // service did, and so did the same-service CLIENT spans wrapping it (an SDK
  // span over its transport span), as in the backend. Such a CLIENT span is a
  // normal edge, not a dependency call.
  const spanHasCrossServiceChild = new Set<string>();
  hits.forEach((hit) => {
    const immediateParent = parentOf(hit);
    if (!immediateParent || serviceOf(immediateParent) === serviceOf(hit)) return;
    let cur: ServiceFlowHit | undefined = immediateParent;
    // Already marked: the chain above is done (also stops on a parent-id cycle).
    while (cur && !spanHasCrossServiceChild.has(cur.spanId)) {
      spanHasCrossServiceChild.add(cur.spanId);
      const up = parentOf(cur);
      if (!isClient(cur) || !up || serviceOf(up) !== serviceOf(cur)) break;
      cur = up;
    }
  });

  // Services with a SERVER span in this trace: an external peer named like one of them is
  // that service (its SERVER span missing from the call), not an external dependency.
  const knownServerServices = new Set(
    hits
      .filter((hit) => normalizeSpanKind(hit.kind) === 'SERVER')
      .map((hit) => serviceOf(hit).toLowerCase())
      .filter(Boolean)
  );
  const dependencyOf = (hit: ServiceFlowHit) =>
    classifySpanDependency(hit, {
      reachesTracedService: spanHasCrossServiceChild.has(hit.spanId),
      knownServerServices,
    });

  // A CLIENT span nested in a same-service CLIENT dependency call, or in a
  // messaging publish/receive span, is the transport of that one call; only the
  // outer span is counted (backend isSynthesizedDependencyTarget).
  const isNestedTransport = (hit: ServiceFlowHit) => {
    const parent = parentOf(hit);
    if (!isClient(hit) || !parent || serviceOf(parent) !== serviceOf(hit)) return false;
    if (isClient(parent)) {
      return classifySpanDependency(parent, { reachesTracedService: false }) !== null;
    }
    if (getSpanAttr(parent, 'messaging.system') === undefined) return false;
    const parentKind = normalizeSpanKind(parent.kind);
    const operation =
      getSpanAttr(parent, 'messaging.operation.type') ?? getSpanAttr(parent, 'messaging.operation');
    return parentKind === 'PRODUCER' || (parentKind === 'CONSUMER' && operation !== 'process');
  };

  const depNodeId = (dep: DependencyInfo) => `dep::${dep.type}::${dep.name}`;
  interface DepAgg {
    type: DependencyInfo['type'];
    name: string;
    filter?: { field: string; value: string };
    count: number;
    errors: number;
    durationNanos: number;
  }
  const depAgg = new Map<string, DepAgg>();
  // Keyed by edge id; endpoints are kept alongside rather than re-split from the
  // id, since service and dependency names may themselves contain "->".
  const depEdges = new Map<string, { source: string; target: string; count: number }>();
  const depEdgeHasError = new Set<string>();

  hits.forEach((hit) => {
    const kind = normalizeSpanKind(hit.kind);
    if (isNestedTransport(hit)) return;
    const dep = dependencyOf(hit);
    if (!dep) return;

    const service = serviceOf(hit);
    const nodeId = depNodeId(dep);
    const agg = depAgg.get(nodeId) || {
      type: dep.type,
      name: dep.name,
      // The first span's identifying attribute selects the dependency's spans.
      filter: dep.filter
        ? { field: `attributes.${dep.filter.key}`, value: dep.filter.value }
        : undefined,
      count: 0,
      errors: 0,
      durationNanos: 0,
    };
    agg.count += 1;
    if (hit.status?.code === 2) agg.errors += 1;
    agg.durationNanos += extractSpanDuration(hit);
    depAgg.set(nodeId, agg);

    // CONSUMER: broker -> service; PRODUCER / CLIENT (db, external): service -> dependency.
    const [source, target] = kind === 'CONSUMER' ? [nodeId, service] : [service, nodeId];
    const key = `${source}->${target}`;
    const edge = depEdges.get(key) || { source, target, count: 0 };
    edge.count += 1;
    depEdges.set(key, edge);
    if (hit.status?.code === 2) depEdgeHasError.add(key);
  });

  const maxDepCount = maxBy(depAgg.values(), (d) => d.count, maxSpanCount);
  const maxDepDurationMs = maxBy(
    depAgg.values(),
    (d) => nanoToMilliSec(d.durationNanos),
    maxDurationMs
  );

  depAgg.forEach((agg, nodeId) => {
    const totalMs = nanoToMilliSec(agg.durationNanos);
    const errorRate = agg.count > 0 ? (agg.errors / agg.count) * 100 : 0;
    nodes.push({
      id: nodeId,
      type: 'metricsCard',
      position: { x: 0, y: 0 },
      data: {
        id: nodeId,
        title: agg.name,
        hasError: agg.errors > 0,
        dependencyType: agg.type,
        subtitle: dependencyTypeLabel(agg.type),
        iconType: DEPENDENCY_ICON_TYPES[agg.type],
        ...(agg.filter && { dependencyFilter: agg.filter }),
        errorLabel:
          agg.errors > 0
            ? `${agg.errors} error${agg.errors === 1 ? '' : 's'} (${errorRate.toFixed(0)}%)`
            : undefined,
        metrics: [
          {
            label: 'Requests',
            value: agg.count,
            max: maxDepCount,
            color: COUNT_COLOR,
            formattedValue: `${agg.count}`,
          },
          {
            label: 'Errors',
            value: agg.errors,
            max: agg.count || 1,
            color: agg.errors > 0 ? ERROR_COLOR : OK_COLOR,
            formattedValue: agg.errors > 0 ? `${agg.errors} (${errorRate.toFixed(0)}%)` : '0',
          },
          {
            label: 'Duration',
            value: totalMs,
            max: maxDepDurationMs,
            color: DURATION_COLOR,
            formattedValue: formatDuration(totalMs),
          },
        ],
      },
    });
  });

  const maxDepVolume = maxBy(depEdges.values(), (e) => e.count, maxVolume);
  depEdges.forEach(({ source, target, count }, key) => {
    edges.push({
      id: key,
      source,
      target,
      type: 'volumeEdge',
      data: {
        volume: count,
        maxVolume: maxDepVolume,
        hasError: depEdgeHasError.has(key),
        label: `${count} call${count === 1 ? '' : 's'}`,
      },
    });
  });

  return { map: { root: { nodes, edges } } };
};
