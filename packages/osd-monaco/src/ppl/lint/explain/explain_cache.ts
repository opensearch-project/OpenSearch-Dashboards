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
 * - `signal` lets the caller abandon the request (a superseded lint pass, a
 *   probe whose wall-clock budget expired). The signal is never wired into the
 *   shared fetch directly — the cache refcounts subscribers and aborts the
 *   underlying request only when every subscriber's signal has fired, so one
 *   caller's abort cannot destroy a co-subscribed caller's response. The
 *   aborting caller immediately receives an `error` resolution.
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
 * One in-flight request, shared by every caller that asked for the same key
 * while it was pending. The underlying fetch carries the entry's own internal
 * controller, never a caller's signal: an in-flight request can be shared (a
 * second editor model, or a remounted editor joining before the old model's
 * dispose fires), and wiring the first caller's signal straight into the fetch
 * would let that caller's abort destroy the response for subscribers that are
 * still current. Instead each aborting subscriber decrements the refcount, and
 * the fetch is cancelled only when the last subscriber has aborted. A caller
 * without a signal counts as a subscriber that never aborts, pinning the
 * request open.
 */
interface PendingEntry {
  subscribe(signal?: AbortSignal): Promise<ExplainResolution>;
}

/**
 * Caches `_explain` results per (dataSourceId, query) with in-flight dedup, so
 * repeated lint passes over the same text issue at most one network call.
 * Callers may pass an abort signal (a superseded lint pass cancels its request
 * rather than letting it complete just to be dropped by the generation guard);
 * the cache refcounts subscribers per in-flight request and aborts the
 * underlying fetch only when every subscriber has aborted, so one caller's
 * supersession never destroys a co-subscribed caller's response. Fail-safe: a
 * network error is returned but never cached, so a transient failure does not
 * become a permanent "no plan".
 */
class ExplainCache {
  private baselineCache = new Map<string, ExplainResolution>();
  private probeCache = new Map<string, ExplainResolution>();
  private baselinePending = new Map<string, PendingEntry>();
  private probePending = new Map<string, PendingEntry>();
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
      return inFlight.subscribe(options.signal);
    }

    const requestEpoch = this.epoch;
    // The fetch carries the entry's own controller (see PendingEntry): caller
    // signals only ever decrement the subscriber count below.
    const controller = typeof AbortController === 'undefined' ? undefined : new AbortController();
    let settled = false;
    const promise = http
      .post(EXPLAIN_PATH, {
        body: JSON.stringify({ query }),
        query: dataSourceId ? { dataSourceId } : {},
        signal: controller?.signal,
      })
      .then(toExplainPlan)
      .then((plan) => {
        const resolution: ExplainResolution = plan.isCalcite
          ? { status: 'ok', plan }
          : { status: 'unsupported' };
        if (this.epoch === requestEpoch) {
          // Only a real plan is cached. `unsupported` means the response had no
          // Calcite plan, which depends on the cluster's engine settings rather
          // than the query — and nothing in production invalidates this cache
          // when an administrator toggles Calcite, so caching it would make the
          // verdict permanent for the session. In-flight deduplication below is
          // unaffected, so a stream of passes over the same text still collapses
          // to one request.
          if (resolution.status === 'ok') {
            if (cache.size >= MAX_ENTRIES) {
              const oldest = cache.keys().next().value;
              if (oldest !== undefined) {
                cache.delete(oldest);
              }
            }
            cache.set(k, resolution);
          }
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
      })
      .then((resolution) => {
        settled = true;
        return resolution;
      });

    // Subscribers that can still cancel the fetch: signal-less subscribers pin
    // the request open (they count but never abort), signalled ones drop out
    // when their signal fires. The shared fetch aborts only at zero.
    let liveSubscribers = 0;
    const subscribe = (signal?: AbortSignal): Promise<ExplainResolution> => {
      if (!signal) {
        liveSubscribers++;
        return promise;
      }
      if (signal.aborted) {
        // Never joined: no refcount change, and the caller gets the same
        // error-shaped resolution an abort mid-flight would have produced.
        return Promise.resolve({
          status: 'error',
          error: new Error('explain request aborted'),
        } as ExplainResolution);
      }
      liveSubscribers++;
      return new Promise<ExplainResolution>((resolve) => {
        const onAbort = () => {
          liveSubscribers--;
          if (liveSubscribers === 0 && !settled) {
            controller?.abort();
          }
          // This caller is done regardless of what the shared fetch does next;
          // co-subscribers keep their own pending resolution.
          resolve({ status: 'error', error: new Error('explain request aborted') });
        };
        signal.addEventListener('abort', onAbort, { once: true });
        promise.then((resolution) => {
          signal.removeEventListener('abort', onAbort);
          resolve(resolution);
        });
      });
    };

    pending.set(k, { subscribe });
    return subscribe(options.signal);
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
