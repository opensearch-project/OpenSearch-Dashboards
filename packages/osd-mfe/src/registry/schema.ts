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
 * MFE registry schema (`schemaVersion: 1`) — the SINGLE shippable shape.
 *
 * The registry is an external, MUTABLE DATA document — never a code constant.
 * Its shape combines:
 *
 *   1. A LAYERED PLUGIN SUBSTRUCTURE (`default` / `rollouts[]` /
 *      `tenantOverrides{}`) that supports baseline plugin pinning, canary
 *      traffic-shifting and per-tenant overrides. The browser never sees this
 *      structure: the OSD server resolves it across two dimensions
 *      (`customerId` from server config, `userBucket` from a sticky cookie)
 *      into a flat `BootManifest` and injects that into the boot HTML. See
 *      `./boot_manifest.ts` for the manifest shape and `./resolve.ts` for the
 *      resolution algorithm.
 *
 *   2. Four OPTIONAL GLOBAL ASSET ROOTS — `core`, `orchestrator`,
 *      `sharedDepsCss`, `themes` — that let the registry advertise the URL +
 *      integrity of assets that today are server-bundled (served from the OSD
 *      server's `/bundles/...` routes). When set, consumers load the asset
 *      from the registry-supplied CDN URL with SRI; when absent, consumers
 *      fall back to the server-bundled path. Together with the plugin layer
 *      this completes the server↔CDN separation: every asset OSD serves can
 *      be advertised via the registry, hash-versioned, and SRI-pinned. All
 *      assets change at runtime via registry update with NO server redeploy.
 *
 *   {
 *     schemaVersion: 1,
 *     generatedAt:   ISO-8601,
 *     default:         DefaultLayer,
 *     rollouts:        Rollout[],
 *     tenantOverrides: Record<string, TenantOverride>,
 *     core?:           AssetDescriptor,
 *     orchestrator?:   AssetDescriptor,
 *     sharedDepsCss?:  AssetDescriptor,
 *     themes?:         Record<string, AssetDescriptor>,
 *     signature?:      RegistrySignature,
 *   }
 *
 * §"Why GLOBAL, not per-layer (default/rollouts/tenantOverrides)?":
 * `core`, `orchestrator`, `themes`, and `sharedDepsCss` describe
 * INFRASTRUCTURE (the OSD core binary, the bootstrap engine, the platform's
 * CSS) — not per-tenant plugin variants. The layered structure exists to
 * traffic-shift PLUGIN versions; it does not make sense for core (the OSD
 * core can't be different per-tenant — that would be a different OSD
 * installation entirely). Keeping these fields global keeps the schema
 * simple and the resolution algorithm pure.
 *
 * §"Each global field is OPTIONAL": a registry document MAY have `core` set,
 * `core` absent, or anywhere in between. Consumers check each field
 * individually and FALL BACK to the existing server-bundled `/bundles/...`
 * path when a field is absent.
 *
 * §"Why is integrity OPTIONAL on AssetDescriptor?": same-origin asset loads
 * do not benefit from SRI (the browser does not enforce SRI on same-origin
 * by spec). When the field is filled with a `/bundles/...` URL, integrity is
 * correctly absent. Production registries pointing at CDN URLs MUST set
 * integrity to maintain the fail-closed SRI posture (enforced by deployment,
 * not by the schema). The validator only checks: when present, integrity
 * must match `sha384-...`.
 *
 * §"Flat in-memory `Registry` shape":
 * In addition to the on-disk `RegistryDocument` shape above, this module
 * also defines a FLAT in-memory `Registry` shape used by the bootstrap layer
 * (after the OSD server resolves the on-disk doc into a flat `BootManifest`,
 * the browser materialises that into a flat `Registry` for plugin loading).
 * The flat shape is a convenience for in-memory plugin loading — it never
 * appears on disk. `validate`/`assertValidRegistry` validate the flat shape;
 * `validateRegistry`/`assertValidRegistryDocument` validate the on-disk shape.
 * Both validators check `schemaVersion === 1` and discriminate the two
 * shapes by their key set (`mfes` at top level vs. `default.mfes`).
 *
 * This module defines ONLY the shape + the runtime validation guards.
 * Resolution + reader + injection live in sibling modules.
 */

import { RegistrySignature } from './signing_common';

/** Current registry schema version. Bump when the shape changes incompatibly. */
export const SCHEMA_VERSION = 1;

/**
 * SRI integrity prefix the schema validator enforces when integrity is
 * present. The registry uses `sha384-...` for all registry-managed asset SRI
 * (matches the plugin `remoteEntry` SRI algorithm).
 */
const SRI_INTEGRITY_PREFIX = 'sha384-';

/* ------------------------------------------------------------------------- *
 * Shared registry entry types (referenced by both the flat in-memory
 * `Registry` and the on-disk `RegistryDocument` layered substructure).
 * ------------------------------------------------------------------------- */

/** Result of a runtime validation: `valid` plus a human-readable list of errors. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Where the shared dependency singletons (`@osd/ui-shared-deps`: react, eui,
 * rxjs, …) are served from, and which version. All remotes share these as MF
 * singletons, so they are described once at the top of the layer that owns
 * them.
 */
export interface SharedDepsDescriptor {
  /** Base URL the shared-deps assets are served from. */
  url: string;
  /** Version label for the shared-deps bundle (data, not code). */
  version: string;
}

/**
 * What a remote was BUILT AGAINST (compat contract). This is
 * the left-hand side of the compatibility axis: the OSD core version and the
 * shared-singleton semver ranges the remote's bundle expects from the host.
 *
 * It is DATA computed deterministically at generation time (osdVersion from
 * the repo `package.json`; sharedDeps from `@osd/ui-shared-deps` + the root
 * `package.json` `requiredVersion`s — the same source Module Federation uses
 * to configure its shared singletons). Today every remote is built from one
 * tree so every entry's `builtAgainst` is identical; independent deploys
 * will make them diverge, and the host's classifier compares the running
 * core/shared versions against these to decide compatibility.
 *
 * `sharedDeps` only records roots whose `requiredVersion` is an expressible
 * semver range; roots disabled in the MF config (`npm:` aliases / unknown
 * versions, whose runtime check is `false`) are intentionally omitted
 * because there is no range to satisfy.
 */
export interface BuiltAgainst {
  /** OSD core version the remote was built against (semver, e.g. `"3.5.0"`). */
  osdVersion: string;
  /** Shared-singleton root -> semver range the remote requires (e.g. `react` -> `^16.14.0`). */
  sharedDeps: Record<string, string>;
}

/**
 * The remote's HOST-COMPATIBILITY declaration (compat contract): the range of
 * OSD core versions it declares itself compatible with. This is the right-hand
 * side of the OSD-core axis — the classifier checks the running core version
 * against it.
 *
 * Defaults are derived from {@link BuiltAgainst.osdVersion} at generation
 * time: `minCoreVersion = "<major>.<minor>.0"` and
 * `compatibleCoreRange = "<major>.<minor>.x"` (i.e. "same OSD major.minor"),
 * matching the locked compatibility axis.
 */
export interface CompatDeclaration {
  /** Minimum compatible OSD core version, inclusive (semver string). */
  minCoreVersion: string;
  /** Semver range of compatible OSD core versions (default `"<major>.<minor>.x"`). */
  compatibleCoreRange: string;
}

/**
 * A single micro-frontend entry: the Module Federation remote for one
 * plugin. Used by both the flat in-memory shape (`Registry.mfes[id]`) and
 * the layered on-disk shape (`default.mfes[id]`, `rollouts[i].override.mfes[id]`,
 * `tenantOverrides[c].mfes[id]`).
 */
export interface MfeEntry {
  /**
   * Content-hash-derived version, `<osdVersion>+<contentHash>` (DATA,
   * computed from the built `remoteEntry.js`; never hardcoded).
   */
  version: string;
  /** Absolute URL of the plugin's Module Federation `remoteEntry.js`. */
  remoteEntry: string;
  /** Module Federation container scope (the plugin id). */
  scope: string;
  /** Exposed module key inside the container (always `./public`). */
  module: string;
  /** Optional Subresource Integrity hash (`sha384-…`); recommended in prod. */
  integrity?: string;
  /**
   * Optional/nullable compatibility seed: the minimum OSD core version this
   * remote is known to work against, as a semver string (e.g. `"3.5.0"`). It
   * is informational DATA only — nothing reads it today, so its presence
   * never changes resolution/load behavior. `undefined` (absent) and `null`
   * both mean "no constraint"; when present and non-null it must be a
   * non-empty string.
   */
  minCoreVersion?: string | null;
  /**
   * What this remote was BUILT AGAINST. DATA populated at
   * generation time (see {@link BuiltAgainst}). Optional/absent on legacy
   * entries — a missing `builtAgainst` is treated as UNKNOWN metadata by the
   * classifier, which the env policy then handles (non-prod warn+load, prod
   * skip).
   */
  builtAgainst?: BuiltAgainst;
  /**
   * The remote's host-compatibility declaration. DATA populated at
   * generation time (see {@link CompatDeclaration}); defaults derive from
   * `builtAgainst.osdVersion`. Optional/absent on legacy entries (UNKNOWN).
   */
  compat?: CompatDeclaration;
}

/* ------------------------------------------------------------------------- *
 * Flat in-memory `Registry` shape
 *
 * The bootstrap layer (browser-side) consumes the server-injected
 * `BootManifest` and materialises it into this flat shape for plugin loading.
 * The flat shape NEVER appears on disk (the on-disk schema is the layered
 * `RegistryDocument` below). Kept here so all registry shapes are
 * single-sourced.
 * ------------------------------------------------------------------------- */

/**
 * The flat in-memory registry shape used by the bootstrap layer after the
 * server-resolved `BootManifest` is materialised. Earlier iterations of the
 * dynamic registry stored this shape on disk as well; today the on-disk format
 * is the layered {@link RegistryDocument} and the flat shape exists only in
 * memory.
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
  /**
   * Optional authenticity signature over the registry (registry authenticity
   * envelope). Present on the CDN flat-shape registry used by the bootstrap
   * verifier; absent on in-memory registries materialised from a server-
   * injected boot manifest. See `./signing_common.ts` for the envelope and
   * canonicalisation contract.
   */
  signature?: RegistrySignature;
}

