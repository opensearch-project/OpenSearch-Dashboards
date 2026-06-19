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
 * MFE registry schema v2 — the GOVERNED CONTRACT shape (Phase 13, Story 1).
 *
 * v2 promotes the registry from a single flat `mfes` map (Phase 2's v1 shape,
 * still served unchanged by the canonical CDN) to a layered DOCUMENT that
 * supports traffic-shifting (canary), per-tenant overrides, and one-click
 * rollback while keeping resolution PURE and SERVER-SIDE:
 *
 *   {
 *     schemaVersion: 2,
 *     generatedAt:  ISO-8601,
 *     default:      { sharedDeps, mfes: { id: MfeEntry } },
 *     rollouts:     [ { id, match: { userBucketLt?, userBucketGte?, tenantId? },
 *                       override: { mfes: { id: MfeEntry } } } ],
 *     tenantOverrides: { customerId: { mfes: { id: MfeEntry } } },
 *   }
 *
 * The browser does NOT see this document. The OSD server reads it, RESOLVES it
 * for the requesting host across two dimensions ({@link ResolutionDimensions}:
 * `customerId` from server config, `userBucket` from a sticky cookie), and
 * injects the resulting flat {@link BootManifest} into the boot HTML. See
 * `./boot_manifest.ts` for the manifest shape and the resolution algorithm
 * (Story 2) for the precedence rules:
 *   `tenantOverrides[customerId]` > first-matching `rollouts[]` > `default`.
 *
 * BACKWARDS COMPATIBILITY: a v1 document (`schemaVersion === 1` or missing,
 * with top-level `mfes`) is read AS-IF a v2 document whose `default` carries
 * the v1 content and whose `rollouts`/`tenantOverrides` are empty. The
 * canonical CDN registry MUST keep working unchanged via {@link migrateV1ToV2}.
 *
 * This module defines ONLY the shape, the runtime {@link validateV2} guard, and
 * the v1→v2 migration. The PURE resolution function lives in `./resolve_v2.ts`
 * (Story 2); the file-backed reader + OSD-server inject path lives in
 * `./reader.ts` + the legacy ui-render gate (Story 3).
 */

import {
  MfeEntry,
  Registry as V1Registry,
  SCHEMA_VERSION as V1_SCHEMA_VERSION,
  SharedDepsDescriptor,
  ValidationResult,
  validate as validateV1,
} from './schema';

/** v2 registry schema version. Bump when the v2 shape changes incompatibly. */
export const SCHEMA_VERSION_V2 = 2;

/**
 * The two PLACEHOLDER dimensions that select a layer when resolving a v2
 * document down to a flat boot manifest. Future AuthN replaces the SOURCE of
 * each (`customerId` from SSO / IAM, `userBucket` from a tenant-scoped hash)
 * without changing this contract. See PRD design_spec §2.
 *
 * - `customerId`: declared in OSD server config
 *   (`opensearchDashboards.mfe.customerId`, default `"default"`). Picks the
 *   right `tenantOverrides[customerId]` layer when present.
 * - `userBucket`: integer in `[0, 100)`, derived from a sticky HttpOnly cookie
 *   the OSD server sets on first request (hash mod 100). Used by `rollouts[]`
 *   match rules (`userBucketLt` / `userBucketGte`) for canary traffic-shifting.
 */
export interface ResolutionDimensions {
  /** Tenant identifier, default `"default"` until real AuthN. */
  customerId: string;
  /** Stable bucket assignment in `[0, 100)`, deterministic per client. */
  userBucket: number;
}

/**
 * Match rule for a single rollout. ALL declared predicates must hold for the
 * rule to MATCH (logical AND). An empty match (`{}`) matches every dimension —
 * effectively a tenant-agnostic global override scoped to that rollout's id.
 *
 * Bucket bounds are interpreted as `userBucketGte <= bucket < userBucketLt` so
 * adjacent rules tile cleanly without overlap (e.g. one rule with
 * `userBucketLt: 5` and another with `userBucketGte: 5, userBucketLt: 10`).
 */
export interface V2RolloutMatch {
  /** Match iff `bucket < userBucketLt` (strict upper bound, 0..100). */
  userBucketLt?: number;
  /** Match iff `bucket >= userBucketGte` (inclusive lower bound, 0..100). */
  userBucketGte?: number;
  /** Match iff `customerId === tenantId` (exact, case-sensitive). */
  tenantId?: string;
}

/**
 * Override layer carried by a single rollout rule. `mfes[id]` overrides the
 * default `mfes[id]` for the SAME id; ids absent here fall through to the
 * default layer per the resolution algorithm.
 */
export interface V2RolloutOverride {
  mfes: Record<string, MfeEntry>;
}

