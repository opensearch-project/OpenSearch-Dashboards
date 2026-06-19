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

import { coerceToV2Document } from './schema_v2';
import {
  matchesRollout,
  resolveBootManifest,
  resolveDecisions,
} from './resolve_v2';
import {
  fixtureV1Doc,
  fixtureV2DefaultOnly,
  fixtureV2WithCanary,
  fixtureV2WithTenantOverride,
  fixtureV2WithCanaryAndTenant,
  FIXTURE_INSPECTOR_DEFAULT,
  FIXTURE_INSPECTOR_CANARY,
  FIXTURE_INSPECTOR_ACME,
  FIXTURE_DASHBOARD_DEFAULT,
  FIXTURE_SHARED_DEPS,
} from './fixtures_v2';

/* ------------------------------------------------------------------------- *
 * matchesRollout — predicate branches
 * ------------------------------------------------------------------------- */

describe('matchesRollout()', () => {
  const dims = (overrides: Partial<{ customerId: string; userBucket: number }> = {}) => ({
    customerId: 'default',
    userBucket: 50,
    ...overrides,
  });

  it('empty match {} matches every dimension (vacuous truth)', () => {
    expect(matchesRollout({}, dims())).toBe(true);
    expect(matchesRollout({}, dims({ customerId: 'acme', userBucket: 0 }))).toBe(true);
  });

  it('userBucketLt: bucket strictly less than threshold', () => {
    expect(matchesRollout({ userBucketLt: 5 }, dims({ userBucket: 4 }))).toBe(true);
    expect(matchesRollout({ userBucketLt: 5 }, dims({ userBucket: 5 }))).toBe(false);
    expect(matchesRollout({ userBucketLt: 5 }, dims({ userBucket: 99 }))).toBe(false);
  });

  it('userBucketGte: bucket greater-or-equal threshold', () => {
    expect(matchesRollout({ userBucketGte: 5 }, dims({ userBucket: 5 }))).toBe(true);
    expect(matchesRollout({ userBucketGte: 5 }, dims({ userBucket: 4 }))).toBe(false);
    expect(matchesRollout({ userBucketGte: 5 }, dims({ userBucket: 99 }))).toBe(true);
  });

  it('userBucketGte + userBucketLt forms a half-open tile', () => {
    const m = { userBucketGte: 5, userBucketLt: 10 };
    expect(matchesRollout(m, dims({ userBucket: 4 }))).toBe(false);
    expect(matchesRollout(m, dims({ userBucket: 5 }))).toBe(true);
    expect(matchesRollout(m, dims({ userBucket: 9 }))).toBe(true);
    expect(matchesRollout(m, dims({ userBucket: 10 }))).toBe(false);
  });

  it('tenantId: exact-match against customerId', () => {
    expect(matchesRollout({ tenantId: 'acme' }, dims({ customerId: 'acme' }))).toBe(true);
    expect(matchesRollout({ tenantId: 'acme' }, dims({ customerId: 'default' }))).toBe(false);
    expect(matchesRollout({ tenantId: 'Acme' }, dims({ customerId: 'acme' }))).toBe(false);
  });

  it('combined predicates AND together', () => {
    const m = { userBucketLt: 50, tenantId: 'acme' };
    expect(matchesRollout(m, dims({ customerId: 'acme', userBucket: 25 }))).toBe(true);
    expect(matchesRollout(m, dims({ customerId: 'acme', userBucket: 60 }))).toBe(false);
    expect(matchesRollout(m, dims({ customerId: 'default', userBucket: 25 }))).toBe(false);
  });
});

/* ------------------------------------------------------------------------- *
 * resolveBootManifest — the 7 documented cases (PRD story 2)
 * ------------------------------------------------------------------------- */

