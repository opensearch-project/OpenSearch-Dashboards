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
 * Dev URL-override SOURCE parsing (Phase 5, Story 1).
 *
 * Turns the developer-facing override SOURCES — the `?mfe.<id>=<url>` /
 * `?mfe.all=<baseUrl>` query params and an optional `localStorage` entry — into
 * the {@link OverrideMap} consumed by `resolve()` (see
 * `../registry/resolve.ts`) so a single plugin can be repointed at a local dev
 * server while the rest still load from the registry/CDN. See
 * docs/01-MFE-DESIGN.md §7.
 *
 * SECURITY: this module only PARSES sources; it does NOT decide whether they
 * apply. The non-production security gate (`mfe.allowOverride`) is enforced by
 * the bootstrap (Phase 5, Story 2): in production every override source is
 * ignored regardless of what this parser returns. Parsing here is therefore
 * deliberately side-effect free and gate-agnostic.
 *
 * Two override SHAPES are supported, mirroring §7:
 *  - per-plugin: `?mfe.<id>=<url>` → that plugin's full `remoteEntry` URL, OR
 *  - base/origin: `?mfe.all=<baseUrl>` → every plugin's `remoteEntry` rewritten
 *    to `baseUrl`'s origin (and base path), keeping the registry path so the
 *    content-hashed remote still resolves (e.g. swap CloudFront → localhost).
 *
 * A per-plugin override always WINS over the base override for the same id.
 * Malformed values (non-`http(s)` / unparseable URLs, empty values) are
 * silently ignored so a typo cannot break boot or smuggle in a bad URL.
 */

import { MfeEntry } from '../registry/schema';
import { OverrideMap } from '../registry/resolve';

/** Query-param / storage-key prefix that marks a dev override (`?mfe.<id>=`). */
const OVERRIDE_PREFIX = 'mfe.';

/** The reserved id for the base/origin override (`?mfe.all=<baseUrl>`). */
const ALL_ID = 'all';

/**
 * `localStorage` key under which persisted overrides live. The stored value is
 * a JSON object of BARE keys → url (same namespace as the query params after
 * stripping the `mfe.` prefix), e.g.
 * `{"inspector":"http://localhost:8080/...","all":"http://localhost:8080"}`.
 */
export const OVERRIDE_STORAGE_KEY = 'osd.mfe.overrides';

/**
 * The minimal `localStorage` surface this module reads. Injectable so the
 * parser is unit-testable without a DOM and tolerant of a missing/blocked store.
 */
export interface OverrideStorage {
  /** Return the stored string for `key`, or `null` when absent. */
  getItem(key: string): string | null;
}

/**
 * The parsed, gate-agnostic override sources.
 *
 * This is the INTERMEDIATE form: per-plugin URLs are captured directly while
 * the base override is kept separate (it can only be expanded into per-plugin
 * URLs once the registry entries are known — see {@link buildOverrideMap}).
 */
export interface ParsedOverrides {
  /** Base/origin override from `?mfe.all=<baseUrl>`, when present and valid. */
  all?: string;
  /** Per-plugin full `remoteEntry` URL overrides from `?mfe.<id>=<url>`. */
  byId: Record<string, string>;
}

/** Inputs to {@link parseOverrideSources}. */
export interface OverrideSourcesInput {
  /** A `location.search` string (e.g. `?mfe.inspector=http://x/y`). */
  search?: string;
  /** An optional persisted-override store (e.g. `window.localStorage`). */
  storage?: OverrideStorage;
}

/** Build an empty {@link ParsedOverrides}. */
function emptyParsed(): ParsedOverrides {
  return { byId: {} };
}

/**
 * True when `value` is a usable absolute `http(s)` override URL. A relative or
 * unparseable value (a typo, `javascript:`/`data:` URI, …) is rejected so it is
 * treated as "no override" rather than fed to the loader.
 */
function isValidOverrideUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

/**
 * Record one bare `id → value` override into `into`, validating the URL and
 * routing the reserved `all` id to the base override. Malformed values are
 * ignored (no-op).
 */
function ingestEntry(id: string, value: string, into: ParsedOverrides): void {
  if (id.length === 0 || !isValidOverrideUrl(value)) {
    return;
  }
  if (id === ALL_ID) {
    into.all = value;
  } else {
    into.byId[id] = value;
  }
}

/**
 * Parse `?mfe.<id>=<url>` / `?mfe.all=<baseUrl>` params out of a `search`
 * string. Non-`mfe.` params and malformed override URLs are ignored.
 */
export function parseQueryOverrides(search: string): ParsedOverrides {
  const out = emptyParsed();
  // URLSearchParams tolerates a leading '?' and an empty string.
  const params = new URLSearchParams(search);
  params.forEach((value, key) => {
    if (!key.startsWith(OVERRIDE_PREFIX)) {
      return;
    }
    ingestEntry(key.slice(OVERRIDE_PREFIX.length), value, out);
  });
  return out;
}

