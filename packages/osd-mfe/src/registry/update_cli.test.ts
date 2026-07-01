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

import Fs from 'fs';
import Os from 'os';
import Path from 'path';

import { MfeEntry } from './schema';
import {
  AssetDescriptor,
  RegistryDocument,
  SCHEMA_VERSION,
  assertValidRegistryDocument,
} from './schema';
import {
  AuditEntry,
  AuditLog,
  UpdateCliConsole,
  applyAddRollout,
  applyRemoveRollout,
  applyRemoveTenantOverride,
  applyRollback,
  applySetDefaultEntry,
  applyTenantOverride,
  buildRegistryFromManifest,
  checkDependencyGraph,
  mergeRegistryFromManifest,
  parseKeyValuePairs,
  resolveRegistryPath,
  runUpdateCli,
} from './update_cli';
import { AssetBuildManifest, AssetKind, ASSET_BUILD_MANIFEST_SCHEMA_VERSION } from './asset_build';

/* ------------------------------------------------------------------------- *
 * Fixtures
 * ------------------------------------------------------------------------- */

const FIXED_NOW = new Date('2026-06-19T12:00:00.000Z');
const FIXTURE_GENERATED_AT = '2026-06-01T00:00:00.000Z';

const FIXTURE_SHARED_DEPS = {
  url: 'http://localhost:8080/shared-deps/',
  version: '3.5.0',
};

const FIXTURE_INSPECTOR_DEFAULT: MfeEntry = {
  version: '3.5.0+inspectordefault',
  remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
  scope: 'osdMfe_inspector',
  module: './public',
};

const FIXTURE_INSPECTOR_CANARY: MfeEntry = {
  version: '3.5.0+inspectorcanary',
  remoteEntry: 'http://localhost:8080/mfe/inspector/canary.js',
  scope: 'osdMfe_inspector',
  module: './public',
};

const FIXTURE_DASHBOARD_DEFAULT: MfeEntry = {
  version: '3.5.0+dashboarddefault',
  remoteEntry: 'http://localhost:8080/mfe/dashboard/remoteEntry.js',
  scope: 'osdMfe_dashboard',
  module: './public',
};

const FIXTURE_CORE_ASSET: AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/core/abc123/core.entry.js',
  integrity: 'sha384-coreabc123def456',
  version: '3.5.0+core00000000',
};

/** Build a minimal valid `schemaVersion: 1` doc with two default entries. */
function buildDoc(): RegistryDocument {
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

function buildDocWithCanary(): RegistryDocument {
  return {
    ...buildDoc(),
    rollouts: [
      {
        id: 'inspector-canary-5pct',
        match: { userBucketLt: 5 },
        override: { mfes: { inspector: { ...FIXTURE_INSPECTOR_CANARY } } },
      },
    ],
  };
}

function buildDocWithCanaryAndTenant(): RegistryDocument {
  return {
    ...buildDocWithCanary(),
    tenantOverrides: {
      acme: {
        mfes: { inspector: { ...FIXTURE_INSPECTOR_CANARY } },
      },
    },
  };
}

/** Build a layered doc whose `default.mfes.inspector` carries an integrity. */
function buildDocWithIntegrity(version: string, integrity?: string): RegistryDocument {
  return {
    schemaVersion: SCHEMA_VERSION as 1,
    generatedAt: FIXTURE_GENERATED_AT,
    default: {
      sharedDeps: { ...FIXTURE_SHARED_DEPS },
      mfes: {
        inspector: {
          version,
          remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
          scope: 'osdMfe_inspector',
          module: './public',
          ...(integrity !== undefined ? { integrity } : {}),
        },
      },
    },
    rollouts: [],
    tenantOverrides: {},
  };
}

/** A multi-entry layered doc (inspector + discover + timeline) with stale compat. */
function buildMultiEntryDoc(): RegistryDocument {
  const entry = (id: string, hash: string): MfeEntry => ({
    version: `1.0.0+${hash}`,
    remoteEntry: `http://localhost:8080/mfe/${id}/remoteEntry.js`,
    scope: `osdMfe_${id}`,
    module: './public',
    integrity: `sha384-${id}OLD`,
    builtAgainst: { osdVersion: '1.0.0', sharedDeps: { react: '^16.0.0' } },
    compat: { minCoreVersion: '1.0.0', compatibleCoreRange: '1.0.x' },
  });
  return {
    schemaVersion: SCHEMA_VERSION as 1,
    generatedAt: FIXTURE_GENERATED_AT,
    default: {
      sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '1.0.0' },
      mfes: {
        inspector: entry('inspector', 'oldinspector'),
        discover: entry('discover', 'olddiscover0'),
        timeline: entry('timeline', 'oldtimeline0'),
      },
    },
    rollouts: [],
    tenantOverrides: {},
  };
}

/* ------------------------------------------------------------------------- *
 * Test helpers
 * ------------------------------------------------------------------------- */

function tmpDir(): string {
  return Fs.mkdtempSync(Path.join(Os.tmpdir(), `osd-mfe-cli-${process.pid}-`));
}

function writeJson(p: string, value: unknown): void {
  Fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
}

function readJson(p: string): unknown {
  return JSON.parse(Fs.readFileSync(p, 'utf8'));
}

/** Read a registry file and assert it's a valid schemaVersion: 1 doc. */
function readDoc(p: string): RegistryDocument {
  return assertValidRegistryDocument(readJson(p));
}

function silentConsole() {
  const logs: string[] = [];
  const errors: string[] = [];
  const out: UpdateCliConsole = {
    log: (m: string) => logs.push(m),
    error: (m: string) => errors.push(m),
  };
  return { out, logs, errors };
}

const fixedNow = () => FIXED_NOW;

/** A minimal valid deploy-manifest.json (subset the writer reads). */
function manifestWith(
  inspectorVersion: string,
  inspectorCdnUrl = 'https://cdn.example/mfe/inspector/abc123def456/remoteEntry.js',
  inspectorIntegrity?: string
) {
  return {
    schemaVersion: 1,
    generatedAt: '2026-06-09T00:00:00.000Z',
    cdn: {
      bucket: 'some-bucket',
      region: 'us-west-2',
      baseUrl: 'https://cdn.example',
      keyPrefix: 'mfe',
      distributionId: 'E123',
      domain: 'cdn.example',
    },
    sharedDeps: {
      version: '3.5.0',
      key: 'mfe/shared-deps/3.5.0',
      cdnUrl: 'https://cdn.example/mfe/shared-deps/3.5.0/',
      fileCount: 40,
    },
    mfes: {
      inspector: {
        version: inspectorVersion,
        contentHash: 'abc123def456',
        key: 'mfe/inspector/abc123def456/remoteEntry.js',
        cdnUrl: inspectorCdnUrl,
        fileCount: 12,
        ...(inspectorIntegrity !== undefined ? { integrity: inspectorIntegrity } : {}),
      },
      discover: {
        version: '3.5.0+0123456789ab',
        contentHash: '0123456789ab',
        key: 'mfe/discover/0123456789ab/remoteEntry.js',
        cdnUrl: 'https://cdn.example/mfe/discover/0123456789ab/remoteEntry.js',
        fileCount: 20,
      },
    },
  };
}