/* ------------------------------------------------------------------------- *
 * Layered on-disk `RegistryDocument` shape (`schemaVersion: 1`)
 * ------------------------------------------------------------------------- */

/**
 * The two PLACEHOLDER dimensions that select a layer when resolving an
 * on-disk document down to a flat boot manifest. Future AuthN replaces the
 * SOURCE of each (`customerId` from SSO / IAM, `userBucket` from a
 * tenant-scoped hash) without changing this contract.
 *
 * - `customerId`: declared in OSD server config
 *   (`opensearchDashboards.mfe.customerId`, default `"default"`). Picks the
 *   right `tenantOverrides[customerId]` layer when present.
 * - `userBucket`: integer in `[0, 100)`, derived from a sticky HttpOnly
 *   cookie the OSD server sets on first request (hash mod 100). Used by
 *   `rollouts[]` match rules (`userBucketLt` / `userBucketGte`) for canary
 *   traffic-shifting.
 */
export interface ResolutionDimensions {
  /** Tenant identifier, default `"default"` until real AuthN. */
  customerId: string;
  /** Stable bucket assignment in `[0, 100)`, deterministic per client. */
  userBucket: number;
}

/**
 * Match rule for a single rollout. ALL declared predicates must hold for the
 * rule to MATCH (logical AND). An empty match (`{}`) matches every dimension
 * — effectively a tenant-agnostic global override scoped to that rollout's
 * id.
 *
 * Bucket bounds are interpreted as `userBucketGte <= bucket < userBucketLt`
 * so adjacent rules tile cleanly without overlap (e.g. one rule with
 * `userBucketLt: 5` and another with `userBucketGte: 5, userBucketLt: 10`).
 */
