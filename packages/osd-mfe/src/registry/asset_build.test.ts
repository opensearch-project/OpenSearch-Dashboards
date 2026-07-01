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
 * Tests for the v3 asset build/staging pipeline (global asset staging).
 *
 * Coverage:
 *  - stageAsset for each kind (core, orchestrator, theme, shared-deps-css):
 *    correct content hash, integrity, version, staging dir layout, build
 *    manifest emission.
 *  - Idempotency: re-staging the same source bytes yields the same hash + dir.
 *  - Determinism: a 1-byte change to the source changes the contentHash +
 *    integrity but leaves the version prefix intact.
 *  - readAssetBuildManifest accepts valid manifests + rejects every shape
 *    violation.
 *  - manifestToAssetDescriptor builds the CDN-shaped URL for each asset kind.
 *  - defaultSourcePath + defaultTargetRoot resolve the expected paths.
 *  - Error path: source artifact missing.
 */

import { createHash } from 'crypto';
import Fs from 'fs';
import Os from 'os';
import Path from 'path';

import {
  ASSET_BUILD_MANIFEST_SCHEMA_VERSION,
  AssetBuildManifest,
  AssetKind,
  defaultSourcePath,
  defaultTargetRoot,
  manifestToAssetDescriptor,
  readAssetBuildManifest,
  stageAsset,
} from './asset_build';
import { computeIntegrity } from './generate';

function tmpRepo(): { root: string; cleanup: () => void } {
  const root = Fs.mkdtempSync(Path.join(Os.tmpdir(), `osd-mfe-v3-asset-build-${process.pid}-`));
  Fs.writeFileSync(Path.join(root, 'package.json'), JSON.stringify({ version: '3.5.0' }), 'utf8');
  return {
    root,
    cleanup: () => Fs.rmSync(root, { recursive: true, force: true }),
  };
}

/** Place a source file at the canonical default path for an asset kind. */
function writeSource(
  root: string,
  assetKind: AssetKind,
  themeName: string | undefined,
  bytes: Buffer
): string {
  const target = defaultSourcePath(root, assetKind, themeName);
  Fs.mkdirSync(Path.dirname(target), { recursive: true });
  Fs.writeFileSync(target, bytes);
  return target;
}

const FIXED_NOW = new Date('2026-06-26T12:00:00.000Z');

