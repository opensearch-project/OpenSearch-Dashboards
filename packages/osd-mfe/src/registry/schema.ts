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