/** A single-plugin deploy-manifest (per-plugin `deploy_mfe --plugin <id>`). */
function singlePluginManifestWith(
  version: string,
  cdnUrl = 'https://cdn.example/mfe/inspector/newhash123456/remoteEntry.js',
  integrity?: string
) {
  return {
    schemaVersion: 1,
    generatedAt: '2026-06-10T00:00:00.000Z',
    cdn: {
      bucket: 'some-bucket',
      region: 'us-west-2',
      baseUrl: 'https://cdn.example',
      keyPrefix: 'mfe',
      distributionId: 'E123',
      domain: 'cdn.example',
    },
    // NB: no sharedDeps — a single-plugin publish carries none.
    mfes: {
      inspector: {
        version,
        contentHash: 'newhash123456',
        key: 'mfe/inspector/newhash123456/remoteEntry.js',
        cdnUrl,
        fileCount: 12,
        ...(integrity !== undefined ? { integrity } : {}),
      },
    },
  };
}

/** Write a v3-asset build-manifest at `<dir>/<hash>/build-manifest.json`. */
function writeBuildManifest(
  dir: string,
  assetKind: AssetKind,
  contentHash: string,
  primaryFile: string,
  themeName?: string
): string {
  const stagingDir = Path.join(dir, contentHash);
  Fs.mkdirSync(stagingDir, { recursive: true });
  Fs.writeFileSync(Path.join(stagingDir, primaryFile), 'PAYLOAD');
  const manifest: AssetBuildManifest = {
    schemaVersion: ASSET_BUILD_MANIFEST_SCHEMA_VERSION,
    generatedAt: FIXED_NOW.toISOString(),
    assetKind,
    ...(themeName !== undefined ? { themeName } : {}),
    contentHash,
    integrity: 'sha384-MOCKINTEGRITY',
    version: `3.5.0+${contentHash}`,
    stagingDir,
    primaryFile,
    files: [{ localPath: Path.join(stagingDir, primaryFile), relativePath: primaryFile }],
  };
  const manifestPath = Path.join(stagingDir, 'build-manifest.json');
  Fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return manifestPath;
}

/* ------------------------------------------------------------------------- *
 * Helpers: resolveRegistryPath
 * ------------------------------------------------------------------------- */

describe('resolveRegistryPath()', () => {
  it('uses --registry-path over the env var', () => {
    const p = resolveRegistryPath(['--registry-path', '/explicit/arg.json'], {
      MFE_REGISTRY_PATH: '/from/env.json',
    });
    expect(p).toBe('/explicit/arg.json');
  });

  it('falls back to MFE_REGISTRY_PATH when no arg is given', () => {
    expect(resolveRegistryPath([], { MFE_REGISTRY_PATH: '/from/env.json' })).toBe('/from/env.json');
  });

  it('throws when neither arg nor env provides a path', () => {
    expect(() => resolveRegistryPath([], {})).toThrow(/No registry path/);
  });
});

/* ------------------------------------------------------------------------- *
 * Helpers: parseKeyValuePairs
 * ------------------------------------------------------------------------- */

describe('parseKeyValuePairs()', () => {
  it('parses a sequence of key=value pairs until the next --flag', () => {
    const argv = [
      '--default-entry',
      'id=inspector',
      'version=v1',
      'url=https://x',
      '--reason',
      'r',
    ];
    const { pairs, nextIndex } = parseKeyValuePairs(argv, 1);
    expect(pairs).toEqual({ id: 'inspector', version: 'v1', url: 'https://x' });
    expect(argv[nextIndex]).toBe('--reason');
  });

  it('stops at end of argv', () => {
    const { pairs } = parseKeyValuePairs(['--add-rollout', 'ruleId=x', 'match={}'], 1);
    expect(pairs).toEqual({ ruleId: 'x', match: '{}' });
  });

  it('throws on a positional non-pair token', () => {
    expect(() => parseKeyValuePairs(['--x', 'positional'], 1)).toThrow(/Expected key=value/);
  });
});

/* ------------------------------------------------------------------------- *
 * --help
 * ------------------------------------------------------------------------- */

describe('runUpdateCli — --help', () => {
  it('prints usage and exits 0', () => {
    const c = silentConsole();
    const rc = runUpdateCli(['--help'], '/repo', {}, c.out);
    expect(rc).toBe(0);
    expect(c.logs.join('\n')).toContain('Usage: node scripts/update_registry');
  });
});

/* ------------------------------------------------------------------------- *
 * Pure mutation helpers (layered authoring)
 * ------------------------------------------------------------------------- */

describe('applySetDefaultEntry()', () => {
  it('adds a new default entry', () => {
    const doc = buildDoc();
    delete doc.default.mfes.dashboard;
    const r = applySetDefaultEntry(doc, {
      id: 'dashboard',
      version: 'd1',
      url: 'https://cdn.example.com/dashboard/d1/remoteEntry.js',
    });
    expect(r.before).toBeNull();
    expect(r.after.version).toBe('d1');
    expect(r.next.default.mfes.dashboard.remoteEntry).toContain('d1/remoteEntry.js');
    // Doesn't mutate the input.
    expect(doc.default.mfes.dashboard).toBeUndefined();
  });

  it('replaces an existing default entry, capturing the previous value', () => {
    const doc = buildDoc();
    const prev = doc.default.mfes.inspector;
    const r = applySetDefaultEntry(doc, {
      id: 'inspector',
      version: 'v_new',
      url: 'https://cdn.example.com/inspector/v_new/remoteEntry.js',
    });
    expect(r.before).toEqual(prev);
    expect(r.after.version).toBe('v_new');
  });

  it('throws when id is missing', () => {
    expect(() => applySetDefaultEntry(buildDoc(), { version: 'v', url: 'u' })).toThrow(
      /requires id/
    );
  });
});

describe('applyAddRollout()', () => {
  it('adds a new rollout rule', () => {
    const r = applyAddRollout(buildDoc(), {
      ruleId: 'c1',
      match: '{"userBucketLt":5}',
      override:
        '{"mfes":{"inspector":{"version":"c","remoteEntry":"https://x","scope":"inspector","module":"./public"}}}',
    });
    expect(r.before).toBeNull();
    expect(r.after.id).toBe('c1');
    expect(r.next.rollouts.length).toBe(1);
  });

  it('replaces an existing rollout with the same id', () => {
    const r1 = applyAddRollout(buildDoc(), {
      ruleId: 'c1',
      match: '{"userBucketLt":5}',
      override:
        '{"mfes":{"inspector":{"version":"c","remoteEntry":"https://x","scope":"inspector","module":"./public"}}}',
    });
    const r2 = applyAddRollout(r1.next, {
      ruleId: 'c1',
      match: '{"userBucketLt":10}',
      override:
        '{"mfes":{"inspector":{"version":"c2","remoteEntry":"https://x","scope":"inspector","module":"./public"}}}',
    });
    expect(r2.before).not.toBeNull();
    expect(r2.next.rollouts.length).toBe(1);
    expect(r2.next.rollouts[0].match.userBucketLt).toBe(10);
  });

  it('throws on invalid JSON in match/override', () => {
    expect(() =>
      applyAddRollout(buildDoc(), {
        ruleId: 'r',
        match: 'not-json',
        override: '{}',
      })
    ).toThrow(/match is not valid JSON/);
  });
});

