/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * resolveBootManifest — the PURE resolution algorithm (Phase 13, Story 2).
 *
 * Given a v2 registry document and a pair of resolution dimensions
 * (`customerId`, `userBucket`), produce the FLAT boot manifest the OSD server
 * injects into the boot HTML for the browser to consume.
 *
 * Resolution is per-id. For each plugin id present in any layer, the first
 * source that produces an entry — applied in this STRICT precedence order —
 * wins:
 *
 *   1. `tenantOverrides[customerId].mfes[id]` (specific wins)
 *   2. The FIRST rollout in declared order whose `match` evaluates true AND
 *      whose `override.mfes[id]` is set
 *   3. `default.mfes[id]`
 *
 * The match for a single rollout rule is a logical AND across declared
 * predicates (an empty match `{}` matches every dimension):
 *
 *   - `userBucketLt` (when set): `bucket < userBucketLt`
 *   - `userBucketGte` (when set): `bucket >= userBucketGte`
 *   - `tenantId` (when set): `customerId === tenantId`
 *
 * Entries whose source is the `default` layer are the steady state; rollouts
 * never invent ids the default does not declare unless the authoring CLI
 * explicitly added them — Phase 13 keeps the field stable so the resolver
 * doesn't need to guard against that case.
 *
 * Defensive note: an entry whose resolved source happens to be malformed
 * (e.g. an empty remoteEntry) is dropped from the output rather than failing
 * the whole resolve — the schema validator (`validateV2`) is the authority on
 * shape correctness; this resolver is best-effort to keep one bad layer from
 * breaking unrelated plugins. (`validateV2` is normally already invoked by the
 * reader / authoring CLI before this function ever runs.)
 *
 * The function is PURE — no I/O, no clock reads, no globals. It takes only the
 * doc + dimensions and returns a fresh boot manifest. This pure-ness is what
 * makes the resolver trivial to unit-test without a filesystem/registry mock,
 * and what lets a future `HttpRegistryReader` reuse the SAME function against
 * a doc fetched over the wire (story 3 layers I/O on top — story 2 stays
 * pure).
 */

import { CompatDeclaration } from './schema';
import { BootManifest, BootManifestEntry } from './boot_manifest';
import {
  ResolutionDimensions,
  V2Document,
  V2Rollout,
  V2RolloutMatch,
} from './schema_v2';

/* ------------------------------------------------------------------------- *
 * Match predicate
 * ------------------------------------------------------------------------- */

/**
 * Evaluate a single rollout match against the given dimensions. An empty match
 * (`{}`) matches every dimension — vacuous truth. A predicate whose key is
 * absent does NOT contribute to the AND (it's "don't care", not "always
 * false"). Bucket bounds use `>=` / `<` (half-open) so adjacent rules tile.
 *
 * Exposed for unit tests (story 2's test matrix exercises every branch in
 * isolation) and for the authoring CLI's `--check-deps` flag (story 4), which
 * needs to reason about which rules a hypothetical dimension pair would
 * activate when validating the resolved graph.
 */
export function matchesRollout(
  match: V2RolloutMatch,
  dimensions: ResolutionDimensions
): boolean {
  if (match.userBucketLt !== undefined && !(dimensions.userBucket < match.userBucketLt)) {
    return false;
  }
  if (match.userBucketGte !== undefined && !(dimensions.userBucket >= match.userBucketGte)) {
    return false;
  }
  if (match.tenantId !== undefined && match.tenantId !== dimensions.customerId) {
    return false;
  }
  return true;
}

/* ------------------------------------------------------------------------- *
 * Per-id source lookup (precedence implementation)
 * ------------------------------------------------------------------------- */

/**
 * The layer that supplied a resolved entry. Used for diagnostics + the
 * authoring CLI's `--check-deps` flag (story 4) which annotates the resolved
 * graph with which layer each id came from.
 */
export type ResolvedSource = 'tenant' | 'rollout' | 'default';

/**
 * One per-id resolution decision, before flattening into a boot manifest. Kept
 * separately so the authoring CLI + tests can inspect precedence (e.g.
 * "verify acme + bucket=2 picked the tenant layer, not the canary rollout").
 */
export interface ResolvedDecision {
  id: string;
  source: ResolvedSource;
  /** Which rollout rule supplied the entry (only when `source === 'rollout'`). */
  rolloutId?: string;
  entry: BootManifestEntry;
}

/**
 * Resolve a single plugin id against a v2 doc + dimensions. Implements the
 * precedence rule. Returns `null` when no layer supplied an entry for the id
 * (defensive — the resolver doesn't synthesise data).
 */