describe('resolveBootManifest() — case 1: default-only', () => {
  it('returns default-layer entries for every plugin id', () => {
    const manifest = resolveBootManifest(fixtureV2DefaultOnly(), {
      customerId: 'default',
      userBucket: 10,
    });
    expect(manifest.sharedDeps).toEqual(FIXTURE_SHARED_DEPS);
    expect(manifest.mfes).toEqual([
      {
        id: 'inspector',
        remoteEntry: FIXTURE_INSPECTOR_DEFAULT.remoteEntry,
        scope: FIXTURE_INSPECTOR_DEFAULT.scope,
        module: FIXTURE_INSPECTOR_DEFAULT.module,
        version: FIXTURE_INSPECTOR_DEFAULT.version,
        integrity: FIXTURE_INSPECTOR_DEFAULT.integrity,
      },
      {
        id: 'dashboard',
        remoteEntry: FIXTURE_DASHBOARD_DEFAULT.remoteEntry,
        scope: FIXTURE_DASHBOARD_DEFAULT.scope,
        module: FIXTURE_DASHBOARD_DEFAULT.module,
        version: FIXTURE_DASHBOARD_DEFAULT.version,
      },
    ]);
  });

  it('every id reports source=default in its decision', () => {
    const decisions = resolveDecisions(fixtureV2DefaultOnly(), {
      customerId: 'default',
      userBucket: 10,
    });
    expect(decisions.map((d) => d.source)).toEqual(['default', 'default']);
  });
});

describe('resolveBootManifest() — case 2: canary in-bucket', () => {
  it('inspector flips to canary entry when bucket < 5; dashboard falls through', () => {
    const manifest = resolveBootManifest(fixtureV2WithCanary(), {
      customerId: 'default',
      userBucket: 2,
    });
    const inspector = manifest.mfes.find((m) => m.id === 'inspector');
    const dashboard = manifest.mfes.find((m) => m.id === 'dashboard');
    expect(inspector?.remoteEntry).toBe(FIXTURE_INSPECTOR_CANARY.remoteEntry);
    expect(inspector?.version).toBe(FIXTURE_INSPECTOR_CANARY.version);
    expect(inspector?.integrity).toBe(FIXTURE_INSPECTOR_CANARY.integrity);
    expect(dashboard?.remoteEntry).toBe(FIXTURE_DASHBOARD_DEFAULT.remoteEntry);
  });

  it('inspector decision reports source=rollout with the rule id', () => {
    const decisions = resolveDecisions(fixtureV2WithCanary(), {
      customerId: 'default',
      userBucket: 2,
    });
    const inspector = decisions.find((d) => d.id === 'inspector');
    expect(inspector?.source).toBe('rollout');
    expect(inspector?.rolloutId).toBe('inspector-canary-5pct');
  });
});

describe('resolveBootManifest() — case 3: canary out-of-bucket', () => {
  it('inspector falls through to default when bucket >= 5', () => {
    const manifest = resolveBootManifest(fixtureV2WithCanary(), {
      customerId: 'default',
      userBucket: 10,
    });
    const inspector = manifest.mfes.find((m) => m.id === 'inspector');
    expect(inspector?.remoteEntry).toBe(FIXTURE_INSPECTOR_DEFAULT.remoteEntry);
    expect(inspector?.version).toBe(FIXTURE_INSPECTOR_DEFAULT.version);
  });

  it('inspector decision reports source=default', () => {
    const decisions = resolveDecisions(fixtureV2WithCanary(), {
      customerId: 'default',
      userBucket: 10,
    });
    const inspector = decisions.find((d) => d.id === 'inspector');
    expect(inspector?.source).toBe('default');
  });

  it('boundary: bucket=5 is OUTSIDE userBucketLt:5 (half-open)', () => {
    const manifest = resolveBootManifest(fixtureV2WithCanary(), {
      customerId: 'default',
      userBucket: 5,
    });
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.version).toBe(
      FIXTURE_INSPECTOR_DEFAULT.version
    );
  });
});

describe('resolveBootManifest() — case 4: tenant override', () => {
  it('acme always gets the tenant entry regardless of bucket', () => {
    const doc = fixtureV2WithTenantOverride();
    for (const bucket of [0, 25, 50, 75, 99]) {
      const manifest = resolveBootManifest(doc, { customerId: 'acme', userBucket: bucket });
      expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
        FIXTURE_INSPECTOR_ACME.remoteEntry
      );
    }
  });

  it('non-acme falls through to default', () => {
    const doc = fixtureV2WithTenantOverride();
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 25 });
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_DEFAULT.remoteEntry
    );
  });

  it('inspector decision reports source=tenant for acme', () => {
    const decisions = resolveDecisions(fixtureV2WithTenantOverride(), {
      customerId: 'acme',
      userBucket: 25,
    });
    expect(decisions.find((d) => d.id === 'inspector')?.source).toBe('tenant');
  });
});

