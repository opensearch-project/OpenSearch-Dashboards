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
 * Boot manifest — the FLAT shape the OSD server injects into the boot HTML for
 * the browser to consume in `--mfe` mode (server-side per-tenant resolution).
 *
 * The browser does NOT see the registry document. The server reads the
 * document, runs the resolution algorithm against the requesting host's
 * {@link ResolutionDimensions}, and injects the resulting boot manifest at
 * `__osdInjectedMetadata.mfeBoot` via the existing
 * `<osd-injected-metadata>` channel. The browser bootstrap consumes the flat
 * `mfes[]` list directly — no second registry HTTP fetch.
 *
 * The manifest carries ONLY what the loader needs to instantiate each remote:
 *   - `id` — for ordering and inspector panel display
 *   - `remoteEntry`, `scope`, `module` — Module Federation triple
 *   - `version` — for inspector / compat checks / debugging
 *   - `integrity?` — optional SRI hash (fail-closed when present)
 *   - `compat?` — optional host-compatibility declaration (classifier input)
 *
 * In addition, the manifest carries optional GLOBAL ASSET ROOTS (`core`,
 * `orchestrator`, `sharedDepsCss`, `themes`) — direct projections of the
 * registry document's top-level global asset fields. When set, the browser
 * loads the asset from the advertised CDN URL with SRI; when absent, it
 * falls back to the server-bundled `/bundles/...` path.
 *
 * Notably, the manifest is the FLAT projection of the layered registry doc —
 * `default` / `rollouts[]` / `tenantOverrides` collapse into a single
 * `mfes[]` once dimensions are bound. See `./resolve.ts` for the resolution
 * algorithm.
 */

import { CompatDeclaration, SharedDepsDescriptor } from './schema';
import { ValidationResult } from './schema';
import { AssetDescriptor } from './schema';

/**
 * One resolved remote in the boot manifest. Field set is deliberately the
 * minimum the browser loader needs (no `builtAgainst`, no `minCoreVersion`,
 * no `signature` — those are consumed server-side or are not on this path).
 */
export interface BootManifestEntry {
  /** Plugin id (the `default.mfes` key); echoed for ordering + inspector display. */
  id: string;
  /** Absolute URL of the resolved `remoteEntry.js`. */
  remoteEntry: string;
  /** Module Federation container scope. */
  scope: string;
  /** Exposed module key inside the container (always `./public` today). */
  module: string;
  /** Content-hash-derived version label of the resolved entry. */
  version: string;
  /** Optional SRI hash (`sha384-…`) — recommended in prod (fail-closed when present). */
  integrity?: string;
  /** Optional host-compatibility declaration (compat classifier input). */
  compat?: CompatDeclaration;
}

/**
 * The flat boot manifest. `sharedDeps` carries the same shape as the
 * top-level descriptor on the in-memory `Registry` — the singletons URL/version
 * applied to every remote.
 *
 * The optional GLOBAL ASSET ROOTS (`core`, `orchestrator`, `sharedDepsCss`,
 * `themes`) are direct projections of the registry document's top-level
 * global asset fields (see `./schema.ts`). The resolver shallow-clones
 * them onto the manifest verbatim; each is absent on the manifest exactly
 * when it is absent on the source document, at which point browser-side
 * consumers fall back to the server-bundled `/bundles/...` path for that
 * asset.
 */
export interface BootManifest {
  sharedDeps: SharedDepsDescriptor;
  mfes: BootManifestEntry[];
  /** OSD core entry script (`core.entry.js`); absent ⇒ consumer falls back to `/bundles/core/`. */
  core?: AssetDescriptor;
  /** MFE bootstrap engine (`osd_bootstrap_mfe.js`); absent ⇒ consumer falls back to server-config bootstrapUrl. */
  orchestrator?: AssetDescriptor;
  /** `osd-ui-shared-deps.css`; absent ⇒ consumer falls back to `/bundles/osd-ui-shared-deps/`. */
  sharedDepsCss?: AssetDescriptor;
  /** Per-theme CSS bundle, keyed by theme name (`light`, `dark`, ...). Absent map or missing key ⇒ fallback to `/bundles/legacy_<name>_theme.css`. */
  themes?: Record<string, AssetDescriptor>;
}

