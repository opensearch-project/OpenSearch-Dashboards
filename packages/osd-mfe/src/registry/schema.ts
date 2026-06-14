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
 * MFE registry schema (Phase 2).
 *
 * The registry is an external, MUTABLE DATA document — never a code constant.
 * It maps a plugin id to the Module Federation remote that serves it, plus the
 * version/integrity metadata used to pin a specific build. Versions are DATA
 * derived from the built artifacts (`<osdVersion>+<contentHash>`); they are
 * never hardcoded in source. See docs/01-MFE-DESIGN.md §5.
 *
 * This module defines ONLY the shape + a runtime `validate()` guard. Reading,
 * resolving and generating the registry live in sibling modules so that the
 * data file itself is always loaded via the filesystem at serve time (and can
 * later be swapped for an S3/DynamoDB/service backend) rather than `require()`d.
 */

/** Current registry schema version. Bump when the shape changes incompatibly. */
export const SCHEMA_VERSION = 1;

/**
 * Where the shared dependency singletons (`@osd/ui-shared-deps`: react, eui,
 * rxjs, …) are served from, and which version. All remotes share these as MF
 * singletons, so they are described once at the top level.
 */
export interface SharedDepsDescriptor {
  /** Base URL the shared-deps assets are served from. */
  url: string;
  /** Version label for the shared-deps bundle (data, not code). */
  version: string;
}

/**
 * What a remote was BUILT AGAINST (Phase 9 compatibility contract). This is the
 * left-hand side of the compatibility axis: the OSD core version and the
 * shared-singleton semver ranges the remote's bundle expects from the host.
 *
 * It is DATA computed deterministically at generation time (osdVersion from the
 * repo `package.json`; sharedDeps from `@osd/ui-shared-deps` + the root
 * `package.json` `requiredVersion`s — the same source Module Federation uses to
 * configure its shared singletons). Today every remote is built from one tree so
 * every entry's `builtAgainst` is identical; independent deploys (Phase 10) will
 * make them diverge, and the host's classifier (Phase 9 Story 2) compares the
 * running core/shared versions against these to decide compatibility.
 *
 * `sharedDeps` only records roots whose `requiredVersion` is an expressible
 * semver range; roots disabled in the MF config (`npm:` aliases / unknown
 * versions, whose runtime check is `false`) are intentionally omitted because
 * there is no range to satisfy.
 */
export interface BuiltAgainst {
  /** OSD core version the remote was built against (semver, e.g. `"3.5.0"`). */
  osdVersion: string;
  /** Shared-singleton root -> semver range the remote requires (e.g. `react` -> `^16.14.0`). */
  sharedDeps: Record<string, string>;
}

/**
 * The remote's HOST-COMPATIBILITY declaration (Phase 9 compatibility contract):
 * the range of OSD core versions it declares itself compatible with. This is the
 * right-hand side of the OSD-core axis — the classifier checks the running core
 * version against it.
 *
 * Defaults are derived from {@link BuiltAgainst.osdVersion} at generation time:
 * `minCoreVersion = "<major>.<minor>.0"` and `compatibleCoreRange = "<major>.<minor>.x"`
 * (i.e. "same OSD major.minor"), matching the locked compatibility axis. It
 * carries no behavior in this story (data + config surface only); Story 2/3 read
 * it. This supersedes the reserved top-level {@link MfeEntry.minCoreVersion} seed.
 */
export interface CompatDeclaration {
  /** Minimum compatible OSD core version, inclusive (semver string). */
  minCoreVersion: string;
  /** Semver range of compatible OSD core versions (default `"<major>.<minor>.x"`). */
  compatibleCoreRange: string;
}

/**
 * A single micro-frontend entry: the Module Federation remote for one plugin.
 */
