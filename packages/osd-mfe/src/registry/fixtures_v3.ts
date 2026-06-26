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
 * Shared test fixtures for the v3 registry shape (Phase 16, Story 1).
 *
 * Mirrors `fixtures_v2.ts`: every scenario v3-aware tests need is captured
 * here as a builder returning a fresh object the caller can mutate without
 * leaking state across tests. The v2 plugin-level fixtures from
 * `fixtures_v2.ts` are RE-USED — v3 doesn't change the v2 substructure.
 */

import { V2Document } from './schema_v2';
import { SCHEMA_VERSION_V3, V3AssetDescriptor, V3Document, V3MigrationDefaults } from './schema_v3';
import {
  FIXTURE_GENERATED_AT,
  FIXTURE_INSPECTOR_DEFAULT,
  FIXTURE_DASHBOARD_DEFAULT,
  FIXTURE_SHARED_DEPS,
  fixtureV2DefaultOnly,
} from './fixtures_v2';

/* ------------------------------------------------------------------------- *
 * V3-only asset descriptor fixtures
 * ------------------------------------------------------------------------- */

/** Canonical core.entry.js asset (CDN-hosted, SRI-pinned). */
export const FIXTURE_CORE_ASSET: V3AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/core/abc123/core.entry.js',
  integrity: 'sha384-coreabc123def456',
  version: '3.5.0+core00000000',
};

/** Canonical orchestrator (osd_bootstrap_mfe.js) asset. */
export const FIXTURE_ORCHESTRATOR_ASSET: V3AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/orchestrator/def456/osd_bootstrap_mfe.js',
  integrity: 'sha384-orcdef456ghi789',
  version: '3.5.0+orc00000000',
};

/** Canonical sharedDepsCss asset (osd-ui-shared-deps.css). */
export const FIXTURE_SHARED_DEPS_CSS_ASSET: V3AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/shared-deps/css/ghi789/osd-ui-shared-deps.css',
  integrity: 'sha384-sdcghi789jkl012',
  version: '3.5.0+sdc00000000',
};

/** Canonical light theme CSS asset. */
export const FIXTURE_THEME_LIGHT_ASSET: V3AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/themes/light/jkl012/legacy_light_theme.css',
  integrity: 'sha384-thljkl012mno345',
  version: '3.5.0+thl00000000',
};

/** Canonical dark theme CSS asset. */
export const FIXTURE_THEME_DARK_ASSET: V3AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/themes/dark/mno345/legacy_dark_theme.css',
  integrity: 'sha384-thdmno345pqr678',
  version: '3.5.0+thd00000000',
};

/**
 * The "all v3 fields present" migration-defaults fixture: a fully-populated
 * V3MigrationDefaults that fills core+orchestrator+sharedDepsCss+themes
 * during auto-migration. Useful for migration round-trip tests.
 */
export function fixtureV3MigrationDefaultsAll(): V3MigrationDefaults {
  return {
    core: { ...FIXTURE_CORE_ASSET },
    orchestrator: { ...FIXTURE_ORCHESTRATOR_ASSET },
    sharedDepsCss: { ...FIXTURE_SHARED_DEPS_CSS_ASSET },
    themes: {
      light: { ...FIXTURE_THEME_LIGHT_ASSET },
      dark: { ...FIXTURE_THEME_DARK_ASSET },
    },
  };
}

/* ------------------------------------------------------------------------- *
 * V3 document fixtures
 * ------------------------------------------------------------------------- */

/**
 * v3 default-only doc with ALL FOUR new fields populated. This is the
 * "production-shaped" v3 fixture — every consumer site should be able to
 * resolve every asset from the registry.
 */
