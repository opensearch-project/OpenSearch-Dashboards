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

import {
  AuditEntry,
  AuditLog,
  applyAddRollout,
  applyRemoveRollout,
  applyRemoveTenantOverride,
  applyRollback,
  applySetDefaultEntry,
  applyTenantOverride,
  checkDependencyGraph,
  isV2Mode,
  parseKeyValuePairs,
  runUpdateCliV2,
} from './update_cli_v2';
import {
  fixtureV2DefaultOnly,
  fixtureV2WithCanary,
  fixtureV2WithCanaryAndTenant,
  FIXTURE_INSPECTOR_DEFAULT,
} from './fixtures_v2';
import { coerceToV2Document } from './schema_v2';

function tmpDir(): string {
  return Fs.mkdtempSync(Path.join(Os.tmpdir(), `osd-mfe-cli-v2-${process.pid}-`));
}

function writeJson(p: string, value: unknown): void {
  Fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
}

function readJson(p: string): unknown {
  return JSON.parse(Fs.readFileSync(p, 'utf8'));
}

function silentConsole() {
  const logs: string[] = [];
  const errors: string[] = [];
  return {
    out: { log: (m: string) => logs.push(m), error: (m: string) => errors.push(m) },
    logs,
    errors,
  };
}

const FIXED_NOW = new Date('2026-06-19T12:00:00.000Z');
const fixedNow = () => FIXED_NOW;

/* ------------------------------------------------------------------------- *
 * Argument parsing
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
 * isV2Mode dispatcher
 * ------------------------------------------------------------------------- */

describe('isV2Mode()', () => {
  it('detects each v2 flag', () => {
    expect(isV2Mode(['--default-entry'])).toBe(true);
    expect(isV2Mode(['--add-rollout'])).toBe(true);
    expect(isV2Mode(['--remove-rollout'])).toBe(true);
    expect(isV2Mode(['--tenant-override'])).toBe(true);
    expect(isV2Mode(['--remove-tenant-override'])).toBe(true);
    expect(isV2Mode(['--rollback'])).toBe(true);
  });

  it('returns false for v1 modes', () => {
    expect(isV2Mode(['--plugin', 'inspector', '--version', 'v1'])).toBe(false);
    expect(isV2Mode(['--from-manifest'])).toBe(false);
  });
});

/* ------------------------------------------------------------------------- *
 * Pure mutation helpers
 * ------------------------------------------------------------------------- */

describe('applySetDefaultEntry()', () => {
  it('adds a new default entry', () => {
    const doc = fixtureV2DefaultOnly();
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
    const doc = fixtureV2DefaultOnly();
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
    expect(() => applySetDefaultEntry(fixtureV2DefaultOnly(), { version: 'v', url: 'u' })).toThrow(
      /requires id/
    );
  });
});

