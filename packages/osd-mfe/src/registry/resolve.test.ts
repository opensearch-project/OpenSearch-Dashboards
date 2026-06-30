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

import { matchesRollout, resolveBootManifest, resolveDecisions } from './resolve';
import {
  AssetDescriptor,
  RegistryDocument,
  SCHEMA_VERSION,
} from './schema';
import {
  FIXTURE_GENERATED_AT,
  FIXTURE_INSPECTOR_DEFAULT,
  FIXTURE_INSPECTOR_CANARY,
  FIXTURE_INSPECTOR_ACME,
  FIXTURE_DASHBOARD_DEFAULT,
  FIXTURE_SHARED_DEPS,
} from './fixtures';

/* ------------------------------------------------------------------------- *
 * Local schemaVersion: 1 fixture builders.
 *
 * The shared fixtures in `./fixtures.ts` cover the canonical scenarios; the
 * resolver tests build a number of bespoke shapes (per-id rollouts with
 * specific match keys, multi-rollout precedence) that live inline here to
 * keep each test self-contained.
 * ------------------------------------------------------------------------- */

function fixtureDefaultOnly(): RegistryDocument {
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

function fixtureWithCanary(): RegistryDocument {
  return {
    ...fixtureDefaultOnly(),
    rollouts: [
      {
        id: 'inspector-canary-5pct',
        match: { userBucketLt: 5 },
        override: { mfes: { inspector: { ...FIXTURE_INSPECTOR_CANARY } } },
      },
    ],
  };
}

function fixtureWithTenantOverride(): RegistryDocument {
  return {
    ...fixtureDefaultOnly(),
    tenantOverrides: {
      acme: {
        mfes: { inspector: { ...FIXTURE_INSPECTOR_ACME } },
      },
    },
  };
}

function fixtureWithCanaryAndTenant(): RegistryDocument {
  return {
    ...fixtureWithCanary(),
    tenantOverrides: {
      acme: {
        mfes: { inspector: { ...FIXTURE_INSPECTOR_ACME } },
      },
    },
  };
}

const FIXTURE_CORE_ASSET: AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/core/abc123/core.entry.js',
  integrity: 'sha384-coreabc123def456',
  version: '3.5.0+core00000000',
};

const FIXTURE_ORCHESTRATOR_ASSET: AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/orchestrator/def456/osd_bootstrap_mfe.js',
  integrity: 'sha384-orcdef456ghi789',
  version: '3.5.0+orc00000000',
};

const FIXTURE_SHARED_DEPS_CSS_ASSET: AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/shared-deps/css/ghi789/osd-ui-shared-deps.css',
  integrity: 'sha384-sdcghi789jkl012',
  version: '3.5.0+sdc00000000',
};

const FIXTURE_THEME_LIGHT_ASSET: AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/themes/light/jkl012/legacy_light_theme.css',
  integrity: 'sha384-thljkl012mno345',
  version: '3.5.0+thl00000000',
};

const FIXTURE_THEME_DARK_ASSET: AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/themes/dark/mno345/legacy_dark_theme.css',
  integrity: 'sha384-thdmno345pqr678',
  version: '3.5.0+thd00000000',
};

function fixtureFullyPopulated(): RegistryDocument {
  return {
    ...fixtureDefaultOnly(),
    core: { ...FIXTURE_CORE_ASSET },
    orchestrator: { ...FIXTURE_ORCHESTRATOR_ASSET },
    sharedDepsCss: { ...FIXTURE_SHARED_DEPS_CSS_ASSET },
    themes: {
      light: { ...FIXTURE_THEME_LIGHT_ASSET },
      dark: { ...FIXTURE_THEME_DARK_ASSET },
    },
  };
}

function fixturePartiallyPopulated(): RegistryDocument {
  return {
    ...fixtureDefaultOnly(),
    core: { ...FIXTURE_CORE_ASSET },
    orchestrator: { ...FIXTURE_ORCHESTRATOR_ASSET },
  };
}

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
 * resolveBootManifest — plugin substructure
 * ------------------------------------------------------------------------- */