export interface MfeEntry {
  /**
   * Content-hash-derived version, `<osdVersion>+<contentHash>` (DATA, computed
   * from the built `remoteEntry.js`; never hardcoded).
   */
  version: string;
  /** Absolute URL of the plugin's Module Federation `remoteEntry.js`. */
  remoteEntry: string;
  /** Module Federation container scope (the plugin id). */
  scope: string;
  /** Exposed module key inside the container (always `./public` in Phase 1). */
  module: string;
  /** Optional Subresource Integrity hash (`sha384-…`); recommended in prod. */
  integrity?: string;
  /**
   * Optional/nullable compatibility seed (reserved for Phases 9/10): the minimum
   * OSD core version this remote is known to work against, as a semver string
   * (e.g. `"3.5.0"`). It is informational DATA only — nothing reads it today, so
   * its presence never changes resolution/load behavior. Reserving it now lets a
   * future host gate loading a remote whose `minCoreVersion` exceeds the running
   * core version without a schema bump. `undefined` (absent) and `null` both mean
   * "no constraint"; when present and non-null it must be a non-empty string.
   */
  minCoreVersion?: string | null;
  /**
   * What this remote was BUILT AGAINST (Phase 9). DATA populated at generation
   * time (see {@link BuiltAgainst}). Optional/absent on legacy entries — a
   * missing `builtAgainst` is treated as UNKNOWN metadata by the classifier
   * (Phase 9 Story 2), which the env policy then handles (non-prod warn+load,
   * prod skip). Carries no behavior in this story.
   */
  builtAgainst?: BuiltAgainst;
  /**
   * The remote's host-compatibility declaration (Phase 9). DATA populated at
   * generation time (see {@link CompatDeclaration}); defaults derive from
   * `builtAgainst.osdVersion`. Optional/absent on legacy entries (UNKNOWN).
   * Carries no behavior in this story.
   */
  compat?: CompatDeclaration;
}

/**
 * The full registry document, as stored in `registry/registry.json`.
 */
export interface Registry {
  /** Schema version; must equal {@link SCHEMA_VERSION}. */
  schemaVersion: number;
  /** ISO-8601 timestamp of when this registry was generated. */
  generatedAt: string;
  /** Shared dependency singletons descriptor. */
  sharedDeps: SharedDepsDescriptor;
  /** Map of plugin id -> its MFE remote descriptor. */
  mfes: Record<string, MfeEntry>;
}

/** Result of {@link validate}: `valid` plus a human-readable list of errors. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Type guard: a plain (non-null, non-array) object. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** True when `value` is a non-empty string. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validate an unknown value against the registry schema.
 *
 * This is a runtime guard for the external data file (and any service response):
 * it never throws, and instead returns every problem it finds so callers can log
 * a precise diagnostic. A `true` result guarantees the value is a {@link Registry}.
 *
 * @param value parsed JSON (or any unknown value) to validate
 * @returns `{ valid, errors }` — `errors` is empty iff `valid` is true
 */