describe('applyAddRollout()', () => {
  it('adds a new rollout rule', () => {
    const r = applyAddRollout(fixtureV2DefaultOnly(), {
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
    const r1 = applyAddRollout(fixtureV2DefaultOnly(), {
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
      applyAddRollout(fixtureV2DefaultOnly(), {
        ruleId: 'r',
        match: 'not-json',
        override: '{}',
      })
    ).toThrow(/match is not valid JSON/);
  });
});

describe('applyRemoveRollout() / applyTenantOverride() / applyRemoveTenantOverride()', () => {
  it('removes a rollout by id', () => {
    const doc = fixtureV2WithCanary();
    const r = applyRemoveRollout(doc, { ruleId: 'inspector-canary-5pct' });
    expect(r.before).not.toBeNull();
    expect(r.after).toBeNull();
    expect(r.next.rollouts).toEqual([]);
  });

  it('throws when removing an unknown rollout', () => {
    expect(() => applyRemoveRollout(fixtureV2DefaultOnly(), { ruleId: 'no-such' })).toThrow(
      /no rollout with ruleId/
    );
  });

  it('adds a tenant override layer', () => {
    const doc = fixtureV2DefaultOnly();
    const r = applyTenantOverride(doc, {
      customerId: 'acme',
      mfeId: 'inspector',
      version: 'v_acme',
      url: 'https://x',
    });
    expect(r.next.tenantOverrides.acme.mfes.inspector.version).toBe('v_acme');
    expect(r.before).toBeNull();
  });

  it('removes a tenant override and drops the empty layer', () => {
    const doc = fixtureV2WithCanaryAndTenant();
    const r = applyRemoveTenantOverride(doc, { customerId: 'acme', mfeId: 'inspector' });
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
    const doc = fixtureV2DefaultOnly();
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
    const doc = fixtureV2DefaultOnly();
    const log: AuditLog = [];
    pushAuditEntry(log, 'set-default-entry', 'inspector', null, doc.default.mfes.inspector);
    const r = applyRollback(doc, log, 'inspector');
    expect(r.next.default.mfes.inspector).toBeUndefined();
    expect(r.after).toBeNull();
  });

  it('round-trip: rollback after rollback restores the pre-rollback state', () => {
    const doc = fixtureV2DefaultOnly();
    const vA = { ...FIXTURE_INSPECTOR_DEFAULT };
    const vB = { ...FIXTURE_INSPECTOR_DEFAULT, version: 'v_b' };
    doc.default.mfes.inspector = vB;
    const log: AuditLog = [];
    pushAuditEntry(log, 'set-default-entry', 'inspector', vA, vB);

    // First rollback: B -> A.
    const r1 = applyRollback(doc, log, 'inspector');
    pushAuditEntry(log, 'rollback', 'inspector', vB, vA);

    // Second rollback: most recent change is the rollback (before=B, after=A);
    // rolling back undoes that rollback, so we land back on B.
    const r2 = applyRollback(r1.next, log, 'inspector');
    expect(r2.next.default.mfes.inspector).toEqual(vB);
  });

  it('throws when there is no audit history for the id', () => {
    expect(() => applyRollback(fixtureV2DefaultOnly(), [], 'inspector')).toThrow(
      /no audit history/
    );
  });
});

/* ------------------------------------------------------------------------- *
 * --check-deps
 * ------------------------------------------------------------------------- */

describe('checkDependencyGraph()', () => {
  it('passes when no externals are declared', () => {
    const dir = tmpDir();
    try {
      const r = checkDependencyGraph(fixtureV2DefaultOnly(), dir, '3.5');
      expect(r.ok).toBe(true);
      expect(r.offenders).toEqual([]);
    } finally {
      Fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('passes when every value-edge peer is in the resolved set', () => {
    const dir = tmpDir();
    try {
      // inspector requires dashboard; both are in the default layer.
      writeJson(Path.join(dir, 'inspector.externals.json'), {
        requires: ['dashboard'],
        contractVersion: '3.5',
      });
      writeJson(Path.join(dir, 'dashboard.externals.json'), {
        requires: [],
        contractVersion: '3.5',
      });
      const r = checkDependencyGraph(fixtureV2DefaultOnly(), dir, '3.5');
      expect(r.ok).toBe(true);
    } finally {
      Fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects when a required peer is missing from the resolved set', () => {
    const dir = tmpDir();
    try {
      writeJson(Path.join(dir, 'inspector.externals.json'), {
        requires: ['data'], // not present in the fixture
      });
      const r = checkDependencyGraph(fixtureV2DefaultOnly(), dir, '3.5');
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
      const r = checkDependencyGraph(fixtureV2DefaultOnly(), dir, '3.5');
      expect(r.ok).toBe(false);
      expect(r.offenders[0].reason).toMatch(/contractVersion/);
    } finally {
      Fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('considers ids only present in rollouts/tenants when validating', () => {
    const dir = tmpDir();
    try {
      const doc = fixtureV2DefaultOnly();
      // A rollout that adds a NEW plugin "newcomer" which depends on an absent peer.
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
      writeJson(Path.join(dir, 'newcomer.externals.json'), {
        requires: ['nonexistent'],
      });
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
 * runUpdateCliV2 — end-to-end (atomic write + audit log)
 * ------------------------------------------------------------------------- */

describe('runUpdateCliV2() — end-to-end', () => {
  function setup(): {
    dir: string;
    registryPath: string;
    historyPath: string;
    cleanup: () => void;
  } {
    const dir = tmpDir();
    const registryPath = Path.join(dir, 'registry.json');
    writeJson(registryPath, fixtureV2DefaultOnly());
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
      const rc = runUpdateCliV2({
        argv: [
          '--default-entry',
          'id=newcomer',
          'version=n1',
          'url=https://cdn.example.com/newcomer/n1/remoteEntry.js',
          '--registry-path',
          t.registryPath,
        ],
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(0);
      const updated = coerceToV2Document(readJson(t.registryPath));
      expect(updated.default.mfes.newcomer.version).toBe('n1');
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
      runUpdateCliV2({
        argv: [
          '--default-entry',
          'id=inspector',
          'version=v_new',
          'url=https://x',
          '--registry-path',
          t.registryPath,
          '--reason',
          'rolling out new build',
        ],
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
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
      runUpdateCliV2({
        argv: args([
          '--add-rollout',
          'ruleId=c1',
          'match={"userBucketLt":5}',
          'override={"mfes":{"inspector":{"version":"c","remoteEntry":"https://x","scope":"inspector","module":"./public"}}}',
        ]),
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      let doc = coerceToV2Document(readJson(t.registryPath));
      expect(doc.rollouts.length).toBe(1);
      runUpdateCliV2({
        argv: args(['--remove-rollout', 'ruleId=c1']),
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      doc = coerceToV2Document(readJson(t.registryPath));
      expect(doc.rollouts).toEqual([]);
      const log = readJson(t.historyPath) as AuditLog;
      expect(log.map((e) => e.op)).toEqual(['add-rollout', 'remove-rollout']);
    } finally {
      t.cleanup();
    }
  });

  it('--tenant-override + --remove-tenant-override round-trip', () => {
    const t = setup();
    try {
      const c = silentConsole();
      const args = (extra: string[]) => [...extra, '--registry-path', t.registryPath];
      runUpdateCliV2({
        argv: args([
          '--tenant-override',
          'customerId=acme',
          'mfeId=inspector',
          'version=v_acme',
          'url=https://x',
        ]),
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      let doc = coerceToV2Document(readJson(t.registryPath));
      expect(doc.tenantOverrides.acme.mfes.inspector.version).toBe('v_acme');
      runUpdateCliV2({
        argv: args(['--remove-tenant-override', 'customerId=acme', 'mfeId=inspector']),
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      doc = coerceToV2Document(readJson(t.registryPath));
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

      // Set inspector to v_new (audit captures the prior "default" version).
      runUpdateCliV2({
        argv: args([
          '--default-entry',
          'id=inspector',
          'version=v_new',
          'url=https://cdn.example.com/inspector/v_new/remoteEntry.js',
        ]),
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      let doc = coerceToV2Document(readJson(t.registryPath));
      expect(doc.default.mfes.inspector.version).toBe('v_new');

      // Roll back: inspector reverts to its original version.
      runUpdateCliV2({
        argv: args(['--rollback', 'id=inspector']),
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      doc = coerceToV2Document(readJson(t.registryPath));
      expect(doc.default.mfes.inspector.version).toBe(FIXTURE_INSPECTOR_DEFAULT.version);

      const log = readJson(t.historyPath) as AuditLog;
      expect(log.map((e) => e.op)).toEqual(['set-default-entry', 'rollback']);
    } finally {
      t.cleanup();
    }
  });

  it('atomicity: a malformed mutation leaves both files unchanged', () => {
    const t = setup();
    try {
      const docBefore = readJson(t.registryPath);
      const c = silentConsole();
      // Try to add a rollout whose override.mfes is empty (validateV2 rejects).
      const rc = runUpdateCliV2({
        argv: [
          '--add-rollout',
          'ruleId=c1',
          'match={"userBucketLt":5}',
          'override={"mfes":{}}',
          '--registry-path',
          t.registryPath,
        ],
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(1);
      // Doc unchanged, history not created (atomicity).
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
      const rc = runUpdateCliV2({
        argv: [
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
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(2); // 2 = check-deps reject (distinct from generic rc=1)
      expect(c.errors.some((e) => e.includes('newcomer -> nonexistent'))).toBe(true);
      // Both files unchanged.
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
      // newcomer depends on inspector; inspector exists in default.
      writeJson(Path.join(externalsDir, 'newcomer.externals.json'), {
        requires: ['inspector'],
      });
      const c = silentConsole();
      const rc = runUpdateCliV2({
        argv: [
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
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(0);
      const doc = coerceToV2Document(readJson(t.registryPath));
      expect(doc.default.mfes.newcomer.version).toBe('n1');
    } finally {
      t.cleanup();
    }
  });

  it('auto-migrates a v1 doc on first read (e.g. canonical CDN)', () => {
    const t = setup();
    try {
      // Replace the v2 fixture with a v1 doc to exercise the auto-migration path.
      const v1 = {
        schemaVersion: 1,
        generatedAt: '2026-06-19T00:00:00.000Z',
        sharedDeps: { url: 'https://x', version: '3.5.0' },
        mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT },
      };
      writeJson(t.registryPath, v1);
      const c = silentConsole();
      const rc = runUpdateCliV2({
        argv: [
          '--default-entry',
          'id=inspector',
          'version=v_new',
          'url=https://x/v_new',
          '--registry-path',
          t.registryPath,
        ],
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(0);
      const doc = coerceToV2Document(readJson(t.registryPath));
      expect(doc.schemaVersion).toBe(2);
      expect(doc.default.mfes.inspector.version).toBe('v_new');
    } finally {
      t.cleanup();
    }
  });
});

/* ------------------------------------------------------------------------- *
 * Phase 16 Story 2 — v3 asset CLI surface
 * ------------------------------------------------------------------------- */

import { isV3AssetMode } from './update_cli_v2';
import {
  V3_ASSET_BUILD_MANIFEST_SCHEMA_VERSION,
  V3AssetBuildManifest,
  V3AssetKind,
} from './v3_asset_build';
import { fixtureV3FullyPopulated, fixtureV3MigrationOnly } from './fixtures_v3';
import { coerceToV3Document, SCHEMA_VERSION_V3 } from './schema_v3';

describe('isV3AssetMode()', () => {
  it('detects every v3-asset flag', () => {
    expect(isV3AssetMode(['--update-core'])).toBe(true);
    expect(isV3AssetMode(['--update-orchestrator'])).toBe(true);
    expect(isV3AssetMode(['--update-shared-deps-css'])).toBe(true);
    expect(isV3AssetMode(['--update-theme', 'light', 'm.json'])).toBe(true);
  });

  it('returns false for v2 flags', () => {
    expect(isV3AssetMode(['--default-entry'])).toBe(false);
    expect(isV3AssetMode(['--add-rollout'])).toBe(false);
  });

  it('isV2Mode also returns true for v3-asset flags (folded dispatcher)', () => {
    expect(isV2Mode(['--update-core'])).toBe(true);
    expect(isV2Mode(['--update-theme', 'dark', 'm.json'])).toBe(true);
  });
});

/** Build manifest at `<dir>/build-manifest.json` for assetKind+themeName. */
function writeBuildManifest(
  dir: string,
  assetKind: V3AssetKind,
  contentHash: string,
  primaryFile: string,
  themeName?: string
): string {
  const stagingDir = Path.join(dir, contentHash);
  Fs.mkdirSync(stagingDir, { recursive: true });
  Fs.writeFileSync(Path.join(stagingDir, primaryFile), 'PAYLOAD');
  const manifest: V3AssetBuildManifest = {
    schemaVersion: V3_ASSET_BUILD_MANIFEST_SCHEMA_VERSION,
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

describe('runUpdateCliV2() — v3 asset modes (Phase 16 Story 2)', () => {
  /** Setup a tmp dir with the on-disk doc at the given shape (v2 or v3). */
  function setup(
    shape: 'v2' | 'v3' = 'v2'
  ): {
    dir: string;
    registryPath: string;
    historyPath: string;
    cleanup: () => void;
  } {
    const dir = tmpDir();
    const registryPath = Path.join(dir, 'registry.json');
    writeJson(registryPath, shape === 'v2' ? fixtureV2DefaultOnly() : fixtureV3MigrationOnly());
    return {
      dir,
      registryPath,
      historyPath: `${registryPath}.history.json`,
      cleanup: () => Fs.rmSync(dir, { recursive: true, force: true }),
    };
  }

  it('--update-core: a v2 doc auto-migrates to v3 with both migrate-v2-to-v3 and set-core audit entries', () => {
    const t = setup('v2');
    try {
      const manifestPath = writeBuildManifest(t.dir, 'core', 'corehash1234', 'core.entry.js');
      const c = silentConsole();
      const rc = runUpdateCliV2({
        argv: ['--update-core', manifestPath, '--registry-path', t.registryPath],
        env: { REGISTRY_BASE_URL: 'http://localhost:8080' },
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(0);
      const doc = coerceToV3Document(readJson(t.registryPath));
      expect(doc.schemaVersion).toBe(SCHEMA_VERSION_V3);
      expect(doc.core).toBeDefined();
      expect(doc.core!.url).toBe('http://localhost:8080/core/corehash1234/core.entry.js');
      expect(doc.core!.integrity).toBe('sha384-MOCKINTEGRITY');
      expect(doc.core!.version).toBe('3.5.0+corehash1234');
      const log = readJson(t.historyPath) as AuditLog;
      expect(log.map((e) => e.op)).toEqual(['migrate-v2-to-v3', 'set-core']);
      expect(log[0].target).toBe('schemaVersion:v2->3');
      expect(log[1].target).toBe('core');
      expect(log[1].before).toBeNull();
    } finally {
      t.cleanup();
    }
  });

  it('--update-orchestrator: a v3 doc stays v3 (NO migrate-v2-to-v3 entry on re-set)', () => {
    const t = setup('v3');
    try {
      const manifestPath = writeBuildManifest(
        t.dir,
        'orchestrator',
        'orchhash1234',
        'osd_bootstrap_mfe.js'
      );
      const c = silentConsole();
      const rc = runUpdateCliV2({
        argv: ['--update-orchestrator', manifestPath, '--registry-path', t.registryPath],
        env: { REGISTRY_BASE_URL: 'http://localhost:8080' },
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(0);
      const doc = coerceToV3Document(readJson(t.registryPath));
      expect(doc.orchestrator!.url).toBe(
        'http://localhost:8080/orchestrator/orchhash1234/osd_bootstrap_mfe.js'
      );
      const log = readJson(t.historyPath) as AuditLog;
      expect(log.map((e) => e.op)).toEqual(['set-orchestrator']);
    } finally {
      t.cleanup();
    }
  });

  it('--update-theme <name>: sets themes[<name>] and audit target carries the qualified key', () => {
    const t = setup('v3');
    try {
      const manifestPath = writeBuildManifest(
        t.dir,
        'theme',
        'lighthash1234',
        'legacy_light_theme.css',
        'light'
      );
      const c = silentConsole();
      const rc = runUpdateCliV2({
        argv: ['--update-theme', 'light', manifestPath, '--registry-path', t.registryPath],
        env: { REGISTRY_BASE_URL: 'http://localhost:8080' },
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(0);
      const doc = coerceToV3Document(readJson(t.registryPath));
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

  it('--update-shared-deps-css: sets the sharedDepsCss field with the v3 audit op', () => {
    const t = setup('v3');
    try {
      const manifestPath = writeBuildManifest(
        t.dir,
        'shared-deps-css',
        'cssh1234',
        'osd-ui-shared-deps.css'
      );
      const c = silentConsole();
      const rc = runUpdateCliV2({
        argv: ['--update-shared-deps-css', manifestPath, '--registry-path', t.registryPath],
        env: { REGISTRY_BASE_URL: 'http://localhost:8080' },
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(0);
      const doc = coerceToV3Document(readJson(t.registryPath));
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
    const t = setup('v3');
    try {
      const manifestPath = writeBuildManifest(t.dir, 'core', 'wrong1234', 'core.entry.js');
      const c = silentConsole();
      const docBefore = readJson(t.registryPath);
      const rc = runUpdateCliV2({
        argv: ['--update-orchestrator', manifestPath, '--registry-path', t.registryPath],
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(1);
      expect(c.errors.some((e) => /assetKind="core"/.test(e))).toBe(true);
      // Doc and history unchanged (atomicity: the doc was never written).
      expect(readJson(t.registryPath)).toEqual(docBefore);
      expect(Fs.existsSync(t.historyPath)).toBe(false);
    } finally {
      t.cleanup();
    }
  });

  it('rejects --update-theme with a theme-name/manifest-themeName mismatch', () => {
    const t = setup('v3');
    try {
      const manifestPath = writeBuildManifest(
        t.dir,
        'theme',
        'lighthash',
        'legacy_light_theme.css',
        'light'
      );
      const c = silentConsole();
      const rc = runUpdateCliV2({
        argv: ['--update-theme', 'dark', manifestPath, '--registry-path', t.registryPath],
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(1);
      expect(c.errors.some((e) => /themeName="light"/.test(e))).toBe(true);
    } finally {
      t.cleanup();
    }
  });

  it('rejects multiple --update-* flags in a single invocation', () => {
    const t = setup('v3');
    try {
      const coreManifest = writeBuildManifest(t.dir, 'core', 'corehash', 'core.entry.js');
      const c = silentConsole();
      const rc = runUpdateCliV2({
        argv: [
          '--update-core',
          coreManifest,
          '--update-orchestrator',
          coreManifest,
          '--registry-path',
          t.registryPath,
        ],
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(1);
      expect(c.errors.some((e) => /Only one --update-\* flag/.test(e))).toBe(true);
    } finally {
      t.cleanup();
    }
  });

  it('re-signs the v3 doc when MFE_REGISTRY_SIGNING_KEY is set', () => {
    const t = setup('v3');
    try {
      const manifestPath = writeBuildManifest(t.dir, 'core', 'h1234', 'core.entry.js');
      const c = silentConsole();
      const rc = runUpdateCliV2({
        argv: ['--update-core', manifestPath, '--registry-path', t.registryPath],
        env: {
          MFE_REGISTRY_SIGNING_KEY: 'secret-key-material',
          MFE_REGISTRY_KEY_ID: 'k1',
        },
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(0);
      const docRaw = (readJson(t.registryPath) as unknown) as {
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
    const t = setup('v3');
    try {
      const manifestPath = writeBuildManifest(t.dir, 'core', 'aaa1234', 'core.entry.js');
      const c = silentConsole();
      const rc = runUpdateCliV2({
        argv: [
          '--update-core',
          manifestPath,
          '--cdn-base-url',
          'https://prod-cdn.example.net/v3-prefix',
          '--registry-path',
          t.registryPath,
        ],
        env: {},
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(0);
      const doc = coerceToV3Document(readJson(t.registryPath));
      expect(doc.core!.url).toBe(
        'https://prod-cdn.example.net/v3-prefix/core/aaa1234/core.entry.js'
      );
    } finally {
      t.cleanup();
    }
  });

  it('an audit-log v3 entry records the asset descriptor as `after`, with `before` capturing the prior', () => {
    const t = setup('v3');
    try {
      // Seed with an existing core, then replace it.
      const docPre = fixtureV3FullyPopulated();
      writeJson(t.registryPath, docPre);
      const manifestPath = writeBuildManifest(t.dir, 'core', 'newhash9', 'core.entry.js');
      const c = silentConsole();
      const rc = runUpdateCliV2({
        argv: ['--update-core', manifestPath, '--registry-path', t.registryPath],
        env: { REGISTRY_BASE_URL: 'http://localhost:8080' },
        out: c.out,
        now: fixedNow,
        osdVersion: '3.5.0',
      });
      expect(rc).toBe(0);
      const log = readJson(t.historyPath) as AuditLog;
      const entry = log[log.length - 1];
      expect(entry.op).toBe('set-core');
      expect((entry.before as { url: string }).url).toBe(docPre.core!.url);
      expect((entry.after as { url: string }).url).toBe(
        'http://localhost:8080/core/newhash9/core.entry.js'
      );
    } finally {
      t.cleanup();
    }
  });
});
