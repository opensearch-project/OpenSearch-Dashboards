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
 * Server-side mirror of the @osd/mfe registry reader + resolver
 * (Phase 13, Story 3).
 *
 * `src/` is not allowed to depend on `@osd/mfe` (the same constraint that gave
 * us `resolveAllowOverride` / `resolveCompatPolicy` / `resolveMfeHostEnv` in
 * this directory), so the legacy `uiRenderMixin` cannot call
 * `FileRegistryReader.resolve()` directly. This module mirrors the SAME
 * algorithm:
 *
 *  - Read the registry file from disk + JSON.parse.
 *  - Auto-detect v1 vs v2 by `schemaVersion` (missing => v1, legacy seed).
 *  - For v1: project to a v2 default-only document.
 *  - For v2: validate enough to safely resolve (light-touch — the authoring CLI
 *    in story 4 is the strict validator on writes).
 *  - Resolve against the requesting host's dimensions
 *    (`tenantOverrides[customerId]` > first-matching `rollouts[]` > `default`).
 *  - Return the FLAT boot manifest (`{ sharedDeps, mfes: BootManifestEntry[] }`)
 *    the legacy bootstrap.js handler bakes into the rendered bootstrap script.
 *
 * The implementation is INTENTIONALLY narrow: just enough to compute the boot
 * manifest. Schema-strict validation, rollback, and dependency scan-gate live
 * in the @osd/mfe authoring CLI (Phase 13 story 4) — this server-side reader
 * is a CONSUMER, not an authoring tool.
 *
 * mtime caching: an in-process cache keyed by file path avoids re-parsing the
 * registry on every request when the file is unchanged. A different path (e.g.
 * after a config edit) creates a new cache slot. The pure resolution step
 * always runs because dimensions vary per request.
 */

import Fs from 'fs';
import { createHash, randomInt } from 'crypto';

/** Resolution dimensions: the host's tenant + bucket assignment. */
export interface MfeResolutionDimensions {
  customerId: string;
  /** Integer in [0, 100). */
  userBucket: number;
}

/** One resolved boot-manifest entry (mirrors @osd/mfe BootManifestEntry). */
export interface MfeBootManifestEntry {
  id: string;
  remoteEntry: string;
  scope: string;
  module: string;
  version: string;
  integrity?: string;
  compat?: { minCoreVersion: string; compatibleCoreRange: string };
}

/** The flat boot manifest the server injects into the bootstrap. */
export interface MfeBootManifest {
  sharedDeps: { url: string; version: string };
  mfes: MfeBootManifestEntry[];
}

/* ------------------------------------------------------------------------- *
 * mtime cache
 * ------------------------------------------------------------------------- */

interface CacheSlot {
  mtimeMs: number;
  // The internal v2-shape document (after auto-migration if the file is v1).
  doc: V2DocLite;
}
const cache: Map<string, CacheSlot> = new Map();

/** Reset the in-process cache. Used by tests; never called in prod. */
export function _resetMfeBootManifestCache(): void {
  cache.clear();
}

/* ------------------------------------------------------------------------- *
 * Internal v2-shape (mirrors a subset of @osd/mfe V2Document)
 * ------------------------------------------------------------------------- */

interface MfeEntryLite {
  version: string;
  remoteEntry: string;
  scope: string;
  module: string;
  integrity?: string | null;
  compat?: { minCoreVersion?: string; compatibleCoreRange?: string };
}

interface V2DocLite {
  default: { sharedDeps: { url: string; version: string }; mfes: Record<string, MfeEntryLite> };
  rollouts: Array<{
    id: string;
    match: { userBucketLt?: number; userBucketGte?: number; tenantId?: string };
    override: { mfes: Record<string, MfeEntryLite> };
  }>;
  tenantOverrides: Record<string, { mfes: Record<string, MfeEntryLite> }>;
}

/* ------------------------------------------------------------------------- *
 * File read + auto-migration
 * ------------------------------------------------------------------------- */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readAndCacheDoc(path: string): V2DocLite {
  const stat = Fs.statSync(path);
  const slot = cache.get(path);
  if (slot && slot.mtimeMs === stat.mtimeMs) {
    return slot.doc;
  }
  const raw = Fs.readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw);
  const doc = coerceToV2DocLite(parsed);
  cache.set(path, { mtimeMs: stat.mtimeMs, doc });
  return doc;
}

function coerceToV2DocLite(parsed: unknown): V2DocLite {
  if (!isPlainObject(parsed)) {
    throw new Error('MFE registry document must be a JSON object');
  }
  const sv = parsed.schemaVersion;
  if (sv === 2) {
    return projectV2(parsed);
  }
  // v1 (legacy) or missing schemaVersion => treat as v1.
  if (sv === undefined || sv === 1) {
    return migrateV1ToV2Lite(parsed);
  }
  throw new Error(
    `MFE registry document has an unsupported schemaVersion ${JSON.stringify(sv)} ` +
      `(only 1 (legacy) or 2 are supported)`
  );
}