describe('resolveBootManifest() — case 1: default-only', () => {
  it('returns default-layer entries for every plugin id', () => {
    const manifest = resolveBootManifest(fixtureDefaultOnly(), {
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
    const decisions = resolveDecisions(fixtureDefaultOnly(), {
      customerId: 'default',
      userBucket: 10,
    });
    expect(decisions.map((d) => d.source)).toEqual(['default', 'default']);
  });
});

describe('resolveBootManifest() — case 2: canary in-bucket', () => {
  it('inspector flips to canary entry when bucket < 5; dashboard falls through', () => {
    const manifest = resolveBootManifest(fixtureWithCanary(), {
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
    const decisions = resolveDecisions(fixtureWithCanary(), {
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
    const manifest = resolveBootManifest(fixtureWithCanary(), {
      customerId: 'default',
      userBucket: 10,
    });
    const inspector = manifest.mfes.find((m) => m.id === 'inspector');
    expect(inspector?.remoteEntry).toBe(FIXTURE_INSPECTOR_DEFAULT.remoteEntry);
    expect(inspector?.version).toBe(FIXTURE_INSPECTOR_DEFAULT.version);
  });

  it('inspector decision reports source=default', () => {
    const decisions = resolveDecisions(fixtureWithCanary(), {
      customerId: 'default',
      userBucket: 10,
    });
    const inspector = decisions.find((d) => d.id === 'inspector');
    expect(inspector?.source).toBe('default');
  });

  it('boundary: bucket=5 is OUTSIDE userBucketLt:5 (half-open)', () => {
    const manifest = resolveBootManifest(fixtureWithCanary(), {
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
    const doc = fixtureWithTenantOverride();
    for (const bucket of [0, 25, 50, 75, 99]) {
      const manifest = resolveBootManifest(doc, { customerId: 'acme', userBucket: bucket });
      expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
        FIXTURE_INSPECTOR_ACME.remoteEntry
      );
    }
  });

  it('non-acme falls through to default', () => {
    const doc = fixtureWithTenantOverride();
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 25 });
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_DEFAULT.remoteEntry
    );
  });

  it('inspector decision reports source=tenant for acme', () => {
    const decisions = resolveDecisions(fixtureWithTenantOverride(), {
      customerId: 'acme',
      userBucket: 25,
    });
    expect(decisions.find((d) => d.id === 'inspector')?.source).toBe('tenant');
  });
});

describe('resolveBootManifest() — case 5: tenant + matching rollout (tenant wins)', () => {
  it('acme + bucket=2 picks tenant entry, NOT canary', () => {
    const manifest = resolveBootManifest(fixtureWithCanaryAndTenant(), {
      customerId: 'acme',
      userBucket: 2,
    });
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_ACME.remoteEntry
    );
  });

  it('acme + bucket=2 decision reports source=tenant (not rollout)', () => {
    const decisions = resolveDecisions(fixtureWithCanaryAndTenant(), {
      customerId: 'acme',
      userBucket: 2,
    });
    expect(decisions.find((d) => d.id === 'inspector')?.source).toBe('tenant');
  });

  it('non-acme + bucket=2 still picks the canary rollout (sanity)', () => {
    const manifest = resolveBootManifest(fixtureWithCanaryAndTenant(), {
      customerId: 'default',
      userBucket: 2,
    });
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_CANARY.remoteEntry
    );
  });

  it('non-acme + bucket=10 falls through to default (sanity)', () => {
    const manifest = resolveBootManifest(fixtureWithCanaryAndTenant(), {
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
    const doc = fixtureDefaultOnly();
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
    const doc = fixtureDefaultOnly();
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
    const doc = fixtureWithCanary(); // rollout matches userBucketLt:5
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 99 });
    const decisions = resolveDecisions(doc, { customerId: 'default', userBucket: 99 });
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.version).toBe(
      FIXTURE_INSPECTOR_DEFAULT.version
    );
    expect(decisions.find((d) => d.id === 'inspector')?.source).toBe('default');
  });
});

/* ------------------------------------------------------------------------- *
 * resolveBootManifest — global asset projection (Story 3 of schema-collapse)
 * ------------------------------------------------------------------------- */

describe('resolveBootManifest() — global asset projection', () => {
  it('projects all four global asset roots from a fully-populated doc', () => {
    const manifest = resolveBootManifest(fixtureFullyPopulated(), {
      customerId: 'default',
      userBucket: 50,
    });
    expect(manifest.core).toEqual(FIXTURE_CORE_ASSET);
    expect(manifest.orchestrator).toEqual(FIXTURE_ORCHESTRATOR_ASSET);
    expect(manifest.sharedDepsCss).toEqual(FIXTURE_SHARED_DEPS_CSS_ASSET);
    expect(manifest.themes).toEqual({
      light: FIXTURE_THEME_LIGHT_ASSET,
      dark: FIXTURE_THEME_DARK_ASSET,
    });
  });

  it('omits absent global asset fields entirely (consumer fallback signal)', () => {
    const manifest = resolveBootManifest(fixtureDefaultOnly(), {
      customerId: 'default',
      userBucket: 0,
    });
    expect(manifest).not.toHaveProperty('core');
    expect(manifest).not.toHaveProperty('orchestrator');
    expect(manifest).not.toHaveProperty('sharedDepsCss');
    expect(manifest).not.toHaveProperty('themes');
  });

  it('projects partial global asset coverage (some present, some absent)', () => {
    const manifest = resolveBootManifest(fixturePartiallyPopulated(), {
      customerId: 'default',
      userBucket: 0,
    });
    expect(manifest.core).toEqual(FIXTURE_CORE_ASSET);
    expect(manifest.orchestrator).toEqual(FIXTURE_ORCHESTRATOR_ASSET);
    expect(manifest).not.toHaveProperty('sharedDepsCss');
    expect(manifest).not.toHaveProperty('themes');
  });

  it('returns fresh asset descriptors (manifest does NOT alias the source doc)', () => {
    const doc = fixtureFullyPopulated();
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    expect(manifest.core).not.toBe(doc.core);
    expect(manifest.orchestrator).not.toBe(doc.orchestrator);
    expect(manifest.sharedDepsCss).not.toBe(doc.sharedDepsCss);
    expect(manifest.themes).not.toBe(doc.themes);
    if (manifest.themes && doc.themes) {
      expect(manifest.themes.light).not.toBe(doc.themes.light);
    }
  });

  it('handles a theme map with no entries (empty object passes through)', () => {
    const doc: RegistryDocument = { ...fixtureDefaultOnly(), themes: {} };
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    expect(manifest.themes).toEqual({});
  });

  it('drops integrity when the source asset descriptor has none', () => {
    const doc: RegistryDocument = {
      ...fixtureDefaultOnly(),
      core: { url: 'https://example.com/core.js', version: '1.0.0' },
    };
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    expect(manifest.core).toEqual({ url: 'https://example.com/core.js', version: '1.0.0' });
    expect(manifest.core).not.toHaveProperty('integrity');
  });

  it('global asset projection is independent of plugin layered substructure', () => {
    // Canary rollout AND global assets coexist; both project onto the manifest.
    const doc: RegistryDocument = {
      ...fixtureWithCanary(),
      core: { ...FIXTURE_CORE_ASSET },
    };
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 2 });
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.version).toBe(
      FIXTURE_INSPECTOR_CANARY.version
    );
    expect(manifest.core).toEqual(FIXTURE_CORE_ASSET);
  });
});