/**
 * Parse persisted overrides from `storage` (the {@link OVERRIDE_STORAGE_KEY}
 * JSON object of bare keys → url). A missing/blocked store, absent key, invalid
 * JSON, or non-object/non-string entries are all ignored (returns empties).
 */
export function parseStorageOverrides(storage?: OverrideStorage): ParsedOverrides {
  const out = emptyParsed();
  if (!storage) {
    return out;
  }

  let raw: string | null;
  try {
    raw = storage.getItem(OVERRIDE_STORAGE_KEY);
  } catch {
    // A blocked/throwing storage (privacy mode, SecurityError) is "no overrides".
    return out;
  }
  if (!raw) {
    return out;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return out;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return out;
  }

  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value === 'string') {
      ingestEntry(id, value, out);
    }
  }
  return out;
}

/**
 * Parse all dev override sources into a single {@link ParsedOverrides}.
 *
 * Precedence: query params WIN over persisted `localStorage` overrides (an
 * explicit URL in the address bar is the most intentional signal), so storage
 * is parsed first and the query is merged on top.
 */
export function parseOverrideSources(input: OverrideSourcesInput): ParsedOverrides {
  const fromStorage = parseStorageOverrides(input.storage);
  const fromQuery = parseQueryOverrides(input.search ?? '');
  return {
    all: fromQuery.all ?? fromStorage.all,
    byId: { ...fromStorage.byId, ...fromQuery.byId },
  };
}

/**
 * Rewrite `registryRemoteEntry`'s origin (and prepend `base`'s path) onto the
 * registry path, implementing the `?mfe.all=<baseUrl>` base override. Returns
 * `undefined` when either URL cannot be parsed.
 *
 * Example: `base = http://localhost:8080`,
 * `registryRemoteEntry = https://cdn.example/mfe/inspector/<hash>/remoteEntry.js`
 * → `http://localhost:8080/mfe/inspector/<hash>/remoteEntry.js`.
 */
function applyBaseOverride(registryRemoteEntry: string, base: string): string | undefined {
  let baseUrl: URL;
  let regUrl: URL;
  try {
    baseUrl = new URL(base);
    regUrl = new URL(registryRemoteEntry);
  } catch {
    return undefined;
  }
  // Keep any path prefix on the base (e.g. http://host/cdn) and append the
  // registry path (which always begins with '/').
  const basePath = baseUrl.pathname.replace(/\/+$/, '');
  return `${baseUrl.origin}${basePath}${regUrl.pathname}${regUrl.search}${regUrl.hash}`;
}

/**
 * Expand {@link ParsedOverrides} into the {@link OverrideMap} (id → full
 * `remoteEntry` URL) that `resolve()` consumes, against the CURRENT registry
 * entries.
 *
 * - The base override (`all`) is applied first to EVERY known plugin (origin
 *   swap, keeping the registry path).
 * - A per-plugin override then WINS over the base for that id.
 * - Only ids present in `registryEntries` are emitted — an override for an
 *   unknown id is dropped (it has no descriptor to repoint), matching
 *   `resolve()`'s "override never invents an entry" contract.
 */
export function buildOverrideMap(
  parsed: ParsedOverrides,
  registryEntries: Readonly<Record<string, MfeEntry>>
): OverrideMap {
  const map: Record<string, string> = {};

  if (parsed.all !== undefined) {
    for (const id of Object.keys(registryEntries)) {
      const rewritten = applyBaseOverride(registryEntries[id].remoteEntry, parsed.all);
      if (rewritten !== undefined) {
        map[id] = rewritten;
      }
    }
  }

  for (const [id, url] of Object.entries(parsed.byId)) {
    // Per-plugin override wins, but only for a plugin that exists in the registry.
    if (Object.prototype.hasOwnProperty.call(registryEntries, id)) {
      map[id] = url;
    }
  }

  return map;
}

/**
 * Resolve the EFFECTIVE value of the `mfe.allowOverride` security gate from the
 * (optional) server config value and the server's dev/prod mode (Phase 5,
 * Story 2). This is the canonical, unit-tested specification of the gate's
 * default; the server injection sites mirror this exact expression inline (they
 * cannot import `@osd/mfe`, which is not a dependency of `src/`).
 *
 * SECURITY (docs/01-MFE-DESIGN.md §7): dev URL-overrides let arbitrary remote
 * code load, so the gate is honored ONLY in non-production. The default is
 * therefore tied to the server's dev mode:
 *  - `configured` explicitly set (a boolean) ALWAYS wins (operators can force it
 *    on or off in any mode).
 *  - `configured` unset (`undefined`) falls back to `dev`, so the gate is ON in
 *    development and — critically — OFF in production.
 *
 * @param configured the `mfe.allowOverride` config value (`undefined` when unset).
 * @param dev `true` when the server runs in development mode (`env.mode.dev`).
 * @returns the effective gate value passed to the browser bootstrap; `false`
 *   means EVERY override source (query param, inspector, `localStorage`) is
 *   ignored.
 */
export function resolveAllowOverride(configured: boolean | undefined, dev: boolean): boolean {
  return typeof configured === 'boolean' ? configured : !!dev;
}