function resolveOne(
  id: string,
  doc: V2Document,
  dimensions: ResolutionDimensions,
  matchingRollouts: V2Rollout[]
): ResolvedDecision | null {
  // 1. Tenant override wins outright when present for this id.
  const tenantLayer = doc.tenantOverrides[dimensions.customerId];
  if (tenantLayer && tenantLayer.mfes[id] !== undefined) {
    const entry = toBootManifestEntry(id, tenantLayer.mfes[id]);
    if (entry) {
      return { id, source: 'tenant', entry };
    }
  }

  // 2. First-matching rollout (by declared order) that has the id.
  for (const rule of matchingRollouts) {
    const candidate = rule.override.mfes[id];
    if (candidate !== undefined) {
      const entry = toBootManifestEntry(id, candidate);
      if (entry) {
        return { id, source: 'rollout', rolloutId: rule.id, entry };
      }
    }
  }

  // 3. Default layer.
  const defaultEntry = doc.default.mfes[id];
  if (defaultEntry !== undefined) {
    const entry = toBootManifestEntry(id, defaultEntry);
    if (entry) {
      return { id, source: 'default', entry };
    }
  }

  return null;
}

/**
 * Project an MfeEntry (from any layer) onto the boot manifest entry shape.
 * Stamps the passthrough fields that the loader/inspector needs (compat,
 * integrity, version) from whichever layer supplied the source. Returns null
 * if the entry is malformed (defensive — the validator is the authority).
 */
function toBootManifestEntry(
  id: string,
  raw: V2Document['default']['mfes'][string]
): BootManifestEntry | null {
  if (
    typeof raw.remoteEntry !== 'string' ||
    raw.remoteEntry.length === 0 ||
    typeof raw.scope !== 'string' ||
    raw.scope.length === 0 ||
    typeof raw.module !== 'string' ||
    raw.module.length === 0 ||
    typeof raw.version !== 'string' ||
    raw.version.length === 0
  ) {
    return null;
  }
  const entry: BootManifestEntry = {
    id,
    remoteEntry: raw.remoteEntry,
    scope: raw.scope,
    module: raw.module,
    version: raw.version,
  };
  if (raw.integrity !== undefined && raw.integrity !== null && raw.integrity.length > 0) {
    entry.integrity = raw.integrity;
  }
  if (raw.compat !== undefined) {
    const compat: CompatDeclaration = {
      minCoreVersion: raw.compat.minCoreVersion,
      compatibleCoreRange: raw.compat.compatibleCoreRange,
    };
    entry.compat = compat;
  }
  return entry;
}

/* ------------------------------------------------------------------------- *
 * Public API
 * ------------------------------------------------------------------------- */

/**
 * Compute the per-id resolution decisions for a doc + dimensions. Exposed
 * separately from {@link resolveBootManifest} so callers (tests, authoring
 * CLI's `--check-deps`) can inspect WHICH layer supplied each id.
 *
 * Iterates the ids in a stable order: every id present in `default.mfes`
 * (insertion order) followed by any extra id that ONLY a rollout/tenant layer
 * declares. This matches the v1 path's behaviour (boot order = registry
 * insertion order) and keeps the boot manifest deterministic for the same
 * doc + dimensions.
 */
export function resolveDecisions(
  doc: V2Document,
  dimensions: ResolutionDimensions
): ResolvedDecision[] {
  const matchingRollouts = doc.rollouts.filter((rule) => matchesRollout(rule.match, dimensions));

  // Stable id order: defaults first (insertion), then the layered-only ids
  // (rollouts in declared order, then tenant overrides), each emitted at most
  // once. This makes the manifest order deterministic for the same inputs.
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const id of Object.keys(doc.default.mfes)) {
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  for (const rule of matchingRollouts) {
    for (const id of Object.keys(rule.override.mfes)) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }
  const tenantLayer = doc.tenantOverrides[dimensions.customerId];
  if (tenantLayer) {
    for (const id of Object.keys(tenantLayer.mfes)) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

  const decisions: ResolvedDecision[] = [];
  for (const id of ids) {
    const decision = resolveOne(id, doc, dimensions, matchingRollouts);
    if (decision) {
      decisions.push(decision);
    }
  }
  return decisions;
}

/**
 * Resolve a v2 document down to a flat {@link BootManifest} for the given
 * dimensions. Implements:
 *
 *   - precedence: `tenantOverrides[customerId]` > first-matching `rollouts[]`
 *     > `default`
 *   - first-match: within `rollouts[]`, declared order wins per id
 *   - sharedDeps: ALWAYS taken from `default.sharedDeps` (singletons URL is a
 *     baseline property of the doc, not per-layer; keeping it pinned avoids a
 *     mid-page sharedDeps version mismatch when only some entries override)
 *
 * @param doc a VALID v2 document (caller is expected to have run {@link validateV2})
 * @param dimensions the bound dimensions for this request
 * @returns the resolved flat boot manifest
 */
export function resolveBootManifest(
  doc: V2Document,
  dimensions: ResolutionDimensions
): BootManifest {
  const decisions = resolveDecisions(doc, dimensions);
  return {
    sharedDeps: { ...doc.default.sharedDeps },
    mfes: decisions.map((d) => d.entry),
  };
}