export interface RolloutMatch {
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
export interface RolloutOverride {
  mfes: Record<string, MfeEntry>;
}

/**
 * One rollout rule. `id` is unique within `rollouts[]` (stable handle for
 * the authoring CLI's `--remove-rollout`). Within `rollouts[]`, the FIRST
 * matching rule wins per id (declared order) — see `./resolve.ts`.
 */
export interface Rollout {
  /** Stable rule id (must be unique within the document's `rollouts[]`). */
  id: string;
  /** Match predicate evaluated against the resolution dimensions. */
  match: RolloutMatch;
  /** Override layer applied when the rule matches. */
  override: RolloutOverride;
}

/**
 * Tenant-specific override layer. Keyed by `customerId`; tenant wins over
 * any rollout that would otherwise apply (precedence: tenant > rollouts >
 * default).
 */
export interface TenantOverride {
  mfes: Record<string, MfeEntry>;
}

/** The default layer — the baseline sharedDeps + mfes for every dimension. */
export interface DefaultLayer {
  sharedDeps: SharedDepsDescriptor;
  mfes: Record<string, MfeEntry>;
}

/**
 * Descriptor for ONE registry-managed asset (core / orchestrator / a single
 * theme / sharedDepsCss).
 *
 * - `url`       : ABSOLUTE URL where the asset lives. The registry never
 *                 carries relative URLs (the OSD server may inject relative
 *                 fallbacks for `/bundles/...` server-hosted dev paths, but
 *                 those are NOT registry data — they are server config).
 * - `integrity` : OPTIONAL SRI integrity string. When present it MUST start
 *                 with `sha384-`. When absent, consumers MAY still load the
 *                 URL but the fail-closed SRI posture is forfeit for that
 *                 asset; this is acceptable only for same-origin
 *                 `/bundles/...` dev URLs.
 * - `version`   : Required version label (data, not code; deployer-controlled).
 *                 Used by telemetry and cache-busting.
 */
export interface AssetDescriptor {
  url: string;
  integrity?: string;
  version: string;
}

/**
 * The registry document shape, as stored on disk (or served by a future
 * registry HTTP service). All global asset fields are OPTIONAL — consumers
 * fall back to the server-bundled `/bundles/...` path when absent.
 */
export interface RegistryDocument {
  /** Always equals {@link SCHEMA_VERSION}. */
  schemaVersion: 1;
  /** ISO-8601 timestamp of when this document was generated/last edited. */
  generatedAt: string;
  /** Baseline plugin layer applied when no rollout/tenant override matches. */
  default: DefaultLayer;
  /** Rollout rules (canary traffic-shifting), evaluated in declared order. */
  rollouts: Rollout[];
  /** Per-tenant plugin override layers, keyed by `customerId`. */
  tenantOverrides: Record<string, TenantOverride>;
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

/** Type guard: a plain (non-null, non-array) object. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** True when `value` is a non-empty string. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** True when `value` is a finite integer in `[0, 100]`. */
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
 * Validate a single {@link AssetDescriptor}, appending any problems to
 * `errors`. The descriptor MUST have a non-empty `url` and `version`; when
 * `integrity` is present it MUST start with `sha384-`.
 */
function validateAssetDescriptor(prefix: string, value: unknown, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push(`${prefix} must be an object with { url, version, integrity? }`);
    return;
  }
  if (!isNonEmptyString(value.url)) {
    errors.push(`${prefix}.url must be a non-empty string`);
  }
  if (!isNonEmptyString(value.version)) {
    errors.push(`${prefix}.version must be a non-empty string`);
  }
  if (value.integrity !== undefined) {
    if (!isNonEmptyString(value.integrity)) {
      errors.push(
        `${prefix}.integrity, when present, must be a non-empty string starting with "${SRI_INTEGRITY_PREFIX}"`
      );
    } else if (!value.integrity.startsWith(SRI_INTEGRITY_PREFIX)) {
      errors.push(
        `${prefix}.integrity, when present, must start with "${SRI_INTEGRITY_PREFIX}" (got ${JSON.stringify(
          value.integrity
        )})`
      );
    }
  }
}

/**
 * Validate the optional `signature` envelope, appending any problems to
 * `errors`. The envelope must carry `{ algorithm, keyId, value }` non-empty
 * strings; a signature MISMATCH is reported by the verifier, not here.
 */
function validateSignature(value: unknown, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push('signature, when present, must be an object { algorithm, keyId, value }');
    return;
  }
  if (!isNonEmptyString(value.algorithm)) {
    errors.push('signature.algorithm must be a non-empty string');
  }
  if (!isNonEmptyString(value.keyId)) {
    errors.push('signature.keyId must be a non-empty string');
  }
  if (!isNonEmptyString(value.value)) {
    errors.push('signature.value must be a non-empty (base64) string');
  }
}