describe('stageAsset() — per-kind staging', () => {
  it('stages a core artifact with sha256[:12] + sha384 SRI + build-manifest.json', () => {
    const { root, cleanup } = tmpRepo();
    try {
      const bytes = Buffer.from('CORE_ENTRY_PAYLOAD');
      writeSource(root, 'core', undefined, bytes);
      const m = stageAsset({ repoRoot: root, assetKind: 'core', now: FIXED_NOW });

      const expectedHash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
      expect(m.assetKind).toBe('core');
      expect(m.contentHash).toBe(expectedHash);
      expect(m.integrity).toBe(computeIntegrity(bytes));
      expect(m.version).toBe(`3.5.0+${expectedHash}`);
      expect(m.primaryFile).toBe('core.entry.js');
      expect(m.generatedAt).toBe(FIXED_NOW.toISOString());
      expect(m.schemaVersion).toBe(ASSET_BUILD_MANIFEST_SCHEMA_VERSION);
      expect(m.themeName).toBeUndefined();

      // Staged file present + manifest sibling written.
      const staged = Path.join(m.stagingDir, 'core.entry.js');
      expect(Fs.readFileSync(staged)).toEqual(bytes);
      const manifestOnDisk = JSON.parse(
        Fs.readFileSync(Path.join(m.stagingDir, 'build-manifest.json'), 'utf8')
      );
      expect(manifestOnDisk).toEqual(m);

      // Staging dir under target/mfe-core/<hash>.
      expect(m.stagingDir).toBe(Path.join(root, 'target', 'mfe-core', expectedHash));
    } finally {
      cleanup();
    }
  });

  it('stages an orchestrator artifact under target/mfe-bootstrap/<hash>/', () => {
    const { root, cleanup } = tmpRepo();
    try {
      const bytes = Buffer.from('ORCHESTRATOR_PAYLOAD');
      writeSource(root, 'orchestrator', undefined, bytes);
      const m = stageAsset({ repoRoot: root, assetKind: 'orchestrator', now: FIXED_NOW });
      expect(m.assetKind).toBe('orchestrator');
      expect(m.primaryFile).toBe('osd_bootstrap_mfe.js');
      expect(m.stagingDir).toBe(Path.join(root, 'target', 'mfe-bootstrap', m.contentHash));
      const staged = Path.join(m.stagingDir, 'osd_bootstrap_mfe.js');
      expect(Fs.readFileSync(staged)).toEqual(bytes);
    } finally {
      cleanup();
    }
  });

  it('stages a theme (light) artifact under target/mfe-themes/light/<hash>/', () => {
    const { root, cleanup } = tmpRepo();
    try {
      const bytes = Buffer.from('.light { color: black; }');
      writeSource(root, 'theme', 'light', bytes);
      const m = stageAsset({
        repoRoot: root,
        assetKind: 'theme',
        themeName: 'light',
        now: FIXED_NOW,
      });
      expect(m.assetKind).toBe('theme');
      expect(m.themeName).toBe('light');
      expect(m.primaryFile).toBe('legacy_light_theme.css');
      expect(m.stagingDir).toBe(Path.join(root, 'target', 'mfe-themes', 'light', m.contentHash));
    } finally {
      cleanup();
    }
  });

  it('stages a shared-deps-css artifact under target/mfe-shared-deps-css/<hash>/', () => {
    const { root, cleanup } = tmpRepo();
    try {
      const bytes = Buffer.from('body { font: 14px sans-serif; }');
      writeSource(root, 'shared-deps-css', undefined, bytes);
      const m = stageAsset({
        repoRoot: root,
        assetKind: 'shared-deps-css',
        now: FIXED_NOW,
      });
      expect(m.assetKind).toBe('shared-deps-css');
      expect(m.primaryFile).toBe('osd-ui-shared-deps.css');
      expect(m.stagingDir).toBe(Path.join(root, 'target', 'mfe-shared-deps-css', m.contentHash));
    } finally {
      cleanup();
    }
  });

  it('is idempotent: re-staging the same bytes yields the same hash + dir', () => {
    const { root, cleanup } = tmpRepo();
    try {
      writeSource(root, 'core', undefined, Buffer.from('ABC123'));
      const a = stageAsset({ repoRoot: root, assetKind: 'core', now: FIXED_NOW });
      const b = stageAsset({ repoRoot: root, assetKind: 'core', now: FIXED_NOW });
      expect(b.contentHash).toBe(a.contentHash);
      expect(b.integrity).toBe(a.integrity);
      expect(b.stagingDir).toBe(a.stagingDir);
    } finally {
      cleanup();
    }
  });

  it('a 1-byte change in source changes contentHash and integrity but keeps the version prefix', () => {
    const { root, cleanup } = tmpRepo();
    try {
      writeSource(root, 'core', undefined, Buffer.from('VERSION_A'));
      const a = stageAsset({ repoRoot: root, assetKind: 'core', now: FIXED_NOW });
      writeSource(root, 'core', undefined, Buffer.from('VERSION_B'));
      const b = stageAsset({ repoRoot: root, assetKind: 'core', now: FIXED_NOW });
      expect(b.contentHash).not.toBe(a.contentHash);
      expect(b.integrity).not.toBe(a.integrity);
      expect(b.version.startsWith('3.5.0+')).toBe(true);
      expect(a.version.startsWith('3.5.0+')).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('rejects an absent source artifact with a clear, remediation-friendly message', () => {
    const { root, cleanup } = tmpRepo();
    try {
      expect(() => stageAsset({ repoRoot: root, assetKind: 'core', now: FIXED_NOW })).toThrow(
        /source artifact not found/
      );
    } finally {
      cleanup();
    }
  });

  it('rejects a theme call without themeName', () => {
    const { root, cleanup } = tmpRepo();
    try {
      expect(() => stageAsset({ repoRoot: root, assetKind: 'theme', now: FIXED_NOW })).toThrow(
        /themeName is required/
      );
    } finally {
      cleanup();
    }
  });

  it('honors --target-root overrides (used by the harness deploy flow)', () => {
    const { root, cleanup } = tmpRepo();
    try {
      const bytes = Buffer.from('OVERRIDE');
      writeSource(root, 'core', undefined, bytes);
      const altRoot = Path.join(root, 'alt-target');
      const m = stageAsset({
        repoRoot: root,
        assetKind: 'core',
        targetRoot: altRoot,
        now: FIXED_NOW,
      });
      expect(m.stagingDir.startsWith(altRoot)).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('honors --source overrides (so tests do not need the conventional layout)', () => {
    const { root, cleanup } = tmpRepo();
    try {
      const alt = Path.join(root, 'alt-source.js');
      Fs.writeFileSync(alt, Buffer.from('ALT'));
      const m = stageAsset({
        repoRoot: root,
        assetKind: 'core',
        sourcePath: alt,
        now: FIXED_NOW,
      });
      expect(m.contentHash).toBe(
        createHash('sha256').update(Buffer.from('ALT')).digest('hex').slice(0, 12)
      );
    } finally {
      cleanup();
    }
  });
});

describe('defaultSourcePath() / defaultTargetRoot()', () => {
  const root = '/r';

  it('returns the canonical core paths', () => {
    expect(defaultSourcePath(root, 'core')).toBe(
      Path.join('/r', 'src', 'core', 'target', 'public', 'core.entry.js')
    );
    expect(defaultTargetRoot(root, 'core')).toBe(Path.join('/r', 'target', 'mfe-core'));
  });

  it('returns the canonical orchestrator paths', () => {
    expect(defaultSourcePath(root, 'orchestrator')).toBe(
      Path.join('/r', 'target', 'mfe-bootstrap', 'osd_bootstrap_mfe.js')
    );
    expect(defaultTargetRoot(root, 'orchestrator')).toBe(
      Path.join('/r', 'target', 'mfe-bootstrap')
    );
  });

  it('returns the canonical theme paths', () => {
    expect(defaultSourcePath(root, 'theme', 'light')).toBe(
      Path.join('/r', 'src', 'core', 'server', 'core_app', 'assets', 'legacy_light_theme.css')
    );
    expect(defaultTargetRoot(root, 'theme', 'dark')).toBe(
      Path.join('/r', 'target', 'mfe-themes', 'dark')
    );
  });

  it('returns the canonical shared-deps-css paths', () => {
    expect(defaultSourcePath(root, 'shared-deps-css')).toBe(
      Path.join('/r', 'packages', 'osd-ui-shared-deps', 'target', 'osd-ui-shared-deps.css')
    );
    expect(defaultTargetRoot(root, 'shared-deps-css')).toBe(
      Path.join('/r', 'target', 'mfe-shared-deps-css')
    );
  });

  it('throws when theme paths are requested without a themeName', () => {
    expect(() => defaultSourcePath(root, 'theme')).toThrow(/themeName is required/);
    expect(() => defaultTargetRoot(root, 'theme')).toThrow(/themeName is required/);
  });
});

describe('readAssetBuildManifest()', () => {
  function writeManifest(value: unknown): string {
    const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'osd-mfe-rm-'));
    const p = Path.join(dir, 'build-manifest.json');
    Fs.writeFileSync(p, JSON.stringify(value, null, 2));
    return p;
  }

  it('accepts a well-formed v3 asset manifest', () => {
    const m: AssetBuildManifest = {
      schemaVersion: ASSET_BUILD_MANIFEST_SCHEMA_VERSION,
      generatedAt: '2026-06-26T12:00:00.000Z',
      assetKind: 'core',
      contentHash: 'abc123def456',
      integrity: 'sha384-deadbeef',
      version: '3.5.0+abc123def456',
      stagingDir: '/tmp/whatever',
      primaryFile: 'core.entry.js',
      files: [{ localPath: '/tmp/whatever/core.entry.js', relativePath: 'core.entry.js' }],
    };
    const p = writeManifest(m);
    expect(readAssetBuildManifest(p)).toEqual(m);
  });

  it('rejects wrong schemaVersion', () => {
    const p = writeManifest({ schemaVersion: 99 });
    expect(() => readAssetBuildManifest(p)).toThrow(/schemaVersion must equal 1/);
  });

  it('rejects an unknown assetKind', () => {
    const p = writeManifest({
      schemaVersion: 1,
      assetKind: 'somethingelse',
      contentHash: 'h',
      integrity: 'sha384-x',
      version: 'v',
      stagingDir: '/tmp',
      primaryFile: 'f',
      files: [{ localPath: '/tmp/f', relativePath: 'f' }],
      generatedAt: '2026-06-26T12:00:00.000Z',
    });
    expect(() => readAssetBuildManifest(p)).toThrow(/assetKind must be/);
  });

  it('rejects an integrity without sha384- prefix', () => {
    const p = writeManifest({
      schemaVersion: 1,
      assetKind: 'core',
      contentHash: 'h',
      integrity: 'sha256-evil',
      version: 'v',
      stagingDir: '/tmp',
      primaryFile: 'core.entry.js',
      files: [{ localPath: '/tmp/f', relativePath: 'f' }],
      generatedAt: '2026-06-26T12:00:00.000Z',
    });
    expect(() => readAssetBuildManifest(p)).toThrow(/integrity must start with "sha384-"/);
  });

  it('rejects a theme manifest without themeName', () => {
    const p = writeManifest({
      schemaVersion: 1,
      assetKind: 'theme',
      contentHash: 'h',
      integrity: 'sha384-x',
      version: 'v',
      stagingDir: '/tmp',
      primaryFile: 'legacy_light_theme.css',
      files: [{ localPath: '/tmp/f', relativePath: 'f' }],
      generatedAt: '2026-06-26T12:00:00.000Z',
    });
    expect(() => readAssetBuildManifest(p)).toThrow(/themeName must be a non-empty string/);
  });

  it('rejects an empty files array', () => {
    const p = writeManifest({
      schemaVersion: 1,
      assetKind: 'core',
      contentHash: 'h',
      integrity: 'sha384-x',
      version: 'v',
      stagingDir: '/tmp',
      primaryFile: 'core.entry.js',
      files: [],
      generatedAt: '2026-06-26T12:00:00.000Z',
    });
    expect(() => readAssetBuildManifest(p)).toThrow(/files must be a non-empty array/);
  });

  it('rejects malformed JSON with a parser-derived message', () => {
    const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'osd-mfe-rm-'));
    const p = Path.join(dir, 'build-manifest.json');
    Fs.writeFileSync(p, '{ not valid json');
    expect(() => readAssetBuildManifest(p)).toThrow(/malformed JSON/);
  });
});

describe('manifestToAssetDescriptor()', () => {
  function fixtureManifest(overrides: Partial<AssetBuildManifest> = {}): AssetBuildManifest {
    return {
      schemaVersion: ASSET_BUILD_MANIFEST_SCHEMA_VERSION,
      generatedAt: '2026-06-26T12:00:00.000Z',
      assetKind: 'core',
      contentHash: 'abc123def456',
      integrity: 'sha384-deadbeef',
      version: '3.5.0+abc123def456',
      stagingDir: '/tmp/whatever',
      primaryFile: 'core.entry.js',
      files: [{ localPath: '/tmp/whatever/core.entry.js', relativePath: 'core.entry.js' }],
      ...overrides,
    };
  }

  it('builds the canonical core URL', () => {
    const d = manifestToAssetDescriptor(fixtureManifest(), 'http://localhost:8080');
    expect(d.url).toBe('http://localhost:8080/core/abc123def456/core.entry.js');
    expect(d.integrity).toBe('sha384-deadbeef');
    expect(d.version).toBe('3.5.0+abc123def456');
  });

  it('builds the canonical orchestrator URL', () => {
    const d = manifestToAssetDescriptor(
      fixtureManifest({ assetKind: 'orchestrator', primaryFile: 'osd_bootstrap_mfe.js' }),
      'https://cdn.example.com/mfe'
    );
    expect(d.url).toBe(
      'https://cdn.example.com/mfe/orchestrator/abc123def456/osd_bootstrap_mfe.js'
    );
  });

  it('builds the canonical theme URL', () => {
    const d = manifestToAssetDescriptor(
      fixtureManifest({
        assetKind: 'theme',
        themeName: 'dark',
        primaryFile: 'legacy_dark_theme.css',
      }),
      'https://cdn.example.com/mfe/'
    );
    // Trailing slashes on baseUrl are normalised.
    expect(d.url).toBe(
      'https://cdn.example.com/mfe/themes/dark/abc123def456/legacy_dark_theme.css'
    );
  });

  it('builds the canonical shared-deps-css URL', () => {
    const d = manifestToAssetDescriptor(
      fixtureManifest({
        assetKind: 'shared-deps-css',
        primaryFile: 'osd-ui-shared-deps.css',
      }),
      'https://cdn.example.com/mfe'
    );
    expect(d.url).toBe(
      'https://cdn.example.com/mfe/shared-deps/css/abc123def456/osd-ui-shared-deps.css'
    );
  });
});