describe('applyRemoveRollout() / applyTenantOverride() / applyRemoveTenantOverride()', () => {
  it('removes a rollout by id', () => {
    const r = applyRemoveRollout(buildDocWithCanary(), { ruleId: 'inspector-canary-5pct' });
    expect(r.before).not.toBeNull();
    expect(r.after).toBeNull();
    expect(r.next.rollouts).toEqual([]);
  });

  it('throws when removing an unknown rollout', () => {
    expect(() => applyRemoveRollout(buildDoc(), { ruleId: 'no-such' })).toThrow(
      /no rollout with ruleId/
    );
  });

  it('adds a tenant override layer', () => {
    const r = applyTenantOverride(buildDoc(), {
      customerId: 'acme',
      mfeId: 'inspector',
      version: 'v_acme',
      url: 'https://x',
    });
    expect(r.next.tenantOverrides.acme.mfes.inspector.version).toBe('v_acme');
    expect(r.before).toBeNull();
  });

  it('removes a tenant override and drops the empty layer', () => {
    const r = applyRemoveTenantOverride(buildDocWithCanaryAndTenant(), {
      customerId: 'acme',
      mfeId: 'inspector',
    });
    expect(r.next.tenantOverrides.acme).toBeUndefined();
  });
});

/* ------------------------------------------------------------------------- *
 * Rollback semantics
 * ------------------------------------------------------------------------- */

describe('applyRollback()', () => {
  function pushAuditEntry(
    log: AuditLog,
    op: AuditEntry['op'],
    target: string,
    before: unknown,
    after: unknown
  ): void {
    log.push({
      timestamp: '2026-06-19T00:00:00.000Z',
      op,
      target,
      before,
      after,
    });
  }

  it('restores the BEFORE value of the most recent change in the log', () => {
    const doc = buildDoc();
    const vA = { ...FIXTURE_INSPECTOR_DEFAULT };
    const vB = { ...FIXTURE_INSPECTOR_DEFAULT, version: 'v_b' };
    doc.default.mfes.inspector = vB;
    const log: AuditLog = [];
    pushAuditEntry(log, 'set-default-entry', 'inspector', vA, vB);

    const r = applyRollback(doc, log, 'inspector');
    expect(r.next.default.mfes.inspector).toEqual(vA);
    expect(r.before).toEqual(vB);
    expect(r.after).toEqual(vA);
  });

  it('rolls back to deletion when the prior change had before=null', () => {
    const doc = buildDoc();
    const log: AuditLog = [];
    pushAuditEntry(log, 'set-default-entry', 'inspector', null, doc.default.mfes.inspector);
    const r = applyRollback(doc, log, 'inspector');
    expect(r.next.default.mfes.inspector).toBeUndefined();
    expect(r.after).toBeNull();
  });

  it('round-trip: rollback after rollback restores the pre-rollback state', () => {
    const doc = buildDoc();
    const vA = { ...FIXTURE_INSPECTOR_DEFAULT };
    const vB = { ...FIXTURE_INSPECTOR_DEFAULT, version: 'v_b' };
    doc.default.mfes.inspector = vB;
    const log: AuditLog = [];
    pushAuditEntry(log, 'set-default-entry', 'inspector', vA, vB);

    const r1 = applyRollback(doc, log, 'inspector');
    pushAuditEntry(log, 'rollback', 'inspector', vB, vA);

    // Second rollback undoes the rollback, landing back on B.
    const r2 = applyRollback(r1.next, log, 'inspector');
    expect(r2.next.default.mfes.inspector).toEqual(vB);
  });

  it('throws when there is no audit history for the id', () => {
    expect(() => applyRollback(buildDoc(), [], 'inspector')).toThrow(/no audit history/);
  });
});

/* ------------------------------------------------------------------------- *
 * --check-deps
 * ------------------------------------------------------------------------- */