function migrateV1ToV2Lite(v1: Record<string, unknown>): V2DocLite {
  const sharedDeps = v1.sharedDeps;
  if (!isPlainObject(sharedDeps)) {
    throw new Error('MFE v1 registry: sharedDeps must be an object');
  }
  const mfes = v1.mfes;
  if (!isPlainObject(mfes)) {
    throw new Error('MFE v1 registry: mfes must be an object keyed by plugin id');
  }
  return {
    default: {
      sharedDeps: { url: String(sharedDeps.url), version: String(sharedDeps.version) },
      mfes: cloneMfeMap(mfes),
    },
    rollouts: [],
    tenantOverrides: {},
  };
}

function projectV2(v2: Record<string, unknown>): V2DocLite {
  const def = v2.default;
  if (!isPlainObject(def)) {
    throw new Error('MFE v2 registry: default must be an object');
  }
  if (!isPlainObject(def.sharedDeps)) {
    throw new Error('MFE v2 registry: default.sharedDeps must be an object');
  }
  if (!isPlainObject(def.mfes)) {
    throw new Error('MFE v2 registry: default.mfes must be an object');
  }
  const rolloutsRaw = v2.rollouts;
  if (!Array.isArray(rolloutsRaw)) {
    throw new Error('MFE v2 registry: rollouts must be an array');
  }
  const tenantsRaw = v2.tenantOverrides;
  if (!isPlainObject(tenantsRaw)) {
    throw new Error('MFE v2 registry: tenantOverrides must be an object');
  }

  const rollouts: V2DocLite['rollouts'] = rolloutsRaw.map((rule, idx) => {
    if (!isPlainObject(rule)) {
      throw new Error(`MFE v2 registry: rollouts[${idx}] must be an object`);
    }
    const match = isPlainObject(rule.match) ? rule.match : {};
    const override = isPlainObject(rule.override)
      ? rule.override
      : { mfes: {} };
    const overrideMfes = isPlainObject(override.mfes) ? override.mfes : {};
    return {
      id: typeof rule.id === 'string' ? rule.id : `rollout-${idx}`,
      match: {
        userBucketLt:
          typeof match.userBucketLt === 'number' ? match.userBucketLt : undefined,
        userBucketGte:
          typeof match.userBucketGte === 'number' ? match.userBucketGte : undefined,
        tenantId: typeof match.tenantId === 'string' ? match.tenantId : undefined,
      },
      override: { mfes: cloneMfeMap(overrideMfes) },
    };
  });

  const tenantOverrides: V2DocLite['tenantOverrides'] = {};
  for (const customerId of Object.keys(tenantsRaw)) {
    const layer = tenantsRaw[customerId];
    if (!isPlainObject(layer) || !isPlainObject(layer.mfes)) {
      throw new Error(
        `MFE v2 registry: tenantOverrides.${customerId} must be { mfes: { id: entry } }`
      );
    }
    tenantOverrides[customerId] = { mfes: cloneMfeMap(layer.mfes) };
  }

  return {
    default: {
      sharedDeps: {
        url: String(def.sharedDeps.url),
        version: String(def.sharedDeps.version),
      },
      mfes: cloneMfeMap(def.mfes),
    },
    rollouts,
    tenantOverrides,
  };
}

function cloneMfeMap(raw: Record<string, unknown>): Record<string, MfeEntryLite> {
  const out: Record<string, MfeEntryLite> = {};
  for (const id of Object.keys(raw)) {
    const entry = raw[id];
    if (!isPlainObject(entry)) continue; // skip silently; resolver also drops malformed
    out[id] = {
      version: String(entry.version ?? ''),
      remoteEntry: String(entry.remoteEntry ?? ''),
      scope: String(entry.scope ?? ''),
      module: String(entry.module ?? ''),
      integrity:
        typeof entry.integrity === 'string'
          ? entry.integrity
          : entry.integrity === null
          ? null
          : undefined,
      compat: isPlainObject(entry.compat)
        ? {
            minCoreVersion:
              typeof entry.compat.minCoreVersion === 'string'
                ? entry.compat.minCoreVersion
                : undefined,
            compatibleCoreRange:
              typeof entry.compat.compatibleCoreRange === 'string'
                ? entry.compat.compatibleCoreRange
                : undefined,
          }
        : undefined,
    };
  }
  return out;
}

/* ------------------------------------------------------------------------- *
 * Resolution (precedence: tenant > first-matching rollout > default)
 * ------------------------------------------------------------------------- */

function matches(
  match: V2DocLite['rollouts'][number]['match'],
  dim: MfeResolutionDimensions
): boolean {
  if (match.userBucketLt !== undefined && !(dim.userBucket < match.userBucketLt)) return false;
  if (match.userBucketGte !== undefined && !(dim.userBucket >= match.userBucketGte)) return false;
  if (match.tenantId !== undefined && match.tenantId !== dim.customerId) return false;
  return true;
}

