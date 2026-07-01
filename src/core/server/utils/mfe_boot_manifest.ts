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
 * Server-side mirror of the @osd/mfe registry reader + resolver.
 *
 * `src/` is not allowed to depend on `@osd/mfe` (the same constraint that gave
 * us `resolveAllowOverride` / `resolveCompatPolicy` / `resolveMfeHostEnv` in
 * this directory), so the legacy `uiRenderMixin` cannot call
 * `FileRegistryReader.resolve()` directly. This module mirrors the SAME
 * algorithm:
 *
 *  - Read the registry file from disk + JSON.parse.
 *  - Assert `schemaVersion === 1` (the single shippable schema).
 *  - Project the layered substructure (default + rollouts + tenantOverrides)
 *    AND the optional global asset roots (`core`, `orchestrator`, `themes`,
 *    `sharedDepsCss`) into an internal representation.
 *  - Resolve against the requesting host's dimensions
 *    (`tenantOverrides[customerId]` > first-matching `rollouts[]` > `default`).
 *  - Return the FLAT boot manifest (`{ sharedDeps, mfes, core?,
 *    orchestrator?, themes?, sharedDepsCss? }`) the legacy bootstrap.js
 *    handler bakes into the rendered bootstrap script.
 *
 * The implementation is INTENTIONALLY narrow: just enough to compute the boot
 * manifest. Schema-strict validation lives in the @osd/mfe authoring CLI —
 * this server-side reader is a CONSUMER, not an authoring tool.
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

/** One registry-managed static asset descriptor projected out of the
 *  registry doc's global asset roots. The shape mirrors `AssetDescriptor`
 *  in `@osd/mfe/registry/schema` but is duplicated here because `src/`
 *  cannot import from `@osd/mfe` (same constraint that motivated this whole
 *  module's existence).
 *
 *  `url` is required, `integrity` is OPTIONAL (same-origin dev fallback URLs
 *  legitimately have no SRI; production CDN URLs MUST set it). `version`
 *  is intentionally NOT propagated to the browser — it is registry-side
 *  metadata used by telemetry + cache-busting, not by the loader.
 */
export interface MfeBootAssetDescriptor {
  url: string;
  integrity?: string;
}

/**
 * The flat boot manifest the server injects into the bootstrap.
 *
 * `sharedDeps` + `mfes` come from the layered substructure (default layer
 * plus first-matching rollout overrides plus tenant overrides). The
 * remaining OPTIONAL fields are populated only when the corresponding
 * top-level global asset root is present on the source registry document.
 * When absent, consumers MUST treat `undefined` as "fall back to the
 * existing server-bundled path".
 */
export interface MfeBootManifest {
  sharedDeps: { url: string; version: string };
  mfes: MfeBootManifestEntry[];
  /** `osd_bootstrap_mfe.js` from CDN with SRI. Absent ⇒ consumer falls back to server-config bootstrapUrl. */
  orchestrator?: MfeBootAssetDescriptor;
  /** `core.entry.js` from CDN with SRI. Absent ⇒ consumer falls back to `/bundles/core/core.entry.js`. */
  core?: MfeBootAssetDescriptor;
  /**
   * Per-theme CSS bundle from CDN with SRI, keyed by theme name (e.g.
   * `light`, `dark`). When present, the server-rendered HTML head carries
   * a `<meta name="osd-mfe-themes">` tag and `startup.js` picks the
   * active theme (from `localStorage.uiSettings` / config defaults) and
   * appends a `<link rel="stylesheet">` with the corresponding URL +
   * `integrity` + `crossorigin="anonymous"` BEFORE `bootstrap.js` runs — so
   * the legacy `/ui/legacy_<name>_theme.css` request is skipped at the source
   * (no double-fetch). Absent ⇒ the existing same-origin
   * `/ui/legacy_<name>_theme.css` path is preserved verbatim.
   */
  themes?: Record<string, MfeBootAssetDescriptor>;
  /**
   * `osd-ui-shared-deps.css` from CDN with SRI (the EUI/charts/typography
   * "base" stylesheet — the always-loaded part of `@osd/ui-shared-deps`'s
   * CSS output, NOT the per-theme variants). When present, the
   * bootstrap_mfe thin shim's `styleSheetPaths` uses THIS URL (object form,
   * `{ url, integrity }`) instead of the legacy
   * `${regularBundlePath}/osd-ui-shared-deps/osd-ui-shared-deps.css`
   * same-origin path, and the legacy bundle route refuses (404s) the file
   * via the `mfeSharedDepsCssRefuser` predicate in
   * `optimize_mixin.ts` / `bundles_route.ts`. Absent ⇒ the existing
   * same-origin path is preserved verbatim.
   *
   * SINGULAR (one URL per registry, unlike `themes` which is keyed by
   * theme name) because the base CSS doesn't vary by theme — it carries
   * EUI/charts/typography styling that applies to all themes.
   */
  sharedDepsCss?: MfeBootAssetDescriptor;
}