describe('resolveBootManifest() — case 5: tenant + matching rollout (tenant wins)', () => {
  it('acme + bucket=2 picks tenant entry, NOT canary', () => {
    const manifest = resolveBootManifest(fixtureV2WithCanaryAndTenant(), {
      customerId: 'acme',
      userBucket: 2,
    });
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_ACME.remoteEntry
    );
  });

  it('acme + bucket=2 decision reports source=tenant (not rollout)', () => {
    const decisions = resolveDecisions(fixtureV2WithCanaryAndTenant(), {
      customerId: 'acme',
      userBucket: 2,
    });
    expect(decisions.find((d) => d.id === 'inspector')?.source).toBe('tenant');
  });

  it('non-acme + bucket=2 still picks the canary rollout (sanity)', () => {
    const manifest = resolveBootManifest(fixtureV2WithCanaryAndTenant(), {
      customerId: 'default',
      userBucket: 2,
    });
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_CANARY.remoteEntry
    );
  });

  it('non-acme + bucket=10 falls through to default (sanity)', () => {
    const manifest = resolveBootManifest(fixtureV2WithCanaryAndTenant(), {
      customerId: 'default',
      userBucket: 10,
    });
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_DEFAULT.remoteEntry
    );
  });
});

describe('resolveBootManifest() — case 6: multi-rollout, first-match wins', () => {
  it('declared order wins per id when two rollouts both match', () => {
    const doc = fixtureV2DefaultOnly();
    doc.rollouts = [
      {
        id: 'inspector-canary-A',
        match: { userBucketLt: 50 },
        override: {
          mfes: {
            inspector: {
              ...FIXTURE_INSPECTOR_CANARY,
              version: 'A',
              remoteEntry: 'https://cdn.example.com/A/remoteEntry.js',
            },
          },
        },
      },
      {
        id: 'inspector-canary-B',
        match: { userBucketLt: 50 },
        override: {
          mfes: {
            inspector: {
              ...FIXTURE_INSPECTOR_CANARY,
              version: 'B',
              remoteEntry: 'https://cdn.example.com/B/remoteEntry.js',
            },
          },
        },
      },
    ];
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 25 });
    const inspector = manifest.mfes.find((m) => m.id === 'inspector');
    expect(inspector?.version).toBe('A');
    expect(inspector?.remoteEntry).toBe('https://cdn.example.com/A/remoteEntry.js');
  });

  it('FIRST rollout that contains the id wins, even if a LATER rollout also matches', () => {
    // Rollout A matches but does NOT carry inspector; rollout B matches and DOES.
    // A is "skipped" for inspector; B supplies it. (For dashboard, A wins.)
    const doc = fixtureV2DefaultOnly();
    doc.rollouts = [
      {
        id: 'dashboard-only',
        match: {}, // matches everyone
        override: {
          mfes: {
            dashboard: {
              ...FIXTURE_DASHBOARD_DEFAULT,
              version: 'A-dash',
              remoteEntry: 'https://cdn.example.com/A-dash/remoteEntry.js',
            },
          },
        },
      },
      {
        id: 'inspector-only',
        match: {}, // matches everyone
        override: {
          mfes: {
            inspector: {
              ...FIXTURE_INSPECTOR_CANARY,
              version: 'B-insp',
              remoteEntry: 'https://cdn.example.com/B-insp/remoteEntry.js',
            },
          },
        },
      },
    ];
    const decisions = resolveDecisions(doc, { customerId: 'default', userBucket: 25 });
    const dash = decisions.find((d) => d.id === 'dashboard');
    const insp = decisions.find((d) => d.id === 'inspector');
    expect(dash?.entry.version).toBe('A-dash');
    expect(dash?.rolloutId).toBe('dashboard-only');
    expect(insp?.entry.version).toBe('B-insp');
    expect(insp?.rolloutId).toBe('inspector-only');
  });

  it('unmatched rollouts are skipped entirely (no fallback through them)', () => {
    const doc = fixtureV2WithCanary(); // rollout matches userBucketLt:5
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 99 });
    const decisions = resolveDecisions(doc, { customerId: 'default', userBucket: 99 });
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.version).toBe(
      FIXTURE_INSPECTOR_DEFAULT.version
    );
    expect(decisions.find((d) => d.id === 'inspector')?.source).toBe('default');
  });
});