/**
 * One rollout rule. `id` is unique within `rollouts[]` (stable handle for the
 * authoring CLI's `--remove-rollout`). Within `rollouts[]`, the FIRST matching
 * rule wins per id (declared order) — see `./resolve_v2.ts`.
 */
export interface V2Rollout {
  /** Stable rule id (must be unique within the document's `rollouts[]`). */
  id: string;
  /** Match predicate evaluated against the resolution dimensions. */
  match: V2RolloutMatch;
  /** Override layer applied when the rule matches. */
  override: V2RolloutOverride;
}

/**
 * Tenant-specific override layer. Keyed by `customerId`; specific wins over
 * any rollout that would otherwise apply (precedence: tenant > rollouts >
 * default).
 */
export interface V2TenantOverride {
  mfes: Record<string, MfeEntry>;
}

/** The default layer — the baseline sharedDeps + mfes for every dimension. */
export interface V2DefaultLayer {
  sharedDeps: SharedDepsDescriptor;
  mfes: Record<string, MfeEntry>;
}

/**
 * The v2 registry document shape, as stored on disk (or served by a future
 * registry HTTP service). Phase 13 adds NO browser-side signature on the boot
 * manifest path — the v1 `signature` envelope is intentionally NOT carried
 * forward into v2 (the HMAC primitive in `./signing.ts` stays available for
 * non-browser hops). See PRD design_spec §5.
 */
export interface V2Document {
  /** Always equals {@link SCHEMA_VERSION_V2}. */
  schemaVersion: 2;
  /** ISO-8601 timestamp of when this document was generated/last edited. */
  generatedAt: string;
  /** Baseline layer applied when no rollout/tenant override matches. */
  default: V2DefaultLayer;
  /** Rollout rules (canary traffic-shifting), evaluated in declared order. */
  rollouts: V2Rollout[];
  /** Per-tenant override layers, keyed by `customerId`. */
  tenantOverrides: Record<string, V2TenantOverride>;
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

function isFiniteIntegerInBucketRange(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 100
  );
}

/**
 * Validate an unknown value against the v2 registry schema.
 *
 * Mirrors {@link validateV1}: never throws, returns every problem found so the
 * caller can log a precise diagnostic. A `true` result guarantees the value is
 * a {@link V2Document}.
 */
export function validateV2(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(value)) {
    return { valid: false, errors: ['v2 registry must be an object'] };
  }

  if (value.schemaVersion !== SCHEMA_VERSION_V2) {
    errors.push(
      `schemaVersion must equal ${SCHEMA_VERSION_V2} (got ${JSON.stringify(value.schemaVersion)})`
    );
  }

  if (!isNonEmptyString(value.generatedAt)) {
    errors.push('generatedAt must be a non-empty ISO-8601 string');
  } else if (Number.isNaN(Date.parse(value.generatedAt))) {
    errors.push(`generatedAt is not a parseable date: ${JSON.stringify(value.generatedAt)}`);
  }

  validateDefaultLayer(value.default, errors);
  validateRollouts(value.rollouts, errors);
  validateTenantOverrides(value.tenantOverrides, errors);

  return { valid: errors.length === 0, errors };
}

function validateDefaultLayer(value: unknown, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push('default must be an object with { sharedDeps, mfes }');
    return;
  }
  if (!isPlainObject(value.sharedDeps)) {
    errors.push('default.sharedDeps must be an object with { url, version }');
  } else {
    if (!isNonEmptyString(value.sharedDeps.url)) {
      errors.push('default.sharedDeps.url must be a non-empty string');
    }
    if (!isNonEmptyString(value.sharedDeps.version)) {
      errors.push('default.sharedDeps.version must be a non-empty string');
    }
  }
  if (!isPlainObject(value.mfes)) {
    errors.push('default.mfes must be an object keyed by plugin id');
  } else {
    for (const id of Object.keys(value.mfes)) {
      validateMfeEntry(`default.mfes.${id}`, value.mfes[id], errors);
    }
  }
}

function validateRollouts(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('rollouts must be an array (use [] for none)');
    return;
  }
  const seenIds = new Set<string>();
  value.forEach((rule, idx) => {
    if (!isPlainObject(rule)) {
      errors.push(`rollouts[${idx}] must be an object`);
      return;
    }
    if (!isNonEmptyString(rule.id)) {
      errors.push(`rollouts[${idx}].id must be a non-empty string`);
    } else if (seenIds.has(rule.id)) {
      errors.push(`rollouts[${idx}].id "${rule.id}" is duplicated; ids must be unique`);
    } else {
      seenIds.add(rule.id);
    }
    validateRolloutMatch(`rollouts[${idx}]`, rule.match, errors);
    validateRolloutOverride(`rollouts[${idx}]`, rule.override, errors);
  });
}