export function fixtureV3FullyPopulated(): V3Document {
  return {
    schemaVersion: SCHEMA_VERSION_V3,
    generatedAt: FIXTURE_GENERATED_AT,
    default: {
      sharedDeps: { ...FIXTURE_SHARED_DEPS },
      mfes: {
        inspector: { ...FIXTURE_INSPECTOR_DEFAULT },
        dashboard: { ...FIXTURE_DASHBOARD_DEFAULT },
      },
    },
    rollouts: [],
    tenantOverrides: {},
    core: { ...FIXTURE_CORE_ASSET },
    orchestrator: { ...FIXTURE_ORCHESTRATOR_ASSET },
    sharedDepsCss: { ...FIXTURE_SHARED_DEPS_CSS_ASSET },
    themes: {
      light: { ...FIXTURE_THEME_LIGHT_ASSET },
      dark: { ...FIXTURE_THEME_DARK_ASSET },
    },
  };
}

/**
 * v3 doc with NO v3-only fields set. This is the "freshly migrated from v2"
 * shape — schemaVersion is 3, but every consumer falls through to the
 * server-bundled fallback (PRD §"backward-compat at every consumption site").
 */
export function fixtureV3MigrationOnly(): V3Document {
  const v2 = fixtureV2DefaultOnly();
  return {
    schemaVersion: SCHEMA_VERSION_V3,
    generatedAt: v2.generatedAt,
    default: v2.default,
    rollouts: v2.rollouts,
    tenantOverrides: v2.tenantOverrides,
  };
}

/**
 * v3 doc with PARTIAL v3 fields: `core` and `orchestrator` set,
 * `sharedDepsCss` and `themes` absent. Models a registry being incrementally
 * upgraded (Stories 3 + 5 of Phase 16 land, Stories 6 + 7 haven't yet).
 */
export function fixtureV3PartiallyPopulated(): V3Document {
  const base = fixtureV3MigrationOnly();
  return {
    ...base,
    core: { ...FIXTURE_CORE_ASSET },
    orchestrator: { ...FIXTURE_ORCHESTRATOR_ASSET },
  };
}

/**
 * A v3 doc with a deliberate malformed integrity (`sha256-...` not allowed —
 * the schema enforces `sha384-`). Used by the validation rejection tests.
 */
export function fixtureV3WithBadIntegrity(): V3Document {
  return {
    ...fixtureV3FullyPopulated(),
    core: {
      url: FIXTURE_CORE_ASSET.url,
      integrity: 'sha256-bogus000000',
      version: FIXTURE_CORE_ASSET.version,
    },
  };
}

/**
 * A v3 doc carrying the v2 layered substructure (canary rollout + tenant
 * override) AND v3-only fields populated — proves the two axes are
 * independent and validate cleanly together.
 */
export function fixtureV3WithCanaryAndTenant(): V3Document {
  const v2: V2Document = {
    schemaVersion: 2,
    generatedAt: FIXTURE_GENERATED_AT,
    default: {
      sharedDeps: { ...FIXTURE_SHARED_DEPS },
      mfes: {
        inspector: { ...FIXTURE_INSPECTOR_DEFAULT },
        dashboard: { ...FIXTURE_DASHBOARD_DEFAULT },
      },
    },
    rollouts: [
      {
        id: 'inspector-canary-5pct',
        match: { userBucketLt: 5 },
        override: {
          mfes: {
            inspector: {
              version: '3.5.0+canary000000',
              remoteEntry: 'https://cdn.example.com/mfe/inspector/canary/remoteEntry.js',
              scope: 'inspector',
              module: './public',
            },
          },
        },
      },
    ],
    tenantOverrides: {
      acme: {
        mfes: {
          inspector: {
            version: '3.5.0+acme0000000',
            remoteEntry: 'https://cdn.example.com/mfe/inspector/acme/remoteEntry.js',
            scope: 'inspector',
            module: './public',
          },
        },
      },
    },
  };
  return {
    schemaVersion: SCHEMA_VERSION_V3,
    generatedAt: v2.generatedAt,
    default: v2.default,
    rollouts: v2.rollouts,
    tenantOverrides: v2.tenantOverrides,
    core: { ...FIXTURE_CORE_ASSET },
    orchestrator: { ...FIXTURE_ORCHESTRATOR_ASSET },
    sharedDepsCss: { ...FIXTURE_SHARED_DEPS_CSS_ASSET },
    themes: {
      light: { ...FIXTURE_THEME_LIGHT_ASSET },
      dark: { ...FIXTURE_THEME_DARK_ASSET },
    },
  };
}