describe('resolveBootManifest() — case 7: v1-migrated doc (only default applies)', () => {
  it('a v1 doc auto-migrated to v2 resolves identically to the default-only fixture', () => {
    const v2 = coerceToV2Document(fixtureV1Doc());
    const manifest = resolveBootManifest(v2, { customerId: 'default', userBucket: 50 });

    // Same shape as the default-only case 1.
    expect(manifest.sharedDeps).toEqual(FIXTURE_SHARED_DEPS);
    expect(manifest.mfes.length).toBe(2);
    const inspector = manifest.mfes.find((m) => m.id === 'inspector');
    expect(inspector?.remoteEntry).toBe(FIXTURE_INSPECTOR_DEFAULT.remoteEntry);
    expect(inspector?.version).toBe(FIXTURE_INSPECTOR_DEFAULT.version);
  });

  it('a v1-migrated doc carries no rollouts, so non-default dimensions yield default entries', () => {
    const v2 = coerceToV2Document(fixtureV1Doc());
    const manifest = resolveBootManifest(v2, { customerId: 'acme', userBucket: 2 });
    const inspector = manifest.mfes.find((m) => m.id === 'inspector');
    expect(inspector?.version).toBe(FIXTURE_INSPECTOR_DEFAULT.version);
  });
});

/* ------------------------------------------------------------------------- *
 * Pure-ness, sharedDeps pinning, defensive paths
 * ------------------------------------------------------------------------- */