describe('checkDependencyGraph()', () => {
  it('passes when no externals are declared', () => {
    const dir = tmpDir();
    try {
      const r = checkDependencyGraph(buildDoc(), dir, '3.5');
      expect(r.ok).toBe(true);
      expect(r.offenders).toEqual([]);
    } finally {
      Fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('passes when every value-edge peer is in the resolved set', () => {
    const dir = tmpDir();
    try {
      writeJson(Path.join(dir, 'inspector.externals.json'), {
        requires: ['dashboard'],
        contractVersion: '3.5',
      });
      writeJson(Path.join(dir, 'dashboard.externals.json'), {
        requires: [],
        contractVersion: '3.5',
      });
      expect(checkDependencyGraph(buildDoc(), dir, '3.5').ok).toBe(true);
    } finally {
      Fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects when a required peer is missing from the resolved set', () => {
    const dir = tmpDir();
    try {
      writeJson(Path.join(dir, 'inspector.externals.json'), { requires: ['data'] });
      const r = checkDependencyGraph(buildDoc(), dir, '3.5');
      expect(r.ok).toBe(false);
      expect(r.offenders).toEqual([expect.objectContaining({ from: 'inspector', to: 'data' })]);
    } finally {
      Fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects when a peer is built against an incompatible contractVersion', () => {
    const dir = tmpDir();
    try {
      writeJson(Path.join(dir, 'inspector.externals.json'), {
        requires: [],
        contractVersion: '99.9',
      });
      const r = checkDependencyGraph(buildDoc(), dir, '3.5');
      expect(r.ok).toBe(false);
      expect(r.offenders[0].reason).toMatch(/contractVersion/);
    } finally {
      Fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('considers ids only present in rollouts/tenants when validating', () => {
    const dir = tmpDir();
    try {
      const doc = buildDoc();
      doc.rollouts = [
        {
          id: 'newcomer',
          match: { userBucketLt: 5 },
          override: {
            mfes: {
              newcomer: {
                version: 'n1',
                remoteEntry: 'https://x',
                scope: 'newcomer',
                module: './public',
              },
            },
          },
        },
      ];
      writeJson(Path.join(dir, 'newcomer.externals.json'), { requires: ['nonexistent'] });
      const r = checkDependencyGraph(doc, dir, '3.5');
      expect(r.ok).toBe(false);
      expect(r.offenders[0]).toEqual(
        expect.objectContaining({ from: 'newcomer', to: 'nonexistent' })
      );
    } finally {
      Fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

/* ------------------------------------------------------------------------- *
 * buildRegistryFromManifest / mergeRegistryFromManifest (pure helpers)
 * ------------------------------------------------------------------------- */

describe('buildRegistryFromManifest()', () => {
  const now = new Date('2026-07-01T12:00:00.000Z');

  it('produces a layered schemaVersion: 1 doc with empty rollouts/tenantOverrides', () => {
    const doc = buildRegistryFromManifest(manifestWith('3.5.0+abc123def456'), now);
    expect(doc.schemaVersion).toBe(1);
    expect(doc.rollouts).toEqual([]);
    expect(doc.tenantOverrides).toEqual({});
    expect(doc.default.sharedDeps.url).toBe('https://cdn.example/mfe/shared-deps/3.5.0/');
    expect(doc.default.sharedDeps.version).toBe('3.5.0');
    expect(doc.generatedAt).toBe('2026-07-01T12:00:00.000Z');
  });

  it('repoints remoteEntry at the CDN URL and derives canonical scope/module', () => {
    const doc = buildRegistryFromManifest(manifestWith('3.5.0+abc123def456'), now);
    // Manifest mfes are sorted by id.
    expect(Object.keys(doc.default.mfes)).toEqual(['discover', 'inspector']);
    expect(doc.default.mfes.inspector.remoteEntry).toBe(
      'https://cdn.example/mfe/inspector/abc123def456/remoteEntry.js'
    );
    expect(doc.default.mfes.inspector.version).toBe('3.5.0+abc123def456');
    expect(doc.default.mfes.inspector.scope).toBe('osdMfe_inspector');
    expect(doc.default.mfes.inspector.module).toBe('./public');
    expect(doc.default.mfes.inspector.integrity).toBeUndefined();
  });

  it('carries SRI from the prior entry when the version matches', () => {
    const priorMfes: Record<string, MfeEntry> = {
      inspector: {
        version: '3.5.0+abc123def456',
        remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
        scope: 'osdMfe_inspector',
        module: './public',
        integrity: 'sha384-KEEPME',
      },
    };
    const doc = buildRegistryFromManifest(manifestWith('3.5.0+abc123def456'), now, priorMfes);
    expect(doc.default.mfes.inspector.integrity).toBe('sha384-KEEPME');
  });

  it('drops SRI when the prior entry pins a different content hash', () => {
    const priorMfes: Record<string, MfeEntry> = {
      inspector: {
        version: '3.5.0+OLDHASHOLDHA',
        remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
        scope: 'osdMfe_inspector',
        module: './public',
        integrity: 'sha384-STALE',
      },
    };
    const doc = buildRegistryFromManifest(manifestWith('3.5.0+abc123def456'), now, priorMfes);
    expect(doc.default.mfes.inspector.integrity).toBeUndefined();
  });

  it('stamps the MANIFEST integrity verbatim when present', () => {
    const priorMfes: Record<string, MfeEntry> = {
      inspector: {
        version: '3.5.0+OLDHASHOLDHA',
        remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
        scope: 'osdMfe_inspector',
        module: './public',
        integrity: 'sha384-STALE',
      },
    };
    const m = manifestWith(
      '3.5.0+abc123def456',
      'https://cdn.example/mfe/inspector/abc123def456/remoteEntry.js',
      'sha384-FRESHFROMDEPLOY'
    );
    const doc = buildRegistryFromManifest(m, now, priorMfes);
    expect(doc.default.mfes.inspector.integrity).toBe('sha384-FRESHFROMDEPLOY');
  });

  it('throws when the manifest has no sharedDeps (single-plugin publish)', () => {
    expect(() =>
      buildRegistryFromManifest(singlePluginManifestWith('1.0.0+newhash123456'), now)
    ).toThrow(/Cannot REPLACE the registry from a manifest with no sharedDeps/);
  });
});

describe('mergeRegistryFromManifest()', () => {
  const now = new Date('2026-07-01T12:00:00.000Z');

  it('patches only the manifest entries, leaving the others byte-identical', () => {
    const existing = buildMultiEntryDoc();
    const before: RegistryDocument = JSON.parse(JSON.stringify(existing));

    const merged = mergeRegistryFromManifest(
      existing,
      singlePluginManifestWith('1.0.0+newhash123456'),
      now
    );

    expect(merged.default.mfes.inspector.remoteEntry).toBe(
      'https://cdn.example/mfe/inspector/newhash123456/remoteEntry.js'
    );
    expect(merged.default.mfes.inspector.version).toBe('1.0.0+newhash123456');
    expect(merged.default.mfes.discover).toEqual(before.default.mfes.discover);
    expect(merged.default.mfes.timeline).toEqual(before.default.mfes.timeline);
    // sharedDeps preserved (single-plugin manifest had none).
    expect(merged.default.sharedDeps).toEqual(before.default.sharedDeps);
    expect(merged.generatedAt).toBe('2026-07-01T12:00:00.000Z');
  });

  it('stamps FRESH compat on the merged entry (overrides stale prior compat)', () => {
    const existing = buildMultiEntryDoc();
    const fresh = {
      builtAgainst: { osdVersion: '9.9.9', sharedDeps: { react: '^99.0.0' } },
      compat: { minCoreVersion: '9.9.0', compatibleCoreRange: '9.9.x' },
    };
    const merged = mergeRegistryFromManifest(
      existing,
      singlePluginManifestWith('9.9.9+newhash123456'),
      now,
      fresh
    );
    expect(merged.default.mfes.inspector.builtAgainst).toEqual(fresh.builtAgainst);
    expect(merged.default.mfes.inspector.compat).toEqual(fresh.compat);
    expect(merged.default.mfes.discover.builtAgainst?.osdVersion).toBe('1.0.0');
  });

  it('repoints sharedDeps when the manifest carries one (full publish)', () => {
    const merged = mergeRegistryFromManifest(
      buildMultiEntryDoc(),
      manifestWith('1.0.0+abc123def456'),
      now
    );
    expect(merged.default.sharedDeps.url).toBe('https://cdn.example/mfe/shared-deps/3.5.0/');
    expect(merged.default.sharedDeps.version).toBe('3.5.0');
  });

  it('stamps the manifest SRI onto the merged entry; leaves untouched entries byte-identical', () => {
    const existing = buildMultiEntryDoc();
    const before: RegistryDocument = JSON.parse(JSON.stringify(existing));
    const merged = mergeRegistryFromManifest(
      existing,
      singlePluginManifestWith(
        '1.0.0+newhash123456',
        'https://cdn.example/mfe/inspector/newhash123456/remoteEntry.js',
        'sha384-MERGEDFRESH'
      ),
      now
    );
    expect(merged.default.mfes.inspector.integrity).toBe('sha384-MERGEDFRESH');
    expect(merged.default.mfes.discover).toEqual(before.default.mfes.discover);
    expect(merged.default.mfes.timeline).toEqual(before.default.mfes.timeline);
  });
});

/* ------------------------------------------------------------------------- *
 * runUpdateCli — v1-style: single-plugin patch
 * ------------------------------------------------------------------------- */

describe('runUpdateCli — v1-style: --plugin', () => {
  let dir: string;
  let registryPath: string;

  beforeEach(() => {
    dir = tmpDir();
    registryPath = Path.join(dir, 'registry.json');
    // Seed an entry that HAS an integrity hash so we can prove it is dropped.
    writeJson(registryPath, buildDocWithIntegrity('3.5.0+old', 'sha384-OLDHASH'));
  });

  afterEach(() => {
    Fs.rmSync(dir, { recursive: true, force: true });
  });

  it('patches version + url, drops integrity, and still validates', () => {
    const c = silentConsole();
    const rc = runUpdateCli(
      [
        '--registry-path',
        registryPath,
        '--plugin',
        'inspector',
        '--version',
        '3.5.0+new',
        '--url',
        'http://cdn.example/mfe/inspector/remoteEntry.js',
      ],
      '/repo',
      {},
      c.out,
      new Date('2026-07-01T12:00:00.000Z')
    );
    expect(rc).toBe(0);
    const doc = readDoc(registryPath);
    expect(doc.default.mfes.inspector.version).toBe('3.5.0+new');
    expect(doc.default.mfes.inspector.remoteEntry).toBe(
      'http://cdn.example/mfe/inspector/remoteEntry.js'
    );
    expect(doc.default.mfes.inspector.integrity).toBeUndefined();
    expect(doc.default.mfes.inspector.scope).toBe('osdMfe_inspector');
    expect(doc.default.mfes.inspector.module).toBe('./public');
    expect(doc.generatedAt).toBe('2026-07-01T12:00:00.000Z');
  });

  it('patches version only, leaving the existing url intact', () => {
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath, '--plugin', 'inspector', '--version', '3.5.0+v2'],
      '/repo',
      {},
      c.out
    );
    expect(rc).toBe(0);
    const doc = readDoc(registryPath);
    expect(doc.default.mfes.inspector.version).toBe('3.5.0+v2');
    expect(doc.default.mfes.inspector.remoteEntry).toBe(
      'http://localhost:8080/mfe/inspector/remoteEntry.js'
    );
  });

  it('fails when --plugin is given without --version or --url', () => {
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath, '--plugin', 'inspector'],
      '/repo',
      {},
      c.out
    );
    expect(rc).toBe(1);
    expect(c.errors.join('\n')).toMatch(/requires at least one of --version/);
  });

  it('fails for an unknown plugin id', () => {
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath, '--plugin', 'does-not-exist', '--version', 'x'],
      '/repo',
      {},
      c.out
    );
    expect(rc).toBe(1);
    expect(c.errors.join('\n')).toMatch(/No registry entry for plugin "does-not-exist"/);
  });
});

/* ------------------------------------------------------------------------- *
 * runUpdateCli — v1-style: full regen
 * ------------------------------------------------------------------------- */

describe('runUpdateCli — v1-style: full regen', () => {
  let repoRoot: string;
  let registryPath: string;
  let outerDir: string;

  beforeEach(() => {
    outerDir = tmpDir();
    repoRoot = Path.join(outerDir, 'repo');
    registryPath = Path.join(outerDir, 'registry.json');

    Fs.mkdirSync(repoRoot, { recursive: true });
    Fs.writeFileSync(Path.join(repoRoot, 'package.json'), JSON.stringify({ version: '9.9.9' }));
    for (const id of ['inspector', 'discover']) {
      const remoteDir = Path.join(repoRoot, 'target', 'mfe', id);
      Fs.mkdirSync(remoteDir, { recursive: true });
      Fs.writeFileSync(Path.join(remoteDir, 'remoteEntry.js'), `/* remote ${id} */`);
    }
  });

  afterEach(() => {
    Fs.rmSync(outerDir, { recursive: true, force: true });
  });

  it('regenerates a valid layered registry for all built remotes with --base-url', () => {
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath, '--base-url', 'http://cdn.example'],
      repoRoot,
      {},
      c.out
    );
    expect(rc).toBe(0);
    const doc = readDoc(registryPath);
    expect(Object.keys(doc.default.mfes).sort()).toEqual(['discover', 'inspector']);
    expect(doc.default.mfes.inspector.remoteEntry).toBe(
      'http://cdn.example/mfe/inspector/remoteEntry.js'
    );
    expect(doc.default.mfes.inspector.version).toMatch(/^9\.9\.9\+[0-9a-f]{12}$/);
    expect(doc.default.mfes.inspector.integrity).toMatch(/^sha384-/);
    expect(doc.rollouts).toEqual([]);
    expect(doc.tenantOverrides).toEqual({});
  });

  it('honors REGISTRY_BASE_URL from env when --base-url is absent', () => {
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath],
      repoRoot,
      { REGISTRY_BASE_URL: 'http://env-origin' },
      c.out
    );
    expect(rc).toBe(0);
    const doc = readDoc(registryPath);
    expect(doc.default.mfes.inspector.remoteEntry).toBe(
      'http://env-origin/mfe/inspector/remoteEntry.js'
    );
  });
});

/* ------------------------------------------------------------------------- *
 * runUpdateCli — v1-style: --from-manifest REPLACE / MERGE
 * ------------------------------------------------------------------------- */

describe('runUpdateCli — v1-style: --from-manifest', () => {
  let dir: string;
  let registryPath: string;
  let manifestPath: string;

  beforeEach(() => {
    dir = tmpDir();
    registryPath = Path.join(dir, 'registry.json');
    manifestPath = Path.join(dir, 'deploy-manifest.json');
    // Pre-existing local registry whose inspector pins the SAME content hash
    // as the manifest below, so its SRI must be carried forward.
    writeJson(registryPath, buildDocWithIntegrity('3.5.0+abc123def456', 'sha384-CARRYME'));
  });

  afterEach(() => {
    Fs.rmSync(dir, { recursive: true, force: true });
  });

  it('REPLACE: registers the CDN revision next to the registry (default manifest path)', () => {
    writeJson(manifestPath, manifestWith('3.5.0+abc123def456'));
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath, '--from-manifest'],
      '/repo',
      {},
      c.out,
      new Date('2026-07-01T12:00:00.000Z')
    );
    expect(rc).toBe(0);
    const doc = readDoc(registryPath);
    expect(doc.default.mfes.inspector.remoteEntry).toBe(
      'https://cdn.example/mfe/inspector/abc123def456/remoteEntry.js'
    );
    expect(doc.default.sharedDeps.url).toBe('https://cdn.example/mfe/shared-deps/3.5.0/');
    expect(doc.default.mfes.inspector.integrity).toBe('sha384-CARRYME');
    expect(c.logs.join('\n')).toMatch(/Registered CDN revision/);
  });

  it('REPLACE: reads an explicit --manifest-path', () => {
    const altManifest = Path.join(dir, 'nested', 'manifest.json');
    Fs.mkdirSync(Path.dirname(altManifest), { recursive: true });
    writeJson(altManifest, manifestWith('3.5.0+abc123def456'));
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath, '--from-manifest', '--manifest-path', altManifest],
      '/repo',
      {},
      c.out
    );
    expect(rc).toBe(0);
    const doc = readDoc(registryPath);
    expect(doc.default.mfes.discover.remoteEntry).toBe(
      'https://cdn.example/mfe/discover/0123456789ab/remoteEntry.js'
    );
  });

  it('REPLACE: drops entries absent from the manifest', () => {
    // Seed a 3-entry registry (inspector + discover + timeline); manifest has
    // only inspector + discover.
    writeJson(registryPath, buildMultiEntryDoc());
    writeJson(manifestPath, manifestWith('3.5.0+abc123def456'));
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath, '--from-manifest'],
      '/repo',
      {},
      c.out,
      new Date('2026-07-01T12:00:00.000Z')
    );
    expect(rc).toBe(0);
    const doc = readDoc(registryPath);
    expect(Object.keys(doc.default.mfes).sort()).toEqual(['discover', 'inspector']);
    expect(doc.default.sharedDeps.url).toBe('https://cdn.example/mfe/shared-deps/3.5.0/');
  });

  it('REPLACE: fails with exit 1 on an invalid manifest', () => {
    Fs.writeFileSync(manifestPath, JSON.stringify({ schemaVersion: 1, mfes: {} }));
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath, '--from-manifest'],
      '/repo',
      {},
      c.out
    );
    expect(rc).toBe(1);
    expect(c.errors.join('\n')).toMatch(/Invalid deploy manifest/);
  });

  it('REPLACE: fails with exit 1 on an unsupported manifest schemaVersion', () => {
    Fs.writeFileSync(
      manifestPath,
      JSON.stringify({ ...manifestWith('3.5.0+abc123def456'), schemaVersion: 2 })
    );
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath, '--from-manifest'],
      '/repo',
      {},
      c.out
    );
    expect(rc).toBe(1);
    expect(c.errors.join('\n')).toMatch(/schemaVersion must equal 1/);
  });

  it('MERGE: changes exactly ONE entry; others byte-identical + fresh compat stamped', () => {
    // Seed a 3-entry registry with STALE compat.
    writeJson(registryPath, buildMultiEntryDoc());
    const before = readDoc(registryPath);
    writeJson(manifestPath, singlePluginManifestWith('9.9.9+newhash123456'));
    // Build a fake repo so tryComputeCompatMetadata produces fresh compat.
    const repoRoot = Path.join(dir, 'repo');
    Fs.mkdirSync(repoRoot, { recursive: true });
    Fs.writeFileSync(Path.join(repoRoot, 'package.json'), JSON.stringify({ version: '9.9.9' }));
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath, '--from-manifest', '--merge'],
      repoRoot,
      {},
      c.out,
      new Date('2026-07-01T12:00:00.000Z')
    );
    expect(rc).toBe(0);
    const doc = readDoc(registryPath);
    expect(Object.keys(doc.default.mfes).sort()).toEqual(['discover', 'inspector', 'timeline']);
    expect(doc.default.mfes.inspector.remoteEntry).toBe(
      'https://cdn.example/mfe/inspector/newhash123456/remoteEntry.js'
    );
    expect(doc.default.mfes.inspector.version).toBe('9.9.9+newhash123456');
    expect(doc.default.mfes.inspector.builtAgainst?.osdVersion).toBe('9.9.9');
    expect(doc.default.mfes.inspector.compat).toEqual({
      minCoreVersion: '9.9.0',
      compatibleCoreRange: '9.9.x',
    });
    expect(doc.default.mfes.discover).toEqual(before.default.mfes.discover);
    expect(doc.default.mfes.timeline).toEqual(before.default.mfes.timeline);
    expect(doc.default.sharedDeps).toEqual(before.default.sharedDeps);
    expect(c.logs.join('\n')).toMatch(/Merged CDN revision/);
  });

  it('MERGE: fails when --merge is used without --from-manifest', () => {
    const c = silentConsole();
    const rc = runUpdateCli(['--registry-path', registryPath, '--merge'], '/repo', {}, c.out);
    expect(rc).toBe(1);
    expect(c.errors.join('\n')).toMatch(/--merge only applies to --from-manifest/);
  });

  it('MERGE: fails when --merge has no existing registry to patch into', () => {
    Fs.rmSync(registryPath, { force: true });
    writeJson(manifestPath, singlePluginManifestWith('9.9.9+newhash123456'));
    const c = silentConsole();
    const rc = runUpdateCli(
      ['--registry-path', registryPath, '--from-manifest', '--merge'],
      '/repo',
      {},
      c.out
    );
    expect(rc).toBe(1);
    expect(c.errors.join('\n')).toMatch(/--merge requires an existing, valid registry/);
  });
});