/* ------------------------------------------------------------------------- *
 * Validation
 * ------------------------------------------------------------------------- */

/**
 * SRI integrity-string prefix. Kept in sync with `schema.ts`'s
 * `SRI_INTEGRITY_PREFIX` — both files validate the SAME shape (an
 * {@link AssetDescriptor}), but each has its own copy because the boot
 * manifest validator runs on the browser side and must not pull in the
 * full registry schema validator's dependency graph just to recheck a
 * literal string prefix. The constant is `sha384-` (matches the plugin
 * `remoteEntry` SRI algorithm).
 */
const SRI_INTEGRITY_PREFIX = 'sha384-';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validate a single {@link AssetDescriptor} embedded under one of the boot
 * manifest's global asset roots (`core`, `orchestrator`, `sharedDepsCss`, or
 * a `themes[<name>]` entry), appending any problems to `errors`.
 *
 * Mirrors the rules `schema.ts` enforces on the same shape: non-empty
 * `url`; non-empty `version`; when `integrity` is present, it MUST be a
 * non-empty string starting with `"sha384-"`. The hex/base64 body itself
 * is not checked — a malformed body would still fail the browser's SRI
 * check fail-closed at load time, and parsing it in the manifest validator
 * would couple the validator to an SRI parser.
 *
 * The boot manifest validator NEVER throws; this helper only pushes
 * problems onto the shared error list so the caller can report every issue
 * at once (consistent with how plugin entries are validated below).
 */
function validateAssetDescriptor(prefix: string, value: unknown, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push(`boot manifest ${prefix} must be an object with { url, version, integrity? }`);
    return;
  }
  if (!isNonEmptyString(value.url)) {
    errors.push(`boot manifest ${prefix}.url must be a non-empty string`);
  }
  if (!isNonEmptyString(value.version)) {
    errors.push(`boot manifest ${prefix}.version must be a non-empty string`);
  }
  if (value.integrity !== undefined) {
    if (!isNonEmptyString(value.integrity)) {
      errors.push(
        `boot manifest ${prefix}.integrity, when present, must be a non-empty string starting with "${SRI_INTEGRITY_PREFIX}"`
      );
    } else if (!value.integrity.startsWith(SRI_INTEGRITY_PREFIX)) {
      errors.push(
        `boot manifest ${prefix}.integrity, when present, must start with "${SRI_INTEGRITY_PREFIX}" (got ${JSON.stringify(
          value.integrity
        )})`
      );
    }
  }
}

/**
 * Validate an unknown value against the boot manifest shape. Used to guard the
 * injected slot on the browser side (defense in depth: the server is supposed
 * to inject a well-formed manifest, but a corrupted slot must surface as a
 * descriptive error rather than a confusing `undefined.scope` crash).
 *
 * Like the registry schema validator, never throws; returns every problem found.
 *
 * The four optional GLOBAL ASSET ROOTS — `core`, `orchestrator`,
 * `sharedDepsCss`, and the `themes` map's per-theme entries — are validated
 * as {@link AssetDescriptor}s when present (non-empty url + version; optional
 * `sha384-…` integrity). Absent fields are accepted (consumers fall back to
 * the server-bundled path; see the interface docstring). The `themes` map
 * itself MUST be an object when present, and every key MUST be a non-empty
 * string (an empty theme name has no defined fallback path).
 */