/* ------------------------------------------------------------------------- *
 * mtime cache
 * ------------------------------------------------------------------------- */

interface CacheSlot {
  mtimeMs: number;
  // The internal projected document (the parsed schemaVersion: 1 doc).
  doc: RegistryDocLite;
}
const cache: Map<string, CacheSlot> = new Map();

/** Reset the in-process cache. Used by tests; never called in prod. */
export function _resetMfeBootManifestCache(): void {
  cache.clear();
}

/* ------------------------------------------------------------------------- *
 * Internal projected shape (mirrors a subset of the @osd/mfe RegistryDocument)
 * ------------------------------------------------------------------------- */

interface MfeEntryLite {
  version: string;
  remoteEntry: string;
  scope: string;
  module: string;
  integrity?: string | null;
  compat?: { minCoreVersion?: string; compatibleCoreRange?: string };
}

interface RegistryDocLite {
  default: { sharedDeps: { url: string; version: string }; mfes: Record<string, MfeEntryLite> };
  rollouts: Array<{
    id: string;
    match: { userBucketLt?: number; userBucketGte?: number; tenantId?: string };
    override: { mfes: Record<string, MfeEntryLite> };
  }>;
  tenantOverrides: Record<string, { mfes: Record<string, MfeEntryLite> }>;
  /**
   * Optional registry-managed asset descriptors, projected out of the source
   * document at parse time. Mirror the corresponding top-level fields on
   * `RegistryDocument` in `@osd/mfe/registry/schema`. Absent when the source
   * doc has no top-level field of that name; the consumer falls back to the
   * same-origin `/bundles/...` path at the consumption site (not here — this
   * module stays a pure consumer).
   */
  orchestrator?: { url: string; integrity?: string };
  core?: { url: string; integrity?: string };
  /**
   * Per-theme CSS bundle, keyed by theme name (e.g. `light`, `dark`, …).
   * Theme name set is OPEN — the schema does not enumerate `light`/`dark`/
   * etc., so a deployment can advertise additional themes without a server
   * change. Absent ⇒ consumer falls back to `/ui/legacy_<name>_theme.css`
   * (the legacy same-origin path).
   */
  themes?: Record<string, { url: string; integrity?: string }>;
  /**
   * The base `osd-ui-shared-deps.css` bundle (singular — one URL per
   * registry, unlike `themes`). Absent ⇒ consumer falls back to
   * `${regularBundlePath}/osd-ui-shared-deps/osd-ui-shared-deps.css` (the
   * legacy same-origin path on this server).
   */
  sharedDepsCss?: { url: string; integrity?: string };
}

/* ------------------------------------------------------------------------- *
 * File read + parse
 * ------------------------------------------------------------------------- */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readAndCacheDoc(path: string): RegistryDocLite {
  const stat = Fs.statSync(path);
  const slot = cache.get(path);
  if (slot && slot.mtimeMs === stat.mtimeMs) {
    return slot.doc;
  }
  const raw = Fs.readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw);
  const doc = parseRegistryDoc(parsed);
  cache.set(path, { mtimeMs: stat.mtimeMs, doc });
  return doc;
}

/**
 * Parse the on-disk registry document (`schemaVersion: 1`) into the internal
 * {@link RegistryDocLite} projection. Asserts the schema version and the
 * top-level shape of the layered substructure, then light-touch-projects
 * the layers (`default`, `rollouts[]`, `tenantOverrides`) and the optional
 * global asset roots (`core`, `orchestrator`, `themes`, `sharedDepsCss`).
 *
 * Strict schema validation lives in the @osd/mfe authoring CLI — this server
 * reader is a CONSUMER and only validates enough to safely resolve.
 */