function validateRolloutMatch(prefix: string, value: unknown, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push(`${prefix}.match must be an object (use {} for match-everything)`);
    return;
  }
  if (value.userBucketLt !== undefined && !isFiniteIntegerInBucketRange(value.userBucketLt)) {
    errors.push(`${prefix}.match.userBucketLt must be an integer in [0, 100]`);
  }
  if (value.userBucketGte !== undefined && !isFiniteIntegerInBucketRange(value.userBucketGte)) {
    errors.push(`${prefix}.match.userBucketGte must be an integer in [0, 100]`);
  }
  if (
    value.userBucketLt !== undefined &&
    value.userBucketGte !== undefined &&
    isFiniteIntegerInBucketRange(value.userBucketLt) &&
    isFiniteIntegerInBucketRange(value.userBucketGte) &&
    value.userBucketGte >= value.userBucketLt
  ) {
    errors.push(`${prefix}.match: userBucketGte must be < userBucketLt when both are present`);
  }
  if (value.tenantId !== undefined && !isNonEmptyString(value.tenantId)) {
    errors.push(`${prefix}.match.tenantId, when present, must be a non-empty string`);
  }
}

function validateRolloutOverride(prefix: string, value: unknown, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push(`${prefix}.override must be an object with { mfes }`);
    return;
  }
  if (!isPlainObject(value.mfes)) {
    errors.push(`${prefix}.override.mfes must be an object keyed by plugin id`);
    return;
  }
  // A rollout with an empty override.mfes is structurally valid but vacuously
  // a no-op — flag it so an authoring mistake (forgot to populate the layer)
  // surfaces as a schema warning, not a silent runtime fall-through to default.
  if (Object.keys(value.mfes).length === 0) {
    errors.push(`${prefix}.override.mfes must contain at least one entry`);
    return;
  }
  for (const id of Object.keys(value.mfes)) {
    validateMfeEntry(`${prefix}.override.mfes.${id}`, value.mfes[id], errors);
  }
}

function validateTenantOverrides(value: unknown, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push('tenantOverrides must be an object (use {} for none)');
    return;
  }
  for (const customerId of Object.keys(value)) {
    if (!isNonEmptyString(customerId)) {
      errors.push(`tenantOverrides has an empty-string customerId key`);
      continue;
    }
    const layer = value[customerId];
    if (!isPlainObject(layer)) {
      errors.push(`tenantOverrides.${customerId} must be an object with { mfes }`);
      continue;
    }
    if (!isPlainObject(layer.mfes)) {
      errors.push(`tenantOverrides.${customerId}.mfes must be an object keyed by plugin id`);
      continue;
    }
    if (Object.keys(layer.mfes).length === 0) {
      errors.push(`tenantOverrides.${customerId}.mfes must contain at least one entry`);
      continue;
    }
    for (const id of Object.keys(layer.mfes)) {
      validateMfeEntry(`tenantOverrides.${customerId}.mfes.${id}`, layer.mfes[id], errors);
    }
  }
}

/**
 * Validate a single MfeEntry-shaped value at `prefix` (for path-prefixed error
 * messages). Mirrors `validateMfeEntry` in `./schema.ts`; keeping it local
 * avoids exporting that file's internal helpers and lets v2-specific paths
 * (default.mfes / rollouts[i].override.mfes / tenantOverrides[c].mfes) report
 * precise field locations.
 */
