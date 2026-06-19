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
 * Shared test fixtures for the v2 registry shape (Phase 13, Story 1).
 *
 * Centralising the fixtures here lets stories 2 (resolver), 3 (reader +
 * server-inject), 4 (authoring CLI) and 5 (verify_phase13) drive every test
 * from the SAME canonical inputs — drift between the schema tests and the
 * resolver/reader tests is a recurring source of "tests pass, prod breaks"
 * regressions in registry-shaped systems. Fixture builders return fresh
 * objects so callers can mutate them without leaking state across tests.
 *
 * Naming convention: each fixture builder returns one specific scenario. The
 * scenarios mirror the seven cases verify_phase13.js exercises in real
 * Chromium: default-only, canary in/out of bucket, tenant override, tenant
 * over rollout (tenant wins), multi-rollout first-wins, and a v1 doc to be
 * auto-migrated on read.
 */

import { MfeEntry, Registry as V1Registry, SCHEMA_VERSION } from './schema';
import { SCHEMA_VERSION_V2, V2Document } from './schema_v2';

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

/**
 * v1 sample (the canonical CDN shape). The reader auto-migrates this to a v2
 * doc with only `default` populated; the v1 schema validator MUST still accept
 * it unchanged.
 */
export function fixtureV1Doc(): V1Registry {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: FIXTURE_GENERATED_AT,
    sharedDeps: { ...FIXTURE_SHARED_DEPS },
    mfes: {
      inspector: { ...FIXTURE_INSPECTOR_DEFAULT },
      dashboard: { ...FIXTURE_DASHBOARD_DEFAULT },
    },
  };
}

/** v2 default-only — no rollouts, no tenant overrides. */
export function fixtureV2DefaultOnly(): V2Document {
  return {
    schemaVersion: SCHEMA_VERSION_V2,
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
 * v2 with one rollout (canary) — `inspector` flips to `_CANARY` for buckets
 * `[0, 5)`. Buckets `[5, 100)` fall through to the default layer.
 */
export function fixtureV2WithCanary(): V2Document {
  return {
    schemaVersion: SCHEMA_VERSION_V2,
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
        override: { mfes: { inspector: { ...FIXTURE_INSPECTOR_CANARY } } },
      },
    ],
    tenantOverrides: {},
  };
}

/**
 * v2 with a tenant override — `acme` always gets `_ACME` for `inspector`,
 * regardless of bucket. Other tenants fall through to default.
 */
export function fixtureV2WithTenantOverride(): V2Document {
  return {
    schemaVersion: SCHEMA_VERSION_V2,
    generatedAt: FIXTURE_GENERATED_AT,
    default: {
      sharedDeps: { ...FIXTURE_SHARED_DEPS },
      mfes: {
        inspector: { ...FIXTURE_INSPECTOR_DEFAULT },
        dashboard: { ...FIXTURE_DASHBOARD_DEFAULT },
      },
    },
    rollouts: [],
    tenantOverrides: {
      acme: {
        mfes: { inspector: { ...FIXTURE_INSPECTOR_ACME } },
      },
    },
  };
}

/**
 * v2 with BOTH a canary rollout AND a tenant override — used to verify
 * precedence (`tenantOverrides` > `rollouts` > `default`). For `acme` +
 * `userBucket < 5` BOTH layers match `inspector`; the tenant must win.
 */
export function fixtureV2WithCanaryAndTenant(): V2Document {
  return {
    schemaVersion: SCHEMA_VERSION_V2,
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