export function validateBootManifest(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(value)) {
    return { valid: false, errors: ['boot manifest must be an object'] };
  }

  if (!isPlainObject(value.sharedDeps)) {
    errors.push('boot manifest sharedDeps must be an object with { url, version }');
  } else {
    if (!isNonEmptyString(value.sharedDeps.url)) {
      errors.push('boot manifest sharedDeps.url must be a non-empty string');
    }
    if (!isNonEmptyString(value.sharedDeps.version)) {
      errors.push('boot manifest sharedDeps.version must be a non-empty string');
    }
  }

  if (!Array.isArray(value.mfes)) {
    errors.push('boot manifest mfes must be an array (use [] for none)');
  } else {
    const seenIds = new Set<string>();
    value.mfes.forEach((entry, idx) => {
      validateBootManifestEntry(idx, entry, seenIds, errors);
    });
  }

  // Global asset roots — each is OPTIONAL on the manifest. The resolver only
  // sets them when the source registry document had them set, and consumers
  // fall back to the server-bundled `/bundles/...` path when absent.
  if (value.core !== undefined) {
    validateAssetDescriptor('core', value.core, errors);
  }
  if (value.orchestrator !== undefined) {
    validateAssetDescriptor('orchestrator', value.orchestrator, errors);
  }
  if (value.sharedDepsCss !== undefined) {
    validateAssetDescriptor('sharedDepsCss', value.sharedDepsCss, errors);
  }
  if (value.themes !== undefined) {
    if (!isPlainObject(value.themes)) {
      errors.push('boot manifest themes, when present, must be an object keyed by theme name');
    } else {
      for (const themeName of Object.keys(value.themes)) {
        if (themeName.length === 0) {
          errors.push('boot manifest themes contains an empty theme name (keys must be non-empty)');
          continue;
        }
        validateAssetDescriptor(
          `themes.${themeName}`,
          (value.themes as Record<string, unknown>)[themeName],
          errors
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateBootManifestEntry(
  idx: number,
  entry: unknown,
  seenIds: Set<string>,
  errors: string[]
): void {
  const prefix = `boot manifest mfes[${idx}]`;
  if (!isPlainObject(entry)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(entry.id)) {
    errors.push(`${prefix}.id must be a non-empty string`);
  } else if (seenIds.has(entry.id)) {
    errors.push(`${prefix}.id "${entry.id}" is duplicated; ids must be unique`);
  } else {
    seenIds.add(entry.id);
  }
  if (!isNonEmptyString(entry.remoteEntry)) {
    errors.push(`${prefix}.remoteEntry must be a non-empty string`);
  }
  if (!isNonEmptyString(entry.scope)) {
    errors.push(`${prefix}.scope must be a non-empty string`);
  }
  if (!isNonEmptyString(entry.module)) {
    errors.push(`${prefix}.module must be a non-empty string`);
  }
  if (!isNonEmptyString(entry.version)) {
    errors.push(`${prefix}.version must be a non-empty string`);
  }
  if (entry.integrity !== undefined && !isNonEmptyString(entry.integrity)) {
    errors.push(`${prefix}.integrity, when present, must be a non-empty string`);
  }
  if (entry.compat !== undefined) {
    if (!isPlainObject(entry.compat)) {
      errors.push(`${prefix}.compat, when present, must be an object`);
    } else {
      if (!isNonEmptyString(entry.compat.minCoreVersion)) {
        errors.push(`${prefix}.compat.minCoreVersion must be a non-empty string`);
      }
      if (!isNonEmptyString(entry.compat.compatibleCoreRange)) {
        errors.push(`${prefix}.compat.compatibleCoreRange must be a non-empty string`);
      }
    }
  }
}

/**
 * Throw-on-failure wrapper around {@link validateBootManifest}. Used by the
 * browser bootstrap when consuming the injected slot (a malformed manifest is
 * a corrupted server-side resolution and must abort load with a descriptive
 * error rather than fall through to a confusing TypeError).
 */
export function assertValidBootManifest(value: unknown): BootManifest {
  const { valid, errors } = validateBootManifest(value);
  if (!valid) {
    throw new Error(`Invalid MFE boot manifest:\n  - ${errors.join('\n  - ')}`);
  }
  return value as BootManifest;
}