/** Validate a single `mfes[id]` entry under a path prefix, appending any problems to `errors`. */
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
    validateBuiltAgainst(prefix, entry.builtAgainst, errors);
  }
  if (entry.compat !== undefined) {
    validateCompat(prefix, entry.compat, errors);
  }
}

function validateBuiltAgainst(prefix: string, value: unknown, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push(`${prefix}.builtAgainst, when present, must be an object`);
    return;
  }
  if (!isNonEmptyString(value.osdVersion)) {
    errors.push(`${prefix}.builtAgainst.osdVersion must be a non-empty string`);
  }
  if (!isPlainObject(value.sharedDeps)) {
    errors.push(`${prefix}.builtAgainst.sharedDeps must be an object of semver ranges`);
  } else {
    for (const dep of Object.keys(value.sharedDeps)) {
      if (!isNonEmptyString(value.sharedDeps[dep])) {
        errors.push(`${prefix}.builtAgainst.sharedDeps.${dep} must be a non-empty string`);
      }
    }
  }
}

function validateCompat(prefix: string, value: unknown, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push(`${prefix}.compat, when present, must be an object`);
    return;
  }
  if (!isNonEmptyString(value.minCoreVersion)) {
    errors.push(`${prefix}.compat.minCoreVersion must be a non-empty string`);
  }
  if (!isNonEmptyString(value.compatibleCoreRange)) {
    errors.push(`${prefix}.compat.compatibleCoreRange must be a non-empty string`);
  }
}