describe('resolveBootManifest() — purity + invariants', () => {
  it('does not mutate the input doc', () => {
    const doc = fixtureV2WithCanaryAndTenant();
    const before = JSON.stringify(doc);
    resolveBootManifest(doc, { customerId: 'acme', userBucket: 2 });
    expect(JSON.stringify(doc)).toBe(before);
  });

  it('returns a fresh sharedDeps object (not aliased to the input)', () => {
    const doc = fixtureV2DefaultOnly();
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    expect(manifest.sharedDeps).not.toBe(doc.default.sharedDeps);
    expect(manifest.sharedDeps).toEqual(doc.default.sharedDeps);
  });

  it('sharedDeps is ALWAYS taken from default (no per-layer override of singletons)', () => {
    const doc = fixtureV2WithCanaryAndTenant();
    const manifest = resolveBootManifest(doc, { customerId: 'acme', userBucket: 2 });
    expect(manifest.sharedDeps).toEqual(doc.default.sharedDeps);
  });

  it('drops a malformed override entry rather than failing the whole resolve', () => {
    // Authoring CLI should reject this at write time, but the resolver is
    // best-effort defense in depth (validator is the authority).
    const doc = fixtureV2WithCanary();
    (doc.rollouts[0].override.mfes.inspector as { remoteEntry: string }).remoteEntry = '';
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 2 });
    // Inspector falls through to default since the rollout's malformed entry
    // is dropped, not promoted.
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_DEFAULT.remoteEntry
    );
  });

  it('emits ids in deterministic order (defaults first, then layered-only)', () => {
    const doc = fixtureV2DefaultOnly();
    // Default has [inspector, dashboard]. Add a rollout that also adds a NEW
    // id "newcomer" — it should appear AFTER the defaults, in declared order.
    doc.rollouts = [
      {
        id: 'add-newcomer',
        match: {},
        override: {
          mfes: {
            newcomer: {
              version: 'n1',
              remoteEntry: 'https://cdn.example.com/newcomer/remoteEntry.js',
              scope: 'newcomer',
              module: './public',
            },
          },
        },
      },
    ];
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    expect(manifest.mfes.map((m) => m.id)).toEqual(['inspector', 'dashboard', 'newcomer']);
  });

  it('passthrough fields: integrity + compat from the source layer survive into the manifest', () => {
    const doc = fixtureV2DefaultOnly();
    doc.default.mfes.inspector.compat = {
      minCoreVersion: '3.5.0',
      compatibleCoreRange: '3.5.x',
    };
    doc.default.mfes.inspector.integrity = 'sha384-aaa';
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    const inspector = manifest.mfes.find((m) => m.id === 'inspector');
    expect(inspector?.integrity).toBe('sha384-aaa');
    expect(inspector?.compat).toEqual({ minCoreVersion: '3.5.0', compatibleCoreRange: '3.5.x' });
  });

  it('a per-layer entry without integrity drops integrity from the manifest entry', () => {
    const doc = fixtureV2DefaultOnly();
    delete doc.default.mfes.dashboard.integrity;
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    const dashboard = manifest.mfes.find((m) => m.id === 'dashboard');
    expect(dashboard).toBeDefined();
    expect(dashboard).not.toHaveProperty('integrity');
  });

  it('treats integrity=null as absent (drop from manifest)', () => {
    const doc = fixtureV2DefaultOnly();
    (doc.default.mfes.inspector as { integrity: unknown }).integrity = null;
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    const inspector = manifest.mfes.find((m) => m.id === 'inspector');
    expect(inspector).not.toHaveProperty('integrity');
  });

  it('treats integrity="" as absent (drop from manifest)', () => {
    const doc = fixtureV2DefaultOnly();
    doc.default.mfes.inspector.integrity = '';
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    const inspector = manifest.mfes.find((m) => m.id === 'inspector');
    expect(inspector).not.toHaveProperty('integrity');
  });

  it('tenant layer present but does NOT carry the id falls through normally', () => {
    // acme tenant is configured but only overrides "inspector"; "dashboard"
    // must fall through to the default entry (not be dropped).
    const doc = fixtureV2WithTenantOverride();
    const manifest = resolveBootManifest(doc, { customerId: 'acme', userBucket: 0 });
    const dashboard = manifest.mfes.find((m) => m.id === 'dashboard');
    expect(dashboard?.remoteEntry).toBe(FIXTURE_DASHBOARD_DEFAULT.remoteEntry);
    const decisions = resolveDecisions(doc, { customerId: 'acme', userBucket: 0 });
    expect(decisions.find((d) => d.id === 'dashboard')?.source).toBe('default');
  });

  it('drops a malformed default entry (defensive — validator is the authority)', () => {
    const doc = fixtureV2DefaultOnly();
    (doc.default.mfes.dashboard as { scope: unknown }).scope = '';
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    expect(manifest.mfes.find((m) => m.id === 'dashboard')).toBeUndefined();
    expect(manifest.mfes.find((m) => m.id === 'inspector')).toBeDefined();
  });

  it('drops a malformed tenant-override entry, falling back to default', () => {
    const doc = fixtureV2WithTenantOverride();
    (doc.tenantOverrides.acme.mfes.inspector as { module: unknown }).module = '';
    const manifest = resolveBootManifest(doc, { customerId: 'acme', userBucket: 0 });
    // Tenant entry is malformed -> drop -> default applies for acme.
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_DEFAULT.remoteEntry
    );
  });

  it('tenant layer can introduce a NEW id (not in default) and it appears last in manifest order', () => {
    const doc = fixtureV2DefaultOnly();
    doc.tenantOverrides = {
      acme: {
        mfes: {
          'tenant-only': {
            version: 't1',
            remoteEntry: 'https://cdn.example.com/tenant-only/remoteEntry.js',
            scope: 'tenant-only',
            module: './public',
          },
        },
      },
    };
    const manifest = resolveBootManifest(doc, { customerId: 'acme', userBucket: 0 });
    // Defaults (inspector, dashboard) precede the tenant-only id.
    expect(manifest.mfes.map((m) => m.id)).toEqual(['inspector', 'dashboard', 'tenant-only']);
    const decisions = resolveDecisions(doc, { customerId: 'acme', userBucket: 0 });
    expect(decisions.find((d) => d.id === 'tenant-only')?.source).toBe('tenant');
  });
});
