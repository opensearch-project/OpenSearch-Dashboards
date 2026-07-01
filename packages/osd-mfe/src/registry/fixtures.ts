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
 * Shared test fixtures for the MFE registry (`schemaVersion: 1`).
 *
 * Centralising the fixtures here lets schema/resolver/reader/CLI tests drive
 * every scenario from the SAME canonical inputs — drift between schema tests
 * and resolver/reader tests is a recurring source of "tests pass, prod
 * breaks" regressions in registry-shaped systems. Every fixture builder
 * returns a FRESH object so callers can mutate the returned shape without
 * leaking state across tests.
 *
 * Scenarios captured here mirror the dual-path gate's seven cases:
 * default-only, canary in/out of bucket, tenant override, tenant over
 * rollout (tenant wins), multi-rollout first-wins.
 */

import {
  AssetDescriptor,
  MfeEntry,
  RegistryDocument,
  SCHEMA_VERSION,
} from './schema';

/** ISO-8601 timestamp used by every fixture for deterministic test output. */
export const FIXTURE_GENERATED_AT = '2026-06-19T00:00:00.000Z';

/** Default-layer `inspector` build — the baseline version. */
export const FIXTURE_INSPECTOR_DEFAULT: MfeEntry = {
  version: '3.5.0+default00000',
  remoteEntry: 'https://cdn.example.com/mfe/inspector/default/remoteEntry.js',
  scope: 'inspector',
  module: './public',
  integrity: 'sha384-default',
};

/** Canary-layer `inspector` build (rollout override target). */
export const FIXTURE_INSPECTOR_CANARY: MfeEntry = {
  version: '3.5.0+canary000000',
  remoteEntry: 'https://cdn.example.com/mfe/inspector/canary/remoteEntry.js',
  scope: 'inspector',
  module: './public',
  integrity: 'sha384-canary',
};

/** Tenant-layer `inspector` build (acme override target). */
export const FIXTURE_INSPECTOR_ACME: MfeEntry = {
  version: '3.5.0+acme0000000',
  remoteEntry: 'https://cdn.example.com/mfe/inspector/acme/remoteEntry.js',
  scope: 'inspector',
  module: './public',
  integrity: 'sha384-acme',
};

/** A second plugin (`dashboard`) — used to ensure resolution is per-id, not whole-doc. */
export const FIXTURE_DASHBOARD_DEFAULT: MfeEntry = {
  version: '3.5.0+dash00000000',
  remoteEntry: 'https://cdn.example.com/mfe/dashboard/default/remoteEntry.js',
  scope: 'dashboard',
  module: './public',
};

export const FIXTURE_SHARED_DEPS = {
  url: 'https://cdn.example.com/shared-deps/',
  version: '3.5.0',
};

/* ------------------------------------------------------------------------- *
 * Global-asset descriptor fixtures
 * ------------------------------------------------------------------------- */

/** Canonical core.entry.js asset (CDN-hosted, SRI-pinned). */
export const FIXTURE_CORE_ASSET: AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/core/abc123/core.entry.js',
  integrity: 'sha384-coreabc123def456',
  version: '3.5.0+core00000000',
};

/** Canonical orchestrator (osd_bootstrap_mfe.js) asset. */
export const FIXTURE_ORCHESTRATOR_ASSET: AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/orchestrator/def456/osd_bootstrap_mfe.js',
  integrity: 'sha384-orcdef456ghi789',
  version: '3.5.0+orc00000000',
};

/** Canonical sharedDepsCss asset (osd-ui-shared-deps.css). */
export const FIXTURE_SHARED_DEPS_CSS_ASSET: AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/shared-deps/css/ghi789/osd-ui-shared-deps.css',
  integrity: 'sha384-sdcghi789jkl012',
  version: '3.5.0+sdc00000000',
};

/** Canonical light theme CSS asset. */
export const FIXTURE_THEME_LIGHT_ASSET: AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/themes/light/jkl012/legacy_light_theme.css',
  integrity: 'sha384-thljkl012mno345',
  version: '3.5.0+thl00000000',
};

/** Canonical dark theme CSS asset. */
export const FIXTURE_THEME_DARK_ASSET: AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/themes/dark/mno345/legacy_dark_theme.css',
  integrity: 'sha384-thdmno345pqr678',
  version: '3.5.0+thd00000000',
};