function validateMfeEntry(prefix: string, entry: unknown, errors: string[]): void {
  if (!isPlainObject(entry)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(entry.version)) {
    errors.push(`${prefix}.version must be a non-empty string`);
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
  if (entry.integrity !== undefined && !isNonEmptyString(entry.integrity)) {
    errors.push(`${prefix}.integrity, when present, must be a non-empty string`);
  }
  if (
    entry.minCoreVersion !== undefined &&
    entry.minCoreVersion !== null &&
    !isNonEmptyString(entry.minCoreVersion)
  ) {
    errors.push(`${prefix}.minCoreVersion, when present, must be a non-empty string or null`);
  }
  if (entry.builtAgainst !== undefined) {
    if (!isPlainObject(entry.builtAgainst)) {
      errors.push(`${prefix}.builtAgainst, when present, must be an object`);
    } else {
      if (!isNonEmptyString(entry.builtAgainst.osdVersion)) {
        errors.push(`${prefix}.builtAgainst.osdVersion must be a non-empty string`);
      }
      if (!isPlainObject(entry.builtAgainst.sharedDeps)) {
        errors.push(`${prefix}.builtAgainst.sharedDeps must be an object of semver ranges`);
      } else {
        for (const dep of Object.keys(entry.builtAgainst.sharedDeps)) {
          if (!isNonEmptyString(entry.builtAgainst.sharedDeps[dep])) {
            errors.push(`${prefix}.builtAgainst.sharedDeps.${dep} must be a non-empty string`);
          }
        }
      }
    }
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
 * Throw-on-failure wrapper around {@link validateV2}. Use when an invalid
 * document is a programmer/operator error that must abort (CLI write path,
 * server-side strict load).
 */
export function assertValidV2Document(value: unknown): V2Document {
  const { valid, errors } = validateV2(value);
  if (!valid) {
    throw new Error(`Invalid v2 MFE registry:\n  - ${errors.join('\n  - ')}`);
  }
  return value as V2Document;
}

/* ------------------------------------------------------------------------- *
 * v1 → v2 auto-migration (canonical CDN compat)
 * ------------------------------------------------------------------------- */

/**
 * Migrate a VALID v1 registry to a v2 document. Lossless for the data v2 cares
 * about: `default.sharedDeps` and `default.mfes` carry the v1 content;
 * `rollouts: []` and `tenantOverrides: {}` are empty (the v1 shape has no
 * concept of either). The v1 `signature` envelope is dropped — Phase 13's
 * boot-manifest path is unsigned by design (PRD design_spec §5).
 *
 * `generatedAt` is preserved so the migrated document stamps the SAME instant
 * the v1 file was generated; this keeps audit-log diffs stable across reads.
 */
export function migrateV1ToV2(v1: V1Registry): V2Document {
  return {
    schemaVersion: SCHEMA_VERSION_V2,
    generatedAt: v1.generatedAt,
    default: {
      sharedDeps: { ...v1.sharedDeps },
      mfes: { ...v1.mfes },
    },
    rollouts: [],
    tenantOverrides: {},
  };
}

/**
 * Heuristic: classify a parsed JSON value as a v1 doc, a v2 doc, or neither
 * (so the reader can pick a validator). The check looks ONLY at
 * `schemaVersion` because v1 (`SCHEMA_VERSION === 1`) and v2
 * (`SCHEMA_VERSION_V2 === 2`) share no required field names — distinguishing
 * by `schemaVersion` first avoids a confusing "both validators fail" diagnostic
 * when the doc is simply mistyped.
 *
 * A v1 doc with `schemaVersion` missing (legacy seed) is also classified as
 * v1: its top-level shape (`{ schemaVersion?, generatedAt, sharedDeps, mfes }`)
 * is the v1 contract; absence of `schemaVersion` is treated as an implicit `1`.
 */
export type DetectedRegistryShape = 'v1' | 'v2' | 'unknown';

export function detectRegistryShape(value: unknown): DetectedRegistryShape {
  if (!isPlainObject(value)) return 'unknown';
  const sv = value.schemaVersion;
  if (sv === SCHEMA_VERSION_V2) return 'v2';
  if (sv === V1_SCHEMA_VERSION || sv === undefined) return 'v1';
  return 'unknown';
}

/**
 * Coerce an unknown parsed value to a {@link V2Document}, auto-migrating a v1
 * doc and validating either shape strictly. Throws with a path-prefixed list
 * of every problem on failure (mirrors {@link assertValidV2Document}).
 *
 * This is the SINGLE entry point a server-side reader should use to resolve
 * "give me a v2 doc, regardless of the on-disk shape". It guarantees the
 * canonical CDN registry (v1 shape) keeps loading via auto-migration.
 */
export function coerceToV2Document(value: unknown): V2Document {
  const shape = detectRegistryShape(value);
  if (shape === 'v2') {
    return assertValidV2Document(value);
  }
  if (shape === 'v1') {
    const v1 = (value as Record<string, unknown>);
    // A missing schemaVersion is treated as v1; the v1 validator REQUIRES
    // SCHEMA_VERSION === 1, so we stamp it before validating. This does NOT
    // mutate the caller's input — we work on a shallow copy.
    const stamped: unknown =
      v1.schemaVersion === V1_SCHEMA_VERSION
        ? v1
        : { ...v1, schemaVersion: V1_SCHEMA_VERSION };
    const { valid, errors } = validateV1(stamped);
    if (!valid) {
      throw new Error(
        `Invalid v1 MFE registry (cannot auto-migrate to v2):\n  - ${errors.join('\n  - ')}`
      );
    }
    return migrateV1ToV2(stamped as V1Registry);
  }
  throw new Error(
    `Unknown MFE registry shape: schemaVersion must be ${V1_SCHEMA_VERSION} (legacy v1) or ` +
      `${SCHEMA_VERSION_V2} (v2). Got ${JSON.stringify(
        isPlainObject(value) ? value.schemaVersion : value
      )}.`
  );
}
