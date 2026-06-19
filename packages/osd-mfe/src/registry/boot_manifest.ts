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
 * the browser to consume in `--mfe` mode (Phase 13, Story 1).
 *
 * The browser does NOT see the v2 registry document. The server reads the v2
 * doc, runs the resolution algorithm against the requesting host's
 * {@link ResolutionDimensions}, and injects the resulting boot manifest at
 * `__osdInjectedMetadata.mfeBoot` via the existing Phase-5
 * `<osd-injected-metadata>` channel. The browser bootstrap consumes the flat
 * `mfes[]` list directly — no second registry HTTP fetch (verifier case G).
 *
 * The manifest carries ONLY what the loader needs to instantiate each remote:
 *   - `id` — for ordering and inspector panel display
 *   - `remoteEntry`, `scope`, `module` — Module Federation triple
 *   - `version` — for inspector / Phase 9 compat / debugging
 *   - `integrity?` — optional SRI hash (Phase 12, fail-closed when present)
 *   - `compat?` — optional host-compatibility declaration (Phase 9 classifier)
 *
 * Notably, the manifest is the FLAT projection of the v2 doc — `default` /
 * `rollouts[]` / `tenantOverrides` collapse into a single `mfes[]` once
 * dimensions are bound. See `./resolve_v2.ts` for the resolution algorithm.
 */

import { CompatDeclaration, SharedDepsDescriptor } from './schema';
import { ValidationResult } from './schema';

/**
 * One resolved remote in the boot manifest. Field set is deliberately the
 * minimum the browser loader needs (no `builtAgainst`, no `minCoreVersion`,
 * no `signature` — those are consumed server-side or are not on this path).
 */
export interface BootManifestEntry {
  /** Plugin id (the v1 `mfes` key); echoed for ordering + inspector display. */
  id: string;
  /** Absolute URL of the resolved `remoteEntry.js`. */
  remoteEntry: string;
  /** Module Federation container scope. */
  scope: string;
  /** Exposed module key inside the container (always `./public` today). */
  module: string;
  /** Content-hash-derived version label of the resolved entry. */
  version: string;
  /** Optional SRI hash (`sha384-…`) — recommended in prod (Phase 12). */
  integrity?: string;
  /** Optional host-compatibility declaration (Phase 9 classifier input). */
  compat?: CompatDeclaration;
}

/**
 * The flat boot manifest. `sharedDeps` carries the same shape as v1's top-level
 * descriptor — the singletons URL/version applied to every remote.
 */
export interface BootManifest {
  sharedDeps: SharedDepsDescriptor;
  mfes: BootManifestEntry[];
}

/* ------------------------------------------------------------------------- *
 * Validation
 * ------------------------------------------------------------------------- */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validate an unknown value against the boot manifest shape. Used to guard the
 * injected slot on the browser side (defense in depth: the server is supposed
 * to inject a well-formed manifest, but a corrupted slot must surface as a
 * descriptive error rather than a confusing `undefined.scope` crash).
 *
 * Like the v1/v2 validators, never throws; returns every problem found.
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