/* ------------------------------------------------------------------------- *
 * Flat `Registry` validation (in-memory shape)
 * ------------------------------------------------------------------------- */

/**
 * Validate an unknown value against the flat in-memory {@link Registry}
 * shape. Never throws, returns every problem found so the caller can log a
 * precise diagnostic. A `true` result guarantees the value is a
 * {@link Registry}.
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
      validateMfeEntry(`mfes.${id}`, value.mfes[id], errors);
    }
  }

  if (value.signature !== undefined) {
    validateSignature(value.signature, errors);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Throw-on-failure wrapper around {@link validate} (flat in-memory shape).
 */
export function assertValidRegistry(value: unknown): Registry {
  const { valid, errors } = validate(value);
  if (!valid) {
    throw new Error(`Invalid MFE registry:\n  - ${errors.join('\n  - ')}`);
  }
  return value as Registry;
}

/* ------------------------------------------------------------------------- *
 * Layered `RegistryDocument` validation (on-disk shape)
 * ------------------------------------------------------------------------- */

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
 * Validate an unknown value against the on-disk {@link RegistryDocument}
 * schema. Never throws, returns every problem found so the caller can log a
 * precise diagnostic. A `true` result guarantees the value is a
 * {@link RegistryDocument}.
 */
export function validateRegistry(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(value)) {
    return { valid: false, errors: ['MFE registry must be an object'] };
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

  validateDefaultLayer(value.default, errors);
  validateRollouts(value.rollouts, errors);
  validateTenantOverrides(value.tenantOverrides, errors);

  // Validate global asset roots when present.
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
      errors.push('themes, when present, must be an object keyed by theme name');
    } else {
      for (const themeName of Object.keys(value.themes)) {
        if (!isNonEmptyString(themeName)) {
          errors.push('themes has an empty-string key');
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

/**
 * Throw-on-failure wrapper around {@link validateRegistry} (on-disk shape).
 * Use when an invalid document is a programmer/operator error that must
 * abort (CLI write path, server-side strict load).
 */
export function assertValidRegistryDocument(value: unknown): RegistryDocument {
  const { valid, errors } = validateRegistry(value);
  if (!valid) {
    throw new Error(`Invalid MFE registry:\n  - ${errors.join('\n  - ')}`);
  }
  return value as RegistryDocument;
}