/* ------------------------------------------------------------------------- *
 * RegistryDocument builders (layered substructure + optional global assets)
 * ------------------------------------------------------------------------- */

/**
 * Minimal valid registry: default-only — no rollouts, no tenant overrides,
 * no global asset fields. Consumers fall back to the server-bundled
 * `/bundles/...` path for every global asset.
 */
export function fixtureRegistryDefaultOnly(): RegistryDocument {
  return {
    schemaVersion: SCHEMA_VERSION as 1,
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
  };
}

/**
 * Registry with one rollout (canary) — `inspector` flips to `_CANARY` for
 * buckets `[0, 5)`. Buckets `[5, 100)` fall through to the default layer.
 */
export function fixtureRegistryWithCanary(): RegistryDocument {
  return {
    ...fixtureRegistryDefaultOnly(),
    rollouts: [
      {
        id: 'inspector-canary-5pct',
        match: { userBucketLt: 5 },
        override: { mfes: { inspector: { ...FIXTURE_INSPECTOR_CANARY } } },
      },
    ],
  };
}

/**
 * Registry with a tenant override — `acme` always gets `_ACME` for
 * `inspector`, regardless of bucket. Other tenants fall through to default.
 */
export function fixtureRegistryWithTenantOverride(): RegistryDocument {
  return {
    ...fixtureRegistryDefaultOnly(),
    tenantOverrides: {
      acme: {
        mfes: { inspector: { ...FIXTURE_INSPECTOR_ACME } },
      },
    },
  };
}

/**
 * Registry with BOTH a canary rollout AND a tenant override — used to
 * verify precedence (`tenantOverrides` > `rollouts` > `default`). For `acme`
 * + `userBucket < 5` BOTH layers match `inspector`; the tenant must win.
 */
export function fixtureRegistryWithCanaryAndTenant(): RegistryDocument {
  return {
    ...fixtureRegistryDefaultOnly(),
    rollouts: [
      {
        id: 'inspector-canary-5pct',
        match: { userBucketLt: 5 },
        override: { mfes: { inspector: { ...FIXTURE_INSPECTOR_CANARY } } },
      },
    ],
    tenantOverrides: {
      acme: {
        mfes: { inspector: { ...FIXTURE_INSPECTOR_ACME } },
      },
    },
  };
}

/**
 * Registry with ALL FOUR global asset fields populated. This is the
 * "production-shaped" fixture — every consumer site should be able to
 * resolve every asset from the registry instead of falling back.
 */
export function fixtureRegistryFullyPopulated(): RegistryDocument {
  return {
    ...fixtureRegistryDefaultOnly(),
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
 * Registry with PARTIAL global asset fields: `core` and `orchestrator` set,
 * `sharedDepsCss` and `themes` absent. Models a registry being incrementally
 * populated during a CDN cut-over.
 */
export function fixtureRegistryPartiallyPopulated(): RegistryDocument {
  return {
    ...fixtureRegistryDefaultOnly(),
    core: { ...FIXTURE_CORE_ASSET },
    orchestrator: { ...FIXTURE_ORCHESTRATOR_ASSET },
  };
}

/**
 * Registry with a deliberate malformed integrity on `core` (`sha256-...` is
 * not allowed — the schema enforces `sha384-`). Used by validation rejection
 * tests.
 */
export function fixtureRegistryWithBadIntegrity(): RegistryDocument {
  return {
    ...fixtureRegistryFullyPopulated(),
    core: {
      url: FIXTURE_CORE_ASSET.url,
      integrity: 'sha256-bogus000000',
      version: FIXTURE_CORE_ASSET.version,
    },
  };
}

/**
 * Registry carrying the layered substructure (canary rollout + tenant
 * override) AND all four global asset fields populated — proves the two
 * axes are independent and validate cleanly together.
 */
export function fixtureRegistryWithCanaryAndTenantAndGlobals(): RegistryDocument {
  return {
    ...fixtureRegistryWithCanaryAndTenant(),
    core: { ...FIXTURE_CORE_ASSET },
    orchestrator: { ...FIXTURE_ORCHESTRATOR_ASSET },
    sharedDepsCss: { ...FIXTURE_SHARED_DEPS_CSS_ASSET },
    themes: {
      light: { ...FIXTURE_THEME_LIGHT_ASSET },
      dark: { ...FIXTURE_THEME_DARK_ASSET },
    },
  };
}