function toBootEntry(id: string, raw: MfeEntryLite): MfeBootManifestEntry | null {
  if (!raw.remoteEntry || !raw.scope || !raw.module || !raw.version) return null;
  const out: MfeBootManifestEntry = {
    id,
    remoteEntry: raw.remoteEntry,
    scope: raw.scope,
    module: raw.module,
    version: raw.version,
  };
  if (typeof raw.integrity === 'string' && raw.integrity.length > 0) {
    out.integrity = raw.integrity;
  }
  if (
    raw.compat &&
    typeof raw.compat.minCoreVersion === 'string' &&
    typeof raw.compat.compatibleCoreRange === 'string'
  ) {
    out.compat = {
      minCoreVersion: raw.compat.minCoreVersion,
      compatibleCoreRange: raw.compat.compatibleCoreRange,
    };
  }
  return out;
}

function resolveOnce(doc: V2DocLite, dim: MfeResolutionDimensions): MfeBootManifest {
  const matchingRollouts = doc.rollouts.filter((r) => matches(r.match, dim));

  // Stable id order: defaults insertion order first; layered-only ids appended.
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
  const tenantLayer = doc.tenantOverrides[dim.customerId];
  if (tenantLayer) {
    for (const id of Object.keys(tenantLayer.mfes)) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

  const out: MfeBootManifestEntry[] = [];
  for (const id of ids) {
    let chosen: MfeEntryLite | undefined;
    if (tenantLayer && tenantLayer.mfes[id] !== undefined) {
      chosen = tenantLayer.mfes[id];
    } else {
      for (const rule of matchingRollouts) {
        if (rule.override.mfes[id] !== undefined) {
          chosen = rule.override.mfes[id];
          break;
        }
      }
      if (!chosen && doc.default.mfes[id] !== undefined) {
        chosen = doc.default.mfes[id];
      }
    }
    if (chosen) {
      const entry = toBootEntry(id, chosen);
      if (entry) out.push(entry);
    }
  }

  return {
    sharedDeps: { ...doc.default.sharedDeps },
    mfes: out,
  };
}

/**
 * Read the v2 (or v1, auto-migrated) registry document at `path` and resolve
 * it against `dimensions`. Throws a descriptive Error on file/JSON errors, on
 * an unsupported schemaVersion, or on a structurally malformed v2 doc.
 *
 * Cached by mtime in-process; dimensions vary per call so the pure resolution
 * always runs even on a cache hit.
 */
export function readMfeBootManifest(
  path: string,
  dimensions: MfeResolutionDimensions
): MfeBootManifest {
  const doc = readAndCacheDoc(path);
  return resolveOnce(doc, dimensions);
}

/* ------------------------------------------------------------------------- *
 * Cookie-based bucket assignment
 * ------------------------------------------------------------------------- */

/**
 * Derive a deterministic bucket in `[0, 100)` from a cookie value. Uses
 * SHA-256 (the first four bytes interpreted as a uint32) so the assignment is
 * deterministic per cookie, deterministic across processes, and uniform across
 * the bucket space. Future AuthN can replace the cookie with a user id and the
 * same hash gives a stable bucket per identity.
 */
export function bucketFromCookie(cookieValue: string): number {
  const hash = createHash('sha256').update(cookieValue).digest();
  const u32 = hash.readUInt32BE(0);
  return u32 % 100;
}

/**
 * Parse the raw `Cookie` header for a single named cookie. Returns the cookie
 * VALUE (without quotes), or `undefined` when the cookie is not present.
 */
export function parseSingleCookie(
  cookieHeader: string | undefined,
  name: string
): string | undefined {
  if (!cookieHeader || !name) return undefined;
  // Cookies are "name=value; name2=value2"; values may be quoted.
  for (const pair of cookieHeader.split(';')) {
    const trimmed = pair.trim();
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq);
    if (k !== name) continue;
    let v = trimmed.slice(eq + 1);
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    return v;
  }
  return undefined;
}

/**
 * Build a Set-Cookie header value that pins a fresh, sticky, HttpOnly bucket
 * cookie for the current path. Lasts a year to make the assignment effectively
 * permanent across browser sessions; further requests reuse the same bucket so
 * the canary assignment stays stable for a given client.
 *
 * Note: not `Secure` because the dev harness runs over HTTP. Production
 * deployments should serve OSD over HTTPS and add `Secure` via a proxy /
 * future config knob (out of scope for Phase 13).
 */
export function buildBucketSetCookie(name: string, value: string): string {
  const oneYearSeconds = 365 * 24 * 60 * 60;
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${oneYearSeconds}`;
}

/**
 * Generate a fresh cookie value for first-time visitors. A 16-hex token is
 * plenty of entropy for a stable bucket assignment and keeps the cookie short.
 */
export function generateBucketCookieValue(): string {
  // Use the SHA-256 of a random integer for portability across older Node
  // crypto APIs; Node 22 has randomBytes but mocking the hex output keeps the
  // helper trivially testable.
  const r = randomInt(0, 2 ** 31 - 1);
  return createHash('sha256').update(String(r)).digest('hex').slice(0, 16);
}
