/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLLintHttpClient } from '../../lint_bridge';
import { ExplainPlan, ExplainRelTree } from './explain_types';
import { EXPLAIN_OUTCOME_DETECTOR_VERSION } from './explain_outcomes';

// Hardcoded rather than imported from query_enhancements/common: `@osd/monaco`
// cannot depend on a plugin. `BASE_API` there is `/api/enhancements`, so the
// explain route (`${BASE_API}/ppl/explain`) resolves to this path.
const EXPLAIN_PATH = '/api/enhancements/ppl/explain';

// Bound memory: the key is the query text, which is unbounded across an editing
// session, so cap the map and evict oldest-first. A small cap is plenty for
// interactive editing (the same few queries are re-linted as the user pauses).
const MAX_ENTRIES = 50;

const EMPTY: ExplainPlan = { isCalcite: false };

export type ExplainResolution =
  | { status: 'ok'; plan: ExplainPlan }
  | { status: 'unsupported' }
  | { status: 'error'; error?: unknown };

/**
 * Per-call options for {@link ExplainCache.resolveResult}.
 *
 * - `partition` splits the cache into two independent maps. `'baseline'` (the
 *   default) is the whole-query `_explain` a lint pass issues once. `'probe'` is
 *   the bounded control/treatment queries the Thorough attribution pass fires to
 *   disambiguate multiple candidates; those are keyed with the outcome-detector
 *   version so a detector change never reuses a stale probe verdict, and they
 *   never share entries with baseline plans for the same text.
 * - `signal` lets the caller abort an in-flight probe once its wall-clock budget
 *   expires; the underlying http client honors it when supported.
 * - `cacheKey` overrides the string the entry is keyed on, defaulting to `query`.
 *   It lets the caller explain the fully-prepared query (with the volatile time
 *   filter) while keying the cache on a stable variant that omits the time range,
 *   so the plan is reused across time-picker moves — pushdown behavior is a
 *   property of the operation, not the concrete time bounds. The POST body always
 *   carries the real `query`.
 */
export interface ExplainResolveOptions {
  partition?: 'baseline' | 'probe';
  signal?: AbortSignal;
  cacheKey?: string;
}

function isRelTree(value: unknown): value is ExplainRelTree {
  return !!value && typeof value === 'object' && Array.isArray((value as { rels?: unknown }).rels);
}

/**
 * Map a raw `_explain` response into an {@link ExplainPlan}. Newer Calcite
 * clusters return rel-tree objects for `logical`/`physical`; older clusters
 * return strings. Anything else — the non-Calcite `{ root: {...} }` v2 shape, an
 * error body from a half-typed query, or a malformed payload — maps to a
 * non-Calcite empty plan, which makes every explain detector no-op. This is why
 * the caller needs no clean-parse guard: an unparseable query simply yields no
 * usable plan and therefore no diagnostics.
 */
export function toExplainPlan(res: unknown): ExplainPlan {
  const calcite = (res as { calcite?: { physical?: unknown; logical?: unknown } })?.calcite;
  if (!calcite || typeof calcite !== 'object') {
    return EMPTY;
  }

  const { logical, physical } = calcite;
  const logicalTree = isRelTree(logical) ? logical : undefined;
  const physicalTree = isRelTree(physical) ? physical : undefined;
  const logicalText = typeof logical === 'string' ? logical : undefined;
  const physicalText = typeof physical === 'string' ? physical : undefined;

  if (!logicalTree && !physicalTree && !logicalText && !physicalText) {
    return EMPTY;
  }

  return { isCalcite: true, logicalTree, physicalTree, logicalText, physicalText };
}

/**
 * Caches `_explain` results per (dataSourceId, query) with in-flight dedup, so
 * repeated lint passes over the same text issue at most one network call. The
 * runtime layer relies on the generation guard (not this cache) for staleness,
 * so the cache never needs to abort a request — a superseded response is simply
 * dropped by the caller. Fail-safe: a network error is returned but never
 * cached, so a transient failure does not become a permanent "no plan".
 */
class ExplainCache {
  private baselineCache = new Map<string, ExplainResolution>();
  private probeCache = new Map<string, ExplainResolution>();
  private baselinePending = new Map<string, Promise<ExplainResolution>>();
  private probePending = new Map<string, Promise<ExplainResolution>>();
  // Bumped by clear() so an in-flight request started before the clear cannot
  // write its (now stale) resolution back into the fresh cache, and cannot
  // delete a pending entry belonging to a request issued after the clear.
  private epoch = 0;

  private key(
    query: string,
    dataSourceId: string | undefined,
    partition: 'baseline' | 'probe'
  ): string {
    // Probe verdicts depend on the outcome detector; version the key so a
    // detector change never reuses a stale probe result. Baseline plans are the
    // raw `_explain`, independent of the detector, so they carry no version.
    const version = partition === 'probe' ? `::outcomes-${EXPLAIN_OUTCOME_DETECTOR_VERSION}` : '';
    return `${dataSourceId ?? '__local__'}${version}::${query}`;
  }

  async resolveResult(
    http: PPLLintHttpClient,
    query: string,
    dataSourceId?: string,
    options: ExplainResolveOptions = {}
  ): Promise<ExplainResolution> {
    const partition = options.partition ?? 'baseline';
    const cache = partition === 'probe' ? this.probeCache : this.baselineCache;
    const pending = partition === 'probe' ? this.probePending : this.baselinePending;
    const k = this.key(options.cacheKey ?? query, dataSourceId, partition);
    const cached = cache.get(k);
    if (cached) {
      return cached;
    }
    const inFlight = pending.get(k);
    if (inFlight) {
      return inFlight;
    }

    const requestEpoch = this.epoch;
    const promise = http
      .post(EXPLAIN_PATH, {
        body: JSON.stringify({ query }),
        query: dataSourceId ? { dataSourceId } : {},
        signal: options.signal,
      })
      .then(toExplainPlan)
      .then((plan) => {
        const resolution: ExplainResolution = plan.isCalcite
          ? { status: 'ok', plan }
          : { status: 'unsupported' };
        if (this.epoch === requestEpoch) {
          if (cache.size >= MAX_ENTRIES) {
            const oldest = cache.keys().next().value;
            if (oldest !== undefined) {
              cache.delete(oldest);
            }
          }
          cache.set(k, resolution);
          pending.delete(k);
        }
        // A pre-clear response is still returned to its own caller — the
        // caller's generation guard decides whether to use it — but it must
        // not repopulate the cleared cache or evict the post-clear request.
        return resolution;
      })
      .catch((error) => {
        if (this.epoch === requestEpoch) {
          pending.delete(k);
        }
        // Deliberately not cached: a transient failure must not become a
        // permanent "no plan" for a later pass over the same text.
        return { status: 'error', error } as ExplainResolution;
      });

    pending.set(k, promise);
    return promise;
  }

  clear(): void {
    this.epoch++;
    this.baselineCache.clear();
    this.probeCache.clear();
    this.baselinePending.clear();
    this.probePending.clear();
  }
}

export const explainCache = new ExplainCache();