/* ------------------------------------------------------------------------- *
 * Pure-ness, sharedDeps pinning, defensive paths
 * ------------------------------------------------------------------------- */

describe('resolveBootManifest() — purity + invariants', () => {
  it('does not mutate the input doc', () => {
    const doc = fixtureWithCanaryAndTenant();
    const before = JSON.stringify(doc);
    resolveBootManifest(doc, { customerId: 'acme', userBucket: 2 });
    expect(JSON.stringify(doc)).toBe(before);
  });

  it('does not mutate the input doc (with global assets present)', () => {
    const doc = fixtureFullyPopulated();
    const before = JSON.stringify(doc);
    resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    expect(JSON.stringify(doc)).toBe(before);
  });

  it('returns a fresh sharedDeps object (not aliased to the input)', () => {
    const doc = fixtureDefaultOnly();
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    expect(manifest.sharedDeps).not.toBe(doc.default.sharedDeps);
    expect(manifest.sharedDeps).toEqual(doc.default.sharedDeps);
  });

  it('sharedDeps is ALWAYS taken from default (no per-layer override of singletons)', () => {
    const doc = fixtureWithCanaryAndTenant();
    const manifest = resolveBootManifest(doc, { customerId: 'acme', userBucket: 2 });
    expect(manifest.sharedDeps).toEqual(doc.default.sharedDeps);
  });

  it('drops a malformed override entry rather than failing the whole resolve', () => {
    // Authoring CLI should reject this at write time, but the resolver is
    // best-effort defense in depth (validator is the authority).
    const doc = fixtureWithCanary();
    (doc.rollouts[0].override.mfes.inspector as { remoteEntry: string }).remoteEntry = '';
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 2 });
    // Inspector falls through to default since the rollout's malformed entry
    // is dropped, not promoted.
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_DEFAULT.remoteEntry
    );
  });

  it('emits ids in deterministic order (defaults first, then layered-only)', () => {
    const doc = fixtureDefaultOnly();
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
    const doc = fixtureDefaultOnly();
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
    const doc = fixtureDefaultOnly();
    delete doc.default.mfes.dashboard.integrity;
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    const dashboard = manifest.mfes.find((m) => m.id === 'dashboard');
    expect(dashboard).toBeDefined();
    expect(dashboard).not.toHaveProperty('integrity');
  });

  it('treats integrity=null as absent (drop from manifest)', () => {
    const doc = fixtureDefaultOnly();
    (doc.default.mfes.inspector as { integrity: unknown }).integrity = null;
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    const inspector = manifest.mfes.find((m) => m.id === 'inspector');
    expect(inspector).not.toHaveProperty('integrity');
  });

  it('treats integrity="" as absent (drop from manifest)', () => {
    const doc = fixtureDefaultOnly();
    doc.default.mfes.inspector.integrity = '';
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    const inspector = manifest.mfes.find((m) => m.id === 'inspector');
    expect(inspector).not.toHaveProperty('integrity');
  });

  it('tenant layer present but does NOT carry the id falls through normally', () => {
    // acme tenant is configured but only overrides "inspector"; "dashboard"
    // must fall through to the default entry (not be dropped).
    const doc = fixtureWithTenantOverride();
    const manifest = resolveBootManifest(doc, { customerId: 'acme', userBucket: 0 });
    const dashboard = manifest.mfes.find((m) => m.id === 'dashboard');
    expect(dashboard?.remoteEntry).toBe(FIXTURE_DASHBOARD_DEFAULT.remoteEntry);
    const decisions = resolveDecisions(doc, { customerId: 'acme', userBucket: 0 });
    expect(decisions.find((d) => d.id === 'dashboard')?.source).toBe('default');
  });

  it('drops a malformed default entry (defensive — validator is the authority)', () => {
    const doc = fixtureDefaultOnly();
    (doc.default.mfes.dashboard as { scope: unknown }).scope = '';
    const manifest = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
    expect(manifest.mfes.find((m) => m.id === 'dashboard')).toBeUndefined();
    expect(manifest.mfes.find((m) => m.id === 'inspector')).toBeDefined();
  });

  it('drops a malformed tenant-override entry, falling back to default', () => {
    const doc = fixtureWithTenantOverride();
    (doc.tenantOverrides.acme.mfes.inspector as { module: unknown }).module = '';
    const manifest = resolveBootManifest(doc, { customerId: 'acme', userBucket: 0 });
    // Tenant entry is malformed -> drop -> default applies for acme.
    expect(manifest.mfes.find((m) => m.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_DEFAULT.remoteEntry
    );
  });

  it('tenant layer can introduce a NEW id (not in default) and it appears last in manifest order', () => {
    const doc = fixtureDefaultOnly();
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
