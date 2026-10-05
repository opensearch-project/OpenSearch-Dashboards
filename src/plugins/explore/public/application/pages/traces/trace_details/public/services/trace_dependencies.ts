/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext } from 'react';
import { resolveServiceNameFromSpan } from '../traces/ppl_resolve_helpers';
import {
  classifySpanDependency,
  DependencyInfo,
  getSpanAttr,
  normalizeSpanKind,
} from './dependency_classifier';

/** The dependency call each span makes, keyed by spanId (spans that make none are absent). */
export type TraceDependencies = ReadonlyMap<string, DependencyInfo>;

interface TraceSpan {
  spanId?: string;
  parentSpanId?: string;
  serviceName?: string;
  kind?: unknown;
}

export interface BuildTraceDependenciesOptions {
  /**
   * False when the spans are not the whole trace (the fetch hit its row cap). A CLIENT call
   * without a SERVER child may then just have its child cut off, so no external dependency is
   * inferred; databases and brokers are named by their attributes and are kept.
   */
  complete?: boolean;
}

const serviceOf = (span: TraceSpan): string =>
  resolveServiceNameFromSpan(span) || span.serviceName || '';

const messagingOperation = (span: TraceSpan): string =>
  `${getSpanAttr(span, 'messaging.operation') ?? getSpanAttr(span, 'messaging.operation.type') ?? ''}`;

const isProcessOperation = (span: TraceSpan): boolean =>
  messagingOperation(span).toLowerCase() === 'process';

/**
 * Work out, once per trace, the dependency call each span makes, following the backend
 * (data-prepper otel_apm_service_map) rules that need the whole trace:
 * - a CLIENT call that reached a traced service is a service edge: it, or a same-service
 *   CLIENT span under it (an SDK span over its transport span), has a SERVER child;
 * - an external peer named like a service with a SERVER span in the trace is that service;
 * - a CLIENT span that is the transport of a same-service dependency call or of a messaging
 *   publish / receive is not counted again;
 * - a nested consumer, and a receive whose message also has a process span, are not counted
 *   again.
 *
 * Build it from the unfiltered trace: a span filter removes the SERVER children that show a
 * call reached a service, which would turn traced calls into external dependencies. All
 * views (trace map, waterfall, Gantt) read the same result, so they agree.
 */
export const buildTraceDependencies = (
  spans: TraceSpan[],
  options: BuildTraceDependenciesOptions = {}
): Map<string, DependencyInfo> => {
  const complete = options.complete ?? true;
  const byId = new Map<string, TraceSpan>();
  const childrenOf = new Map<string, TraceSpan[]>();
  spans.forEach((span) => {
    if (span.spanId) byId.set(span.spanId, span);
  });
  spans.forEach((span) => {
    if (!span.parentSpanId || !byId.has(span.parentSpanId)) return;
    const list = childrenOf.get(span.parentSpanId) || [];
    list.push(span);
    childrenOf.set(span.parentSpanId, list);
  });
  const kindOf = (span: TraceSpan) => normalizeSpanKind(span.kind);
  const parentOf = (span: TraceSpan) =>
    span.parentSpanId ? byId.get(span.parentSpanId) : undefined;

  // A SERVER child of the call, or of a same-service CLIENT span under it.
  const reachesTracedService = (client: TraceSpan): boolean => {
    if (kindOf(client) !== 'CLIENT') return false;
    const own = serviceOf(client);
    const pending = [client];
    const visited = new Set<TraceSpan>(pending);
    while (pending.length > 0) {
      const current = pending.pop() as TraceSpan;
      for (const child of childrenOf.get(current.spanId || '') || []) {
        if (kindOf(child) === 'SERVER') return true;
        if (kindOf(child) === 'CLIENT' && serviceOf(child) === own && !visited.has(child)) {
          visited.add(child);
          pending.push(child);
        }
      }
    }
    return false;
  };

  const knownServerServices = new Set(
    spans
      .filter((span) => kindOf(span) === 'SERVER')
      .map((span) => serviceOf(span).toLowerCase())
      .filter(Boolean)
  );

  const classified = new Map<string, DependencyInfo | null>();
  const dependencyOf = (span: TraceSpan): DependencyInfo | null => {
    const id = span.spanId || '';
    if (!classified.has(id)) {
      const dep = classifySpanDependency(span, {
        reachesTracedService: reachesTracedService(span),
        knownServerServices,
      });
      classified.set(id, dep && dep.type === 'external' && !complete ? null : dep);
    }
    return classified.get(id) ?? null;
  };

  const isNestedTransport = (span: TraceSpan): boolean => {
    const parent = parentOf(span);
    if (kindOf(span) !== 'CLIENT' || !parent || serviceOf(parent) !== serviceOf(span)) {
      return false;
    }
    if (kindOf(parent) === 'CLIENT') return dependencyOf(parent) !== null;
    if (getSpanAttr(parent, 'messaging.system') === undefined) return false;
    return (
      kindOf(parent) === 'PRODUCER' ||
      (kindOf(parent) === 'CONSUMER' && !isProcessOperation(parent))
    );
  };

  // Consumer de-duplication: one message delivered to one consumer counts once.
  const isNestedConsumer = (span: TraceSpan): boolean => {
    const parent = parentOf(span);
    return (
      !!parent &&
      kindOf(parent) === 'CONSUMER' &&
      serviceOf(parent) === serviceOf(span) &&
      dependencyOf(parent)?.name === dependencyOf(span)?.name
    );
  };
  const messageKey = (span: TraceSpan) =>
    `${serviceOf(span)}\u0000${dependencyOf(span)?.name}\u0000${span.parentSpanId}`;
  const processedMessageKeys = new Set(
    spans
      .filter(
        (span) =>
          kindOf(span) === 'CONSUMER' &&
          dependencyOf(span) !== null &&
          isProcessOperation(span) &&
          !!span.parentSpanId &&
          !isNestedConsumer(span)
      )
      .map(messageKey)
  );
  const isRedundantConsumer = (span: TraceSpan): boolean =>
    isNestedConsumer(span) ||
    (!isProcessOperation(span) &&
      !!span.parentSpanId &&
      processedMessageKeys.has(messageKey(span)));

  const result = new Map<string, DependencyInfo>();
  spans.forEach((span) => {
    if (!span.spanId) return;
    const dep = dependencyOf(span);
    if (!dep || isNestedTransport(span)) return;
    if (kindOf(span) === 'CONSUMER' && isRedundantConsumer(span)) return;
    result.set(span.spanId, dep);
  });
  return result;
};

/**
 * The trace's dependency calls (see buildTraceDependencies), provided by the trace view so
 * the waterfall rows classify spans against the whole trace, not just the filtered rows.
 * Null outside a provider; callers then build it from the spans they have.
 */
export const TraceDependenciesContext = createContext<TraceDependencies | null>(null);

export const useTraceDependencies = (): TraceDependencies | null =>
  useContext(TraceDependenciesContext);