/* ------------------------------------------------------------------------- *
 * runUpdateCli — layered authoring (end-to-end, atomic write + audit log)
 * ------------------------------------------------------------------------- */

describe('runUpdateCli — layered authoring (end-to-end)', () => {
  function setup() {
    const dir = tmpDir();
    const registryPath = Path.join(dir, 'registry.json');
    writeJson(registryPath, buildDoc());
    return {
      dir,
      registryPath,
      historyPath: `${registryPath}.history.json`,
      cleanup: () => Fs.rmSync(dir, { recursive: true, force: true }),
    };
  }

  it('--default-entry: sets a new entry, appends an audit entry, both files updated atomically', () => {
    const t = setup();
    try {
      const c = silentConsole();
      const rc = runUpdateCli(
        [
          '--default-entry',
          'id=newcomer',
          'version=n1',
          'url=https://cdn.example.com/newcomer/n1/remoteEntry.js',
          '--registry-path',
          t.registryPath,
        ],
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      expect(rc).toBe(0);
      const doc = readDoc(t.registryPath);
      expect(doc.default.mfes.newcomer.version).toBe('n1');
      const log = readJson(t.historyPath) as AuditLog;
      expect(log.length).toBe(1);
      expect(log[0]).toEqual(
        expect.objectContaining({
          op: 'set-default-entry',
          target: 'newcomer',
          before: null,
          timestamp: FIXED_NOW.toISOString(),
        })
      );
    } finally {
      t.cleanup();
    }
  });

  it('--reason "<text>" is recorded in the audit entry', () => {
    const t = setup();
    try {
      const c = silentConsole();
      runUpdateCli(
        [
          '--default-entry',
          'id=inspector',
          'version=v_new',
          'url=https://x',
          '--registry-path',
          t.registryPath,
          '--reason',
          'rolling out new build',
        ],
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      const log = readJson(t.historyPath) as AuditLog;
      expect(log[0].reason).toBe('rolling out new build');
    } finally {
      t.cleanup();
    }
  });

  it('--add-rollout and --remove-rollout round-trip through audit log', () => {
    const t = setup();
    try {
      const c = silentConsole();
      const args = (extra: string[]) => [...extra, '--registry-path', t.registryPath];
      runUpdateCli(
        args([
          '--add-rollout',
          'ruleId=c1',
          'match={"userBucketLt":5}',
          'override={"mfes":{"inspector":{"version":"c","remoteEntry":"https://x","scope":"inspector","module":"./public"}}}',
        ]),
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      let doc = readDoc(t.registryPath);
      expect(doc.rollouts.length).toBe(1);
      runUpdateCli(args(['--remove-rollout', 'ruleId=c1']), '/repo', {}, c.out, fixedNow());
      doc = readDoc(t.registryPath);
      expect(doc.rollouts).toEqual([]);
      const log = readJson(t.historyPath) as AuditLog;
      expect(log.map((e: AuditEntry) => e.op)).toEqual(['add-rollout', 'remove-rollout']);
    } finally {
      t.cleanup();
    }
  });

  it('--tenant-override + --remove-tenant-override round-trip', () => {
    const t = setup();
    try {
      const c = silentConsole();
      const args = (extra: string[]) => [...extra, '--registry-path', t.registryPath];
      runUpdateCli(
        args([
          '--tenant-override',
          'customerId=acme',
          'mfeId=inspector',
          'version=v_acme',
          'url=https://x',
        ]),
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      let doc = readDoc(t.registryPath);
      expect(doc.tenantOverrides.acme.mfes.inspector.version).toBe('v_acme');
      runUpdateCli(
        args(['--remove-tenant-override', 'customerId=acme', 'mfeId=inspector']),
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      doc = readDoc(t.registryPath);
      expect(doc.tenantOverrides.acme).toBeUndefined();
    } finally {
      t.cleanup();
    }
  });

  it('--rollback restores the previous default entry per the audit log', () => {
    const t = setup();
    try {
      const c = silentConsole();
      const args = (extra: string[]) => [...extra, '--registry-path', t.registryPath];

      runUpdateCli(
        args([
          '--default-entry',
          'id=inspector',
          'version=v_new',
          'url=https://cdn.example.com/inspector/v_new/remoteEntry.js',
        ]),
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      let doc = readDoc(t.registryPath);
      expect(doc.default.mfes.inspector.version).toBe('v_new');

      runUpdateCli(args(['--rollback', 'id=inspector']), '/repo', {}, c.out, fixedNow());
      doc = readDoc(t.registryPath);
      expect(doc.default.mfes.inspector.version).toBe(FIXTURE_INSPECTOR_DEFAULT.version);

      const log = readJson(t.historyPath) as AuditLog;
      expect(log.map((e: AuditEntry) => e.op)).toEqual(['set-default-entry', 'rollback']);
    } finally {
      t.cleanup();
    }
  });

  it('atomicity: a malformed mutation leaves both files unchanged', () => {
    const t = setup();
    try {
      const docBefore = readJson(t.registryPath);
      const c = silentConsole();
      const rc = runUpdateCli(
        [
          '--add-rollout',
          'ruleId=c1',
          'match={"userBucketLt":5}',
          'override={"mfes":{}}',
          '--registry-path',
          t.registryPath,
        ],
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      expect(rc).toBe(1);
      expect(readJson(t.registryPath)).toEqual(docBefore);
      expect(Fs.existsSync(t.historyPath)).toBe(false);
    } finally {
      t.cleanup();
    }
  });

  it('--check-deps rejects an unsatisfiable graph and writes nothing', () => {
    const t = setup();
    try {
      const externalsDir = Path.join(t.dir, 'externals');
      Fs.mkdirSync(externalsDir);
      writeJson(Path.join(externalsDir, 'newcomer.externals.json'), {
        requires: ['nonexistent'],
      });
      const docBefore = readJson(t.registryPath);
      const c = silentConsole();
      const rc = runUpdateCli(
        [
          '--default-entry',
          'id=newcomer',
          'version=n1',
          'url=https://x',
          '--registry-path',
          t.registryPath,
          '--check-deps',
          '--externals-dir',
          externalsDir,
        ],
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      expect(rc).toBe(2);
      expect(c.errors.some((e) => e.includes('newcomer -> nonexistent'))).toBe(true);
      expect(readJson(t.registryPath)).toEqual(docBefore);
      expect(Fs.existsSync(t.historyPath)).toBe(false);
    } finally {
      t.cleanup();
    }
  });

  it('--check-deps passes when the graph is satisfiable', () => {
    const t = setup();
    try {
      const externalsDir = Path.join(t.dir, 'externals');
      Fs.mkdirSync(externalsDir);
      writeJson(Path.join(externalsDir, 'newcomer.externals.json'), { requires: ['inspector'] });
      const c = silentConsole();
      const rc = runUpdateCli(
        [
          '--default-entry',
          'id=newcomer',
          'version=n1',
          'url=https://x',
          '--registry-path',
          t.registryPath,
          '--check-deps',
          '--externals-dir',
          externalsDir,
        ],
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      expect(rc).toBe(0);
      const doc = readDoc(t.registryPath);
      expect(doc.default.mfes.newcomer.version).toBe('n1');
    } finally {
      t.cleanup();
    }
  });
});

/* ------------------------------------------------------------------------- *
 * runUpdateCli — global-asset writers
 * ------------------------------------------------------------------------- */

describe('runUpdateCli — global-asset writers', () => {
  /** Setup with a doc whose `core` is empty (the typical fresh state). */
  function setup() {
    const dir = tmpDir();
    const registryPath = Path.join(dir, 'registry.json');
    writeJson(registryPath, buildDoc());
    return {
      dir,
      registryPath,
      historyPath: `${registryPath}.history.json`,
      cleanup: () => Fs.rmSync(dir, { recursive: true, force: true }),
    };
  }

  /** Setup with a doc whose `core` is already populated. */
  function setupWithCore() {
    const dir = tmpDir();
    const registryPath = Path.join(dir, 'registry.json');
    writeJson(registryPath, { ...buildDoc(), core: { ...FIXTURE_CORE_ASSET } });
    return {
      dir,
      registryPath,
      historyPath: `${registryPath}.history.json`,
      cleanup: () => Fs.rmSync(dir, { recursive: true, force: true }),
    };
  }

  it('--update-core: stamps the core field, appends a set-core audit entry', () => {
    const t = setup();
    try {
      const manifestPath = writeBuildManifest(t.dir, 'core', 'corehash1234', 'core.entry.js');
      const c = silentConsole();
      const rc = runUpdateCli(
        ['--update-core', manifestPath, '--registry-path', t.registryPath],
        '/repo',
        { REGISTRY_BASE_URL: 'http://localhost:8080' },
        c.out,
        fixedNow()
      );
      expect(rc).toBe(0);
      const doc = readDoc(t.registryPath);
      expect(doc.core).toBeDefined();
      expect(doc.core!.url).toBe('http://localhost:8080/core/corehash1234/core.entry.js');
      expect(doc.core!.integrity).toBe('sha384-MOCKINTEGRITY');
      expect(doc.core!.version).toBe('3.5.0+corehash1234');
      const log = readJson(t.historyPath) as AuditLog;
      expect(log.map((e: AuditEntry) => e.op)).toEqual(['set-core']);
      expect(log[0].target).toBe('core');
      expect(log[0].before).toBeNull();
    } finally {
      t.cleanup();
    }
  });

  it('--update-orchestrator: stamps orchestrator on an existing populated doc', () => {
    const t = setupWithCore();
    try {
      const manifestPath = writeBuildManifest(
        t.dir,
        'orchestrator',
        'orchhash1234',
        'osd_bootstrap_mfe.js'
      );
      const c = silentConsole();
      const rc = runUpdateCli(
        ['--update-orchestrator', manifestPath, '--registry-path', t.registryPath],
        '/repo',
        { REGISTRY_BASE_URL: 'http://localhost:8080' },
        c.out,
        fixedNow()
      );
      expect(rc).toBe(0);
      const doc = readDoc(t.registryPath);
      expect(doc.orchestrator!.url).toBe(
        'http://localhost:8080/orchestrator/orchhash1234/osd_bootstrap_mfe.js'
      );
      const log = readJson(t.historyPath) as AuditLog;
      expect(log.map((e: AuditEntry) => e.op)).toEqual(['set-orchestrator']);
    } finally {
      t.cleanup();
    }
  });

  it('--update-theme <name>: sets themes[<name>]; audit target carries the qualified key', () => {
    const t = setup();
    try {
      const manifestPath = writeBuildManifest(
        t.dir,
        'theme',
        'lighthash1234',
        'legacy_light_theme.css',
        'light'
      );
      const c = silentConsole();
      const rc = runUpdateCli(
        ['--update-theme', 'light', manifestPath, '--registry-path', t.registryPath],
        '/repo',
        { REGISTRY_BASE_URL: 'http://localhost:8080' },
        c.out,
        fixedNow()
      );
      expect(rc).toBe(0);
      const doc = readDoc(t.registryPath);
      expect(doc.themes!.light.url).toBe(
        'http://localhost:8080/themes/light/lighthash1234/legacy_light_theme.css'
      );
      const log = readJson(t.historyPath) as AuditLog;
      expect(log[0].op).toBe('set-theme');
      expect(log[0].target).toBe('themes.light');
    } finally {
      t.cleanup();
    }
  });

  it('--update-shared-deps-css: sets sharedDepsCss with the set-shared-deps-css audit op', () => {
    const t = setup();
    try {
      const manifestPath = writeBuildManifest(
        t.dir,
        'shared-deps-css',
        'cssh1234',
        'osd-ui-shared-deps.css'
      );
      const c = silentConsole();
      const rc = runUpdateCli(
        ['--update-shared-deps-css', manifestPath, '--registry-path', t.registryPath],
        '/repo',
        { REGISTRY_BASE_URL: 'http://localhost:8080' },
        c.out,
        fixedNow()
      );
      expect(rc).toBe(0);
      const doc = readDoc(t.registryPath);
      expect(doc.sharedDepsCss!.url).toBe(
        'http://localhost:8080/shared-deps/css/cssh1234/osd-ui-shared-deps.css'
      );
      const log = readJson(t.historyPath) as AuditLog;
      expect(log[0].op).toBe('set-shared-deps-css');
      expect(log[0].target).toBe('sharedDepsCss');
    } finally {
      t.cleanup();
    }
  });

  it('rejects a manifest whose assetKind does not match the flag', () => {
    const t = setup();
    try {
      const manifestPath = writeBuildManifest(t.dir, 'core', 'wrong1234', 'core.entry.js');
      const c = silentConsole();
      const docBefore = readJson(t.registryPath);
      const rc = runUpdateCli(
        ['--update-orchestrator', manifestPath, '--registry-path', t.registryPath],
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      expect(rc).toBe(1);
      expect(c.errors.some((e) => /assetKind="core"/.test(e))).toBe(true);
      expect(readJson(t.registryPath)).toEqual(docBefore);
      expect(Fs.existsSync(t.historyPath)).toBe(false);
    } finally {
      t.cleanup();
    }
  });

  it('rejects --update-theme with a theme-name/manifest-themeName mismatch', () => {
    const t = setup();
    try {
      const manifestPath = writeBuildManifest(
        t.dir,
        'theme',
        'lighthash',
        'legacy_light_theme.css',
        'light'
      );
      const c = silentConsole();
      const rc = runUpdateCli(
        ['--update-theme', 'dark', manifestPath, '--registry-path', t.registryPath],
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      expect(rc).toBe(1);
      expect(c.errors.some((e) => /themeName="light"/.test(e))).toBe(true);
    } finally {
      t.cleanup();
    }
  });

  it('rejects multiple --update-* flags in a single invocation', () => {
    const t = setup();
    try {
      const coreManifest = writeBuildManifest(t.dir, 'core', 'corehash', 'core.entry.js');
      const c = silentConsole();
      const rc = runUpdateCli(
        [
          '--update-core',
          coreManifest,
          '--update-orchestrator',
          coreManifest,
          '--registry-path',
          t.registryPath,
        ],
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      expect(rc).toBe(1);
      expect(c.errors.some((e) => /Only one --update-\* flag/.test(e))).toBe(true);
    } finally {
      t.cleanup();
    }
  });

  it('re-signs the doc when MFE_REGISTRY_SIGNING_KEY is set', () => {
    const t = setup();
    try {
      const manifestPath = writeBuildManifest(t.dir, 'core', 'h1234', 'core.entry.js');
      const c = silentConsole();
      const rc = runUpdateCli(
        ['--update-core', manifestPath, '--registry-path', t.registryPath],
        '/repo',
        {
          MFE_REGISTRY_SIGNING_KEY: 'secret-key-material',
          MFE_REGISTRY_KEY_ID: 'k1',
        },
        c.out,
        fixedNow()
      );
      expect(rc).toBe(0);
      const docRaw = readJson(t.registryPath) as {
        signature?: { algorithm: string; keyId: string; value: string };
      };
      expect(docRaw.signature).toBeDefined();
      expect(docRaw.signature!.algorithm).toBe('HMAC-SHA256');
      expect(docRaw.signature!.keyId).toBe('k1');
      expect(typeof docRaw.signature!.value).toBe('string');
      expect(docRaw.signature!.value.length).toBeGreaterThan(0);
    } finally {
      t.cleanup();
    }
  });

  it('uses --cdn-base-url to override the URL prefix', () => {
    const t = setup();
    try {
      const manifestPath = writeBuildManifest(t.dir, 'core', 'aaa1234', 'core.entry.js');
      const c = silentConsole();
      const rc = runUpdateCli(
        [
          '--update-core',
          manifestPath,
          '--cdn-base-url',
          'https://prod-cdn.example.net/v3-prefix',
          '--registry-path',
          t.registryPath,
        ],
        '/repo',
        {},
        c.out,
        fixedNow()
      );
      expect(rc).toBe(0);
      const doc = readDoc(t.registryPath);
      expect(doc.core!.url).toBe(
        'https://prod-cdn.example.net/v3-prefix/core/aaa1234/core.entry.js'
      );
    } finally {
      t.cleanup();
    }
  });

  it('audit-log records the asset descriptor as `after`, with `before` capturing the prior', () => {
    const t = setupWithCore();
    try {
      const manifestPath = writeBuildManifest(t.dir, 'core', 'newhash9', 'core.entry.js');
      const c = silentConsole();
      const rc = runUpdateCli(
        ['--update-core', manifestPath, '--registry-path', t.registryPath],
        '/repo',
        { REGISTRY_BASE_URL: 'http://localhost:8080' },
        c.out,
        fixedNow()
      );
      expect(rc).toBe(0);
      const log = readJson(t.historyPath) as AuditLog;
      const entry = log[log.length - 1];
      expect(entry.op).toBe('set-core');
      expect((entry.before as { url: string }).url).toBe(FIXTURE_CORE_ASSET.url);
      expect((entry.after as { url: string }).url).toBe(
        'http://localhost:8080/core/newhash9/core.entry.js'
      );
    } finally {
      t.cleanup();
    }
  });
});