function parseRegistryDoc(parsed: unknown): RegistryDocLite {
  if (!isPlainObject(parsed)) {
    throw new Error('MFE registry document must be a JSON object');
  }
  const sv = parsed.schemaVersion;
  if (sv !== 1) {
    throw new Error(
      `MFE registry document has an unsupported schemaVersion ${JSON.stringify(sv)} ` +
        `(only schemaVersion: 1 is supported)`
    );
  }

  const def = parsed.default;
  if (!isPlainObject(def)) {
    throw new Error('MFE registry: default must be an object');
  }
  if (!isPlainObject(def.sharedDeps)) {
    throw new Error('MFE registry: default.sharedDeps must be an object');
  }
  if (!isPlainObject(def.mfes)) {
    throw new Error('MFE registry: default.mfes must be an object');
  }
  const rolloutsRaw = parsed.rollouts;
  if (!Array.isArray(rolloutsRaw)) {
    throw new Error('MFE registry: rollouts must be an array');
  }
  const tenantsRaw = parsed.tenantOverrides;
  if (!isPlainObject(tenantsRaw)) {
    throw new Error('MFE registry: tenantOverrides must be an object');
  }

  const rollouts: RegistryDocLite['rollouts'] = rolloutsRaw.map((rule, idx) => {
    if (!isPlainObject(rule)) {
      throw new Error(`MFE registry: rollouts[${idx}] must be an object`);
    }
    const match = isPlainObject(rule.match) ? rule.match : {};
    const override = isPlainObject(rule.override) ? rule.override : { mfes: {} };
    const overrideMfes = isPlainObject(override.mfes) ? override.mfes : {};
    return {
      id: typeof rule.id === 'string' ? rule.id : `rollout-${idx}`,
      match: {
        userBucketLt: typeof match.userBucketLt === 'number' ? match.userBucketLt : undefined,
        userBucketGte: typeof match.userBucketGte === 'number' ? match.userBucketGte : undefined,
        tenantId: typeof match.tenantId === 'string' ? match.tenantId : undefined,
      },
      override: { mfes: cloneMfeMap(overrideMfes) },
    };
  });

  const tenantOverrides: RegistryDocLite['tenantOverrides'] = {};
  for (const customerId of Object.keys(tenantsRaw)) {
    const layer = tenantsRaw[customerId];
    if (!isPlainObject(layer) || !isPlainObject(layer.mfes)) {
      throw new Error(
        `MFE registry: tenantOverrides.${customerId} must be { mfes: { id: entry } }`
      );
    }
    tenantOverrides[customerId] = { mfes: cloneMfeMap(layer.mfes) };
  }

  const doc: RegistryDocLite = {
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

  // Optional global asset roots. Project only the fields used by the
  // browser loader (`url`, `integrity`); `version` is registry-side metadata.
  if (parsed.orchestrator !== undefined) {
    doc.orchestrator = projectAssetDescriptor('orchestrator', parsed.orchestrator);
  }
  if (parsed.core !== undefined) {
    doc.core = projectAssetDescriptor('core', parsed.core);
  }
  if (parsed.themes !== undefined) {
    if (!isPlainObject(parsed.themes)) {
      throw new Error(
        `MFE registry: \`themes\`, when present, must be an object keyed by theme name (got ${typeof parsed.themes})`
      );
    }
    const themes: Record<string, { url: string; integrity?: string }> = {};
    for (const themeName of Object.keys(parsed.themes)) {
      if (themeName.length === 0) {
        throw new Error('MFE registry: `themes` has an empty-string key');
      }
      themes[themeName] = projectAssetDescriptor(
        `themes.${themeName}`,
        (parsed.themes as Record<string, unknown>)[themeName]
      );
    }
    doc.themes = themes;
  }
  if (parsed.sharedDepsCss !== undefined) {
    doc.sharedDepsCss = projectAssetDescriptor('sharedDepsCss', parsed.sharedDepsCss);
  }

  return doc;
}

/**
 * Light-touch projection of a registry asset descriptor (`{ url, version,
 * integrity? }`) to the boot-manifest shape (`{ url, integrity? }` —
 * `version` is dropped because it never reaches the browser loader).
 *
 * Validation here is intentionally minimal: enough to ensure the projected
 * shape is well-formed; the strict schema rules (e.g. integrity MUST start
 * with `sha384-`) are enforced by the AUTHORING CLI before the registry is
 * deployed. A registry that reaches this server-side reader is presumed to
 * have passed those checks.
 */
function projectAssetDescriptor(field: string, raw: unknown): { url: string; integrity?: string } {
  if (!isPlainObject(raw)) {
    throw new Error(
      `MFE registry: \`${field}\` must be an object with { url, integrity? } (got ${typeof raw})`
    );
  }
  if (typeof raw.url !== 'string' || raw.url.length === 0) {
    throw new Error(`MFE registry: \`${field}.url\` must be a non-empty string`);
  }
  const out: { url: string; integrity?: string } = { url: raw.url };
  if (raw.integrity !== undefined) {
    if (typeof raw.integrity !== 'string' || raw.integrity.length === 0) {
      throw new Error(
        `MFE registry: \`${field}.integrity\`, when present, must be a non-empty string`
      );
    }
    out.integrity = raw.integrity;
  }
  return out;
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
  match: RegistryDocLite['rollouts'][number]['match'],
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

function resolveOnce(doc: RegistryDocLite, dim: MfeResolutionDimensions): MfeBootManifest {
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
    // Surface `orchestrator` on the boot manifest when the source doc set
    // it — the bootstrap template advertises it (with SRI) to the browser.
    // Absent ⇒ consumer falls back to the server-config `bootstrapUrl`.
    ...(doc.orchestrator ? { orchestrator: { ...doc.orchestrator } } : {}),
    // Same backward-compat posture for the OSD core bundle. Absent ⇒
    // consumer falls back to the legacy server-bundled
    // `/bundles/core/core.entry.js` path. When present, the bootstrap
    // template advertises it to the browser and the orchestrator loads it
    // (with SRI) before invoking core boot; a tampered core fails closed
    // (the orchestrator refuses to call `invokeCoreBootstrap`).
    ...(doc.core ? { core: { ...doc.core } } : {}),
    // Per-theme CSS bundles. Absent ⇒ consumer falls back to
    // `/ui/legacy_<name>_theme.css` on THIS server (the existing
    // same-origin path). When present, the server-rendered HTML head
    // carries the resolved theme URLs as a `<meta name="osd-mfe-themes">`
    // tag; `startup.js` selects the active theme from
    // `localStorage.uiSettings` and creates a `<link rel="stylesheet">`
    // with SRI BEFORE `bootstrap.js` runs, and the legacy
    // `/ui/legacy_<name>_theme.css` route on this origin 404s for any
    // theme name advertised by the registry (so a misconfigured browser
    // can never silently fall back to a same-origin copy).
    ...(doc.themes ? { themes: { ...doc.themes } } : {}),
    // The base `osd-ui-shared-deps.css` bundle. Absent ⇒ consumer falls
    // back to `${regularBundlePath}/osd-ui-shared-deps/osd-ui-shared-deps.css`
    // on THIS server (the existing same-origin path). When present, the
    // bootstrap_mfe thin shim's `styleSheetPaths` uses THIS URL with SRI
    // (object form `{ url, integrity }`) and the legacy bundle route
    // refuses the same path via the `mfeSharedDepsCssRefuser` predicate
    // in `optimize_mixin.ts` (so a misconfigured browser can never
    // silently fall back to an un-SRI'd same-origin copy). GLOBAL —
    // does not vary by rollout/tenant.
    ...(doc.sharedDepsCss ? { sharedDepsCss: { ...doc.sharedDepsCss } } : {}),
  };
}

/**
 * Read the registry document at `path` (`schemaVersion: 1`) and resolve it
 * against `dimensions`. Throws a descriptive Error on file/JSON errors, on
 * an unsupported schemaVersion, or on a structurally malformed document.
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
 * future config knob (out of scope for the current server-side per-tenant
 * resolution work).
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
