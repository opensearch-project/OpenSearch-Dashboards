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
 * MFE registry schema v3 — registry-managed static-asset architecture
 * (Phase 16, Story 1).
 *
 * v3 extends v2 with four NEW GLOBAL top-level fields that let the registry
 * advertise the URL + integrity of assets that today are server-bundled
 * (served from the OSD server's `/bundles/...` routes):
 *
 *   - `core`           : the OSD core entry script (`core.entry.js`)
 *   - `orchestrator`   : the MFE bootstrap engine (`osd_bootstrap_mfe.js`)
 *   - `sharedDepsCss`  : the `osd-ui-shared-deps.css` bundle
 *   - `themes`         : per-theme CSS bundles (keyed by `light`/`dark`/...)
 *
 * Combined with the v2 plugin remote machinery, this completes the
 * server↔CDN separation: every asset OSD serves can be advertised via the
 * registry, hash-versioned, and SRI-pinned. ALL assets change at runtime via
 * registry update with NO server redeploy — the user-locked
 * "runtime-flexibility invariant" of Phase 16 (see PROMPT.md §"Locked
 * architectural decisions").
 *
 *   {
 *     schemaVersion: 3,
 *     generatedAt:   ISO-8601,
 *     // v2 layered substructure (unchanged):
 *     default:         V2DefaultLayer,
 *     rollouts:        V2Rollout[],
 *     tenantOverrides: Record<string, V2TenantOverride>,
 *     // v3 NEW global fields (each OPTIONAL — see §"Backward compatibility"):
 *     core?:           V3AssetDescriptor,
 *     orchestrator?:   V3AssetDescriptor,
 *     sharedDepsCss?:  V3AssetDescriptor,
 *     themes?:         Record<string, V3AssetDescriptor>,
 *     signature?:      RegistrySignature,
 *   }
 *
 * §"Why GLOBAL, not per-layer (default/rollouts/tenantOverrides)?": core,
 * orchestrator, themes, and shared-deps-css describe INFRASTRUCTURE (the OSD
 * core binary, the bootstrap engine, the platform's CSS) — not per-tenant
 * plugin variants. v2's layering (`default` / `rollouts` / `tenantOverrides`)
 * exists to traffic-shift PLUGIN versions; it does not make sense for core
 * (the OSD core can't be different per-tenant — that would be a different OSD
 * installation entirely). Keeping these fields global keeps the schema
 * simple, the resolution algorithm pure (Phase 13's resolver unchanged), and
 * the migration trivial (one set of values, not N). A future v4 can lift
 * these into the layered structure if a credible use case emerges.
 *
 * §"Backward compatibility — each new field is OPTIONAL": a v3 document MAY
 * have `core` set, `core` absent, or anywhere in between. Consumers of the
 * registry (the server-side resolver/inject path in Stories 3-7 of Phase 16)
 * check each field individually and FALL BACK to the existing server-bundled
 * `/bundles/...` path when a field is absent (PRD §"backward-compat at every
 * consumption site"). Auto-migration from v2 → v3 leaves the new fields
 * absent by default; an explicit migration with `V3MigrationDefaults` (used
 * by the dev path's server-config-derived defaults) can fill them.
 *
 * §"Why is integrity OPTIONAL on V3AssetDescriptor?": same-origin asset loads
 * do not benefit from SRI (the browser does not enforce SRI on same-origin
 * by spec). When the field is filled with a `/bundles/...` URL during the
 * migration period, integrity is correctly absent. Production registries
 * pointing at CDN URLs MUST set integrity to maintain the Phase 12 fail-closed
 * SRI posture (this is enforced by deployment, not by the schema). The
 * validator only checks: when present, integrity must match `sha384-...`.
 *
 * This module defines ONLY the shape, the runtime guards, and the
 * `migrateV2ToV3` function. Resolution + reader + injection live in
 * sibling modules (the existing Phase 13 surface continues to operate on v2
 * substructure; v3-aware consumers query the new top-level fields via
 * `coerceToV3Document`).
 */

import {
  Registry as V1Registry,
  SCHEMA_VERSION as V1_SCHEMA_VERSION,
  ValidationResult,
  validate as validateV1,
} from './schema';
import {
  SCHEMA_VERSION_V2,
  V2Document,
  V2DefaultLayer,
  V2Rollout,
  V2TenantOverride,
  assertValidV2Document,
  coerceToV2Document,
  detectRegistryShape,
  migrateV1ToV2,
  validateV2,
} from './schema_v2';

/** v3 registry schema version. Bump when the v3 shape changes incompatibly. */
export const SCHEMA_VERSION_V3 = 3;

/**
 * SRI integrity prefix the schema validator enforces when integrity is
 * present. Phase 12 standardised on `sha384-...` for plugin remoteEntry SRI;
 * v3 inherits the same algorithm for the registry-managed assets.
 */
const SRI_INTEGRITY_PREFIX = 'sha384-';

/**
 * Descriptor for ONE registry-managed asset (core / orchestrator / a single
 * theme / sharedDepsCss). The shape intentionally mirrors v2's
 * `SharedDepsDescriptor` (url + version) plus the optional `integrity` field
 * already used on `MfeEntry` for plugin remoteEntry SRI.
 *
 * - `url`       : ABSOLUTE URL where the asset lives. The registry never
 *                 carries relative URLs (the OSD server may inject relative
 *                 fallbacks for `/bundles/...` server-hosted dev paths, but
 *                 those are NOT registry data — they are server config).
 * - `integrity` : OPTIONAL SRI integrity string. When present it MUST start
 *                 with `sha384-` (the algorithm Phase 12 standardised on).
 *                 When absent, consumers MAY still load the URL but Phase 12's
 *                 fail-closed posture is forfeit for that asset; this is
 *                 acceptable only for same-origin `/bundles/...` dev URLs.
 * - `version`   : Required version label (data, not code; deployer-controlled).
 *                 Used by telemetry and cache-busting.
 */
export interface V3AssetDescriptor {
  url: string;
  integrity?: string;
  version: string;
}

/**
 * The v3 registry document shape, as stored on disk (or served by a future
 * registry HTTP service). All v3-specific top-level fields are OPTIONAL —
 * see the file header §"Backward compatibility" for the rationale.
 */
export interface V3Document {
  /** Always equals {@link SCHEMA_VERSION_V3}. */
  schemaVersion: 3;
  /** ISO-8601 timestamp of when this document was generated/last edited. */
  generatedAt: string;
  /** Baseline layer applied when no rollout/tenant override matches. */
  default: V2DefaultLayer;
  /** Rollout rules (canary traffic-shifting), evaluated in declared order. */
  rollouts: V2Rollout[];
  /** Per-tenant override layers, keyed by `customerId`. */
  tenantOverrides: Record<string, V2TenantOverride>;
  /** OSD core entry script (`core.entry.js`); absent ⇒ consumer falls back to `/bundles/core/`. */
  core?: V3AssetDescriptor;
  /** MFE bootstrap engine (`osd_bootstrap_mfe.js`); absent ⇒ consumer falls back to server-config bootstrapUrl. */
  orchestrator?: V3AssetDescriptor;
  /** `osd-ui-shared-deps.css`; absent ⇒ consumer falls back to `/bundles/osd-ui-shared-deps/`. */
  sharedDepsCss?: V3AssetDescriptor;
  /** Per-theme CSS bundle, keyed by theme name (`light`, `dark`, ...). Absent map or missing key ⇒ fallback to `/bundles/legacy_<name>_theme.css`. */
  themes?: Record<string, V3AssetDescriptor>;
}

/**
 * Server-config-derived defaults used to fill the new v3 fields when
 * AUTO-MIGRATING a v2 (or v1) document on read. Each field is optional: when
 * provided it ends up in the migrated v3 doc; when absent the corresponding
 * v3 field stays absent (consumer falls back to `/bundles/...`). This pairs
 * with §"Backward compatibility" above.
 *
 * The dev path of Phase 16 (Stories 3-7) passes server-config defaults that
 * point at the existing `/bundles/...` URLs so the migrated doc keeps booting
 * unchanged. Production registries are authored explicitly via Story 2's
 * CLI and don't rely on these defaults.
 */
export interface V3MigrationDefaults {
  core?: V3AssetDescriptor;
  orchestrator?: V3AssetDescriptor;
  sharedDepsCss?: V3AssetDescriptor;
  themes?: Record<string, V3AssetDescriptor>;
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
 * Validate a single {@link V3AssetDescriptor}, appending any problems to
 * `errors`. The descriptor MUST have a non-empty `url` and `version`; when
 * `integrity` is present it MUST start with `sha384-` (Phase 12's locked
 * algorithm). The hex/base64 body itself is not checked here — a malformed
 * body would still fail the browser's SRI check fail-closed at load time, and
 * checking it in the schema would couple v3 to an SRI parser.
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
 * Validate an unknown value against the v3 registry schema.
 *
 * Mirrors {@link assertValidV2Document}: never throws, returns every problem
 * found so the caller can log a precise diagnostic. A `true` result guarantees
 * the value is a {@link V3Document}.
 *
 * Validation strategy: delegate the v2 substructure
 * (`default`/`rollouts`/`tenantOverrides`) to a synthetic v2 document built
 * from the v3 input, then validate the v3-only top-level fields. This keeps
 * the v2 rules SINGLE-SOURCED in `schema_v2.ts` (zero duplication; future v2
 * tweaks automatically flow into v3 validation).
 */
export function validateV3(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(value)) {
    return { valid: false, errors: ['v3 registry must be an object'] };
  }

  if (value.schemaVersion !== SCHEMA_VERSION_V3) {
    errors.push(
      `schemaVersion must equal ${SCHEMA_VERSION_V3} (got ${JSON.stringify(value.schemaVersion)})`
    );
  }

  // Validate the v2-substructure by constructing a synthetic v2 doc.
  const v2View: V2Document = {
    schemaVersion: SCHEMA_VERSION_V2,
    generatedAt: value.generatedAt as string,
    default: value.default as V2DefaultLayer,
    rollouts: (value.rollouts as V2Rollout[]) ?? [],
    tenantOverrides: (value.tenantOverrides as Record<string, V2TenantOverride>) ?? {},
  };
  const v2Result = validateV2(v2View);
  if (!v2Result.valid) {
    // Re-emit v2 errors verbatim (paths already prefixed with v2-relative
    // names: `default.*`, `rollouts[i].*`, `tenantOverrides.<c>.*`).
    errors.push(...v2Result.errors);
  }

  // Validate v3-only top-level fields when present.
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
 * Throw-on-failure wrapper around {@link validateV3}. Use when an invalid
 * document is a programmer/operator error that must abort (CLI write path,
 * server-side strict load).
 */
export function assertValidV3Document(value: unknown): V3Document {
  const { valid, errors } = validateV3(value);
  if (!valid) {
    throw new Error(`Invalid v3 MFE registry:\n  - ${errors.join('\n  - ')}`);
  }
  return value as V3Document;
}

/* ------------------------------------------------------------------------- *
 * v2 → v3 forward-only migration
 * ------------------------------------------------------------------------- */

/**
 * Migrate a VALID v2 registry to a v3 document. Forward-only: v3 is never
 * written back as v2 (a v2-aware consumer that needs to operate on a v3 doc
 * uses {@link coerceToV2Document} to downgrade by stripping v3-only fields).
 *
 * The migration is LOSSLESS for the v2 substructure: `default`, `rollouts`,
 * and `tenantOverrides` are shallow-copied as-is. v3-only fields are filled
 * from the optional `defaults` parameter — each field independently: if a
 * default is provided the migrated doc carries it, otherwise the field stays
 * absent (PRD §"backward-compat at every consumption site").
 *
 * `generatedAt` is preserved so the migrated document stamps the SAME instant
 * the v2 file was generated (audit-log diff stability).
 */
export function migrateV2ToV3(v2: V2Document, defaults?: V3MigrationDefaults): V3Document {
  const out: V3Document = {
    schemaVersion: SCHEMA_VERSION_V3,
    generatedAt: v2.generatedAt,
    default: {
      sharedDeps: { ...v2.default.sharedDeps },
      mfes: { ...v2.default.mfes },
    },
    rollouts: v2.rollouts.map((r) => ({
      id: r.id,
      match: { ...r.match },
      override: { mfes: { ...r.override.mfes } },
    })),
    tenantOverrides: Object.fromEntries(
      Object.entries(v2.tenantOverrides).map(([k, layer]) => [k, { mfes: { ...layer.mfes } }])
    ),
  };
  if (defaults?.core !== undefined) {
    out.core = { ...defaults.core };
  }
  if (defaults?.orchestrator !== undefined) {
    out.orchestrator = { ...defaults.orchestrator };
  }
  if (defaults?.sharedDepsCss !== undefined) {
    out.sharedDepsCss = { ...defaults.sharedDepsCss };
  }
  if (defaults?.themes !== undefined) {
    out.themes = Object.fromEntries(
      Object.entries(defaults.themes).map(([name, asset]) => [name, { ...asset }])
    );
  }
  return out;
}

/**
 * Coerce an unknown parsed value to a {@link V3Document}, auto-migrating a
 * v1 doc (v1 → v2 → v3) or a v2 doc (v2 → v3), and validating either shape
 * strictly. Throws with a path-prefixed list of every problem on failure.
 *
 * This is the SINGLE entry point a v3-aware server-side reader should use to
 * resolve "give me a v3 doc, regardless of the on-disk shape". For
 * `defaults`, callers (the dev path) pass server-config-derived URLs that fill
 * the new v3 fields; production registries authored explicitly to v3 ignore
 * `defaults` (their fields are already set).
 */
export function coerceToV3Document(value: unknown, defaults?: V3MigrationDefaults): V3Document {
  const shape = detectRegistryShape(value);
  if (shape === 'v3') {
    return assertValidV3Document(value);
  }
  if (shape === 'v2') {
    const v2 = assertValidV2Document(value);
    return migrateV2ToV3(v2, defaults);
  }
  if (shape === 'v1') {
    // v1 → v2 (existing migration) → v3 (this story).
    const v1 = value as Record<string, unknown>;
    const stamped: unknown =
      v1.schemaVersion === V1_SCHEMA_VERSION ? v1 : { ...v1, schemaVersion: V1_SCHEMA_VERSION };
    const { valid, errors } = validateV1(stamped);
    if (!valid) {
      throw new Error(
        `Invalid v1 MFE registry (cannot auto-migrate to v3):\n  - ${errors.join('\n  - ')}`
      );
    }
    const v2 = migrateV1ToV2(stamped as V1Registry);
    return migrateV2ToV3(v2, defaults);
  }
  throw new Error(
    `Unknown MFE registry shape: schemaVersion must be ${V1_SCHEMA_VERSION} (legacy v1), ` +
      `${SCHEMA_VERSION_V2} (v2), or ${SCHEMA_VERSION_V3} (v3). Got ${JSON.stringify(
        isPlainObject(value) ? value.schemaVersion : value
      )}.`
  );
}

/**
 * Re-export {@link coerceToV2Document} so v3-era consumers have a single
 * import path for both shapes. Useful for the migration period when some
 * sites are v2-only and others are v3-aware.
 */
export { coerceToV2Document };