export function validate(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(value)) {
    return { valid: false, errors: ['registry must be an object'] };
  }

  if (value.schemaVersion !== SCHEMA_VERSION) {
    errors.push(
      `schemaVersion must equal ${SCHEMA_VERSION} (got ${JSON.stringify(value.schemaVersion)})`
    );
  }

  if (!isNonEmptyString(value.generatedAt)) {
    errors.push('generatedAt must be a non-empty ISO-8601 string');
  } else if (Number.isNaN(Date.parse(value.generatedAt))) {
    errors.push(`generatedAt is not a parseable date: ${JSON.stringify(value.generatedAt)}`);
  }

  if (!isPlainObject(value.sharedDeps)) {
    errors.push('sharedDeps must be an object with { url, version }');
  } else {
    if (!isNonEmptyString(value.sharedDeps.url)) {
      errors.push('sharedDeps.url must be a non-empty string');
    }
    if (!isNonEmptyString(value.sharedDeps.version)) {
      errors.push('sharedDeps.version must be a non-empty string');
    }
  }

  if (!isPlainObject(value.mfes)) {
    errors.push('mfes must be an object keyed by plugin id');
  } else {
    const ids = Object.keys(value.mfes);
    if (ids.length === 0) {
      errors.push('mfes must contain at least one entry');
    }
    for (const id of ids) {
      validateMfeEntry(id, value.mfes[id], errors);
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Validate a single `mfes[id]` entry, appending any problems to `errors`. */
function validateMfeEntry(id: string, entry: unknown, errors: string[]): void {
  if (!isPlainObject(entry)) {
    errors.push(`mfes.${id} must be an object`);
    return;
  }

  if (!isNonEmptyString(entry.version)) {
    errors.push(`mfes.${id}.version must be a non-empty string`);
  }
  if (!isNonEmptyString(entry.remoteEntry)) {
    errors.push(`mfes.${id}.remoteEntry must be a non-empty string`);
  }
  if (!isNonEmptyString(entry.scope)) {
    errors.push(`mfes.${id}.scope must be a non-empty string`);
  }
  if (!isNonEmptyString(entry.module)) {
    errors.push(`mfes.${id}.module must be a non-empty string`);
  }
  // `integrity` is optional, but if present it must be a non-empty string.
  if (entry.integrity !== undefined && !isNonEmptyString(entry.integrity)) {
    errors.push(`mfes.${id}.integrity, when present, must be a non-empty string`);
  }
  // `minCoreVersion` is an optional/nullable compatibility seed: `undefined`
  // (absent) and `null` both mean "no constraint". When present and non-null it
  // must be a non-empty string. It carries no behavior today.
  if (
    entry.minCoreVersion !== undefined &&
    entry.minCoreVersion !== null &&
    !isNonEmptyString(entry.minCoreVersion)
  ) {
    errors.push(`mfes.${id}.minCoreVersion, when present, must be a non-empty string or null`);
  }
  // `builtAgainst` is the Phase 9 compatibility seed (optional). When present it
  // must carry a non-empty `osdVersion` and a `sharedDeps` map of non-empty
  // string semver ranges (keyed by package root).
  if (entry.builtAgainst !== undefined) {
    validateBuiltAgainst(id, entry.builtAgainst, errors);
  }
  // `compat` is the host-compatibility declaration (optional). When present both
  // `minCoreVersion` and `compatibleCoreRange` must be non-empty strings.
  if (entry.compat !== undefined) {
    validateCompat(id, entry.compat, errors);
  }
}

/** Validate a single `mfes[id].builtAgainst`, appending any problems to `errors`. */
function validateBuiltAgainst(id: string, value: unknown, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push(`mfes.${id}.builtAgainst, when present, must be an object`);
    return;
  }
  if (!isNonEmptyString(value.osdVersion)) {
    errors.push(`mfes.${id}.builtAgainst.osdVersion must be a non-empty string`);
  }
  if (!isPlainObject(value.sharedDeps)) {
    errors.push(`mfes.${id}.builtAgainst.sharedDeps must be an object of semver ranges`);
  } else {
    for (const dep of Object.keys(value.sharedDeps)) {
      if (!isNonEmptyString(value.sharedDeps[dep])) {
        errors.push(`mfes.${id}.builtAgainst.sharedDeps.${dep} must be a non-empty string`);
      }
    }
  }
}

/** Validate a single `mfes[id].compat`, appending any problems to `errors`. */
function validateCompat(id: string, value: unknown, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push(`mfes.${id}.compat, when present, must be an object`);
    return;
  }
  if (!isNonEmptyString(value.minCoreVersion)) {
    errors.push(`mfes.${id}.compat.minCoreVersion must be a non-empty string`);
  }
  if (!isNonEmptyString(value.compatibleCoreRange)) {
    errors.push(`mfes.${id}.compat.compatibleCoreRange must be a non-empty string`);
  }
}

/**
 * Convenience wrapper around {@link validate} that throws on the first failure.
 * Use when an invalid registry is a programmer/operator error that should abort
 * (e.g. the generator writing a file, or a strict load path).
 *
 * @param value parsed JSON to assert
 * @returns the same value, narrowed to {@link Registry}
 * @throws Error listing every validation problem when `value` is invalid
 */
export function assertValidRegistry(value: unknown): Registry {
  const { valid, errors } = validate(value);
  if (!valid) {
    throw new Error(`Invalid MFE registry:\n  - ${errors.join('\n  - ')}`);
  }
  return value as Registry;
}
