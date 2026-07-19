/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLLintHttpClient } from '../../lint_bridge';
import { ExplainPlan, ExplainRelTree } from './explain_types';

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
  private cache = new Map<string, ExplainResolution>();
  private pending = new Map<string, Promise<ExplainResolution>>();
  // Bumped by clear() so an in-flight request started before the clear cannot
  // write its (now stale) resolution back into the fresh cache, and cannot
  // delete a pending entry belonging to a request issued after the clear.
  private epoch = 0;

  private key(query: string, dataSourceId: string | undefined): string {
    return `${dataSourceId ?? '__local__'}::${query}`;
  }

  async resolveResult(
    http: PPLLintHttpClient,
    query: string,
    dataSourceId?: string
  ): Promise<ExplainResolution> {
    const k = this.key(query, dataSourceId);
    const cached = this.cache.get(k);
    if (cached) {
      return cached;
    }
    const inFlight = this.pending.get(k);
    if (inFlight) {
      return inFlight;
    }

    const requestEpoch = this.epoch;
    const promise = http
      .post(EXPLAIN_PATH, {
        body: JSON.stringify({ query }),
        query: dataSourceId ? { dataSourceId } : {},
      })
      .then(toExplainPlan)
      .then((plan) => {
        const resolution: ExplainResolution = plan.isCalcite
          ? { status: 'ok', plan }
          : { status: 'unsupported' };
        if (this.epoch === requestEpoch) {
          if (this.cache.size >= MAX_ENTRIES) {
            const oldest = this.cache.keys().next().value;
            if (oldest !== undefined) {
              this.cache.delete(oldest);
            }
          }
          this.cache.set(k, resolution);
          this.pending.delete(k);
        }
        // A pre-clear response is still returned to its own caller — the
        // caller's generation guard decides whether to use it — but it must
        // not repopulate the cleared cache or evict the post-clear request.
        return resolution;
      })
      .catch((error) => {
        if (this.epoch === requestEpoch) {
          this.pending.delete(k);
        }
        // Deliberately not cached: a transient failure must not become a
        // permanent "no plan" for a later pass over the same text.
        return { status: 'error', error } as ExplainResolution;
      });

    this.pending.set(k, promise);
    return promise;
  }

  clear(): void {
    this.epoch++;
    this.cache.clear();
    this.pending.clear();
  }
}

export const explainCache = new ExplainCache();
