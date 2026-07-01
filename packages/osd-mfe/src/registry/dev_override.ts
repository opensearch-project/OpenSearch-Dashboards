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
 * resolve(id, overrides) — registry → remote descriptor, with the dev-override
 * hook.
 *
 * Resolution always runs against the CURRENT registry obtained from a
 * {@link RegistryProvider} (mtime hot-reload / TTL poll lives in the provider),
 * so a version flip is a pure DATA edit reflected on the very next resolve — no
 * rebuild, no restart. See `packages/osd-mfe/README.md` for the dynamic-registry
 * design rationale.
 *
 * The dev-override hook lets a single plugin be repointed to a different
 * `remoteEntry` URL (`?mfe.<id>=<url>` / inspector panel). The dev URL override
 * gate parses the query param / UI and enforces the non-prod security gate;
 * this module only provides the resolution CONTRACT: given an override map,
 * the override URL wins over the registry URL.
 *
 * NOTE: this per-id, browser-side dev-override resolver was historically the
 * sole occupant of `./resolve.ts`. The schema-collapse loop repurposes
 * `./resolve.ts` to host the server-side {@link resolveBootManifest} routine
 * (the document → BootManifest projection). To keep the two unrelated
 * resolution surfaces in separate modules, the dev-override hook moved here.
 */

import { MfeEntry } from './schema';
import { RegistryProvider } from './provider';

/**
 * Dev-override map: plugin id → replacement `remoteEntry` URL.
 *
 * This is the hook point for the dev URL override gate. That gate builds this
 * map from the `?mfe.<id>=<url>` query param / inspector panel (and gates it to
 * non-prod); this module only defines how an override participates in resolution.
 */
export type OverrideMap = Readonly<Record<string, string>>;

/**
 * The resolved remote descriptor for one plugin — everything a host needs to
 * load the Module Federation container for `id`.
 */
export interface ResolvedRemote {
  /** Plugin id this descriptor resolves (echoed for convenience). */
  id: string;
  /** Effective `remoteEntry.js` URL (the override URL when one applied). */
  remoteEntry: string;
  /** Module Federation container scope (from the registry entry). */
  scope: string;
  /** Exposed module key inside the container (from the registry entry). */
  module: string;
  /** Content-hash-derived version label (from the registry entry). */
  version: string;
  /**
   * Subresource Integrity hash, when known. Present only for a `registry`
   * source: an override repoints the URL to a build whose bytes (and therefore
   * hash) differ, so the registry `integrity` no longer applies and is dropped.
   */
  integrity?: string;
  /** Where `remoteEntry` came from — used by the inspector panel. */
  source: 'registry' | 'override';
}

/**
 * Pick a non-empty override URL for `id`, if any.
 *
 * Treats `undefined`/empty-string as "no override" so a sparse map (or a
 * cleared inspector field) is a no-op rather than an invalid URL.
 */
function overrideUrlFor(id: string, overrides?: OverrideMap): string | undefined {
  if (!overrides) {
    return undefined;
  }
  const url = overrides[id];
  return typeof url === 'string' && url.length > 0 ? url : undefined;
}

/**
 * Resolve a plugin id to its remote descriptor against the current registry,
 * applying the dev-override hook.
 *
 * Precedence:
 * 1. The plugin MUST exist in the current registry — its `scope`, `module` and
 *    `version` always come from the registry entry. An override only repoints
 *    the URL of a KNOWN plugin; it never invents an entry.
 * 2. When `overrides[id]` is a non-empty URL, that URL wins over the registry
 *    `remoteEntry` (and registry `integrity` is dropped — see {@link ResolvedRemote.integrity}).
 *
 * Unknown id: returns `null` (documented contract) rather than throwing, so a
 * missing optional plugin is a non-fatal "not available". An override for an
 * unknown id is ignored — there is no `scope`/`module`/`version` to build a
 * descriptor from — and `null` is still returned.
 *
 * @param provider source of the current registry (read at call time)
 * @param id plugin id to resolve (e.g. `inspector`)
 * @param overrides optional dev-override map (dev URL override hook); override URL wins
 * @returns the resolved remote descriptor, or `null` when `id` is not in the registry
 */
export function resolve(
  provider: RegistryProvider,
  id: string,
  overrides?: OverrideMap
): ResolvedRemote | null {
  const entry: MfeEntry | undefined = provider.getMfe(id);
  if (!entry) {
    // Unknown id: not available. Overrides cannot synthesize a descriptor
    // because scope/module/version are only known from the registry.
    return null;
  }

  const overrideUrl = overrideUrlFor(id, overrides);
  if (overrideUrl !== undefined) {
    return {
      id,
      remoteEntry: overrideUrl,
      scope: entry.scope,
      module: entry.module,
      version: entry.version,
      // integrity intentionally dropped: the overridden bundle's bytes differ
      // from the registry build, so the recorded SRI hash no longer matches.
      source: 'override',
    };
  }

  return {
    id,
    remoteEntry: entry.remoteEntry,
    scope: entry.scope,
    module: entry.module,
    version: entry.version,
    ...(entry.integrity !== undefined ? { integrity: entry.integrity } : {}),
    source: 'registry',
  };
}
