/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Fs from 'fs';
import Path from 'path';
import tempy from 'tempy';

import {
  computeFingerprint,
  deleteFingerprint,
  fingerprintsEqual,
  readFingerprint,
  writeFingerprint,
} from './bootstrap_fingerprint';

interface FakeProject {
  name: string;
  path: string;
  packageJsonLocation: string;
  isWorkspaceProject: boolean;
  isWorkspaceRoot: boolean;
}

// Minimal stand-in for OpenSearchDashboards; only the surface used by the
// fingerprint module is faked.
function fakeOsd(rootPath: string) {
  return {
    getAbsolute: (...sub: string[]) => Path.resolve(rootPath, ...sub),
    getRelative: (abs: string) => Path.relative(rootPath, abs),
  } as any;
}

function makeProject(
  rootPath: string,
  relPath: string,
  pkg: Record<string, unknown>,
  opts: { isWorkspaceProject?: boolean; isWorkspaceRoot?: boolean; lock?: string } = {}
): FakeProject {
  const projectPath = Path.join(rootPath, relPath);
  Fs.mkdirSync(projectPath, { recursive: true });
  const pkgPath = Path.join(projectPath, 'package.json');
  Fs.writeFileSync(pkgPath, JSON.stringify(pkg));
  if (opts.lock !== undefined) {
    Fs.writeFileSync(Path.join(projectPath, 'yarn.lock'), opts.lock);
  }
  return {
    name: pkg.name as string,
    path: projectPath,
    packageJsonLocation: pkgPath,
    isWorkspaceProject: !!opts.isWorkspaceProject,
    isWorkspaceRoot: !!opts.isWorkspaceRoot,
  };
}

function seedWorkspace(rootPath: string) {
  Fs.mkdirSync(rootPath, { recursive: true });
  Fs.writeFileSync(Path.join(rootPath, 'yarn.lock'), '# root lock\n');
  Fs.writeFileSync(
    Path.join(rootPath, 'package.json'),
    JSON.stringify({ name: 'opensearch-dashboards' })
  );
  // Pretend dist exists so the fingerprint has something to hash.
  const distDir = Path.join(rootPath, 'packages/osd-pm/dist');
  Fs.mkdirSync(distDir, { recursive: true });
  Fs.writeFileSync(Path.join(distDir, 'index.js'), '// fake dist\n');
}

describe('bootstrap_fingerprint', () => {
  let rootPath: string;
  let osd: any;
  let projects: Map<string, FakeProject>;

  beforeEach(() => {
    rootPath = tempy.directory();
    seedWorkspace(rootPath);
    osd = fakeOsd(rootPath);

    projects = new Map();
    projects.set(
      'opensearch-dashboards',
      makeProject(rootPath, '.', { name: 'opensearch-dashboards' }, { isWorkspaceRoot: true })
    );
    projects.set(
      '@osd/pkg-a',
      makeProject(
        rootPath,
        'packages/pkg-a',
        { name: '@osd/pkg-a', version: '1.0.0' },
        { isWorkspaceProject: true }
      )
    );
    projects.set(
      'plugin-one',
      makeProject(
        rootPath,
        'plugins/plugin-one',
        { name: 'plugin-one', version: '1.0.0' },
        { lock: '# plugin-one lock v1\n' }
      )
    );
  });

  it('fingerprintsEqual returns true for identical inputs', () => {
    const a = computeFingerprint(osd, projects as any);
    const b = computeFingerprint(osd, projects as any);
    expect(fingerprintsEqual(a, b)).toBe(true);
  });

  it('detects a root yarn.lock change', () => {
    const before = computeFingerprint(osd, projects as any);
    Fs.writeFileSync(Path.join(rootPath, 'yarn.lock'), '# root lock v2\n');
    const after = computeFingerprint(osd, projects as any);
    expect(fingerprintsEqual(before, after)).toBe(false);
    expect(before.rootLockfile).not.toEqual(after.rootLockfile);
  });

  it('detects a project package.json change', () => {
    const before = computeFingerprint(osd, projects as any);
    Fs.writeFileSync(
      projects.get('@osd/pkg-a')!.packageJsonLocation,
      JSON.stringify({ name: '@osd/pkg-a', version: '2.0.0' })
    );
    const after = computeFingerprint(osd, projects as any);
    expect(before.projectManifests).not.toEqual(after.projectManifests);
  });

  it('detects an external plugin yarn.lock change', () => {
    const before = computeFingerprint(osd, projects as any);
    const pluginPath = projects.get('plugin-one')!.path;
    Fs.writeFileSync(Path.join(pluginPath, 'yarn.lock'), '# plugin-one lock v2\n');
    const after = computeFingerprint(osd, projects as any);
    expect(before.externalPluginLockfiles).not.toEqual(after.externalPluginLockfiles);
  });

  it('detects a newly cloned external plugin', () => {
    // Simulates the "clone OSD, bootstrap, clone plugins, bootstrap" workflow:
    // a new plugin appearing under plugins/ between runs must invalidate the
    // fingerprint so its install/build actually happens.
    const before = computeFingerprint(osd, projects as any);
    const withNewPlugin = new Map(projects);
    withNewPlugin.set(
      'plugin-two',
      makeProject(
        rootPath,
        'plugins/plugin-two',
        { name: 'plugin-two', version: '1.0.0' },
        { lock: '# plugin-two lock\n' }
      )
    );
    const after = computeFingerprint(osd, withNewPlugin as any);
    expect(fingerprintsEqual(before, after)).toBe(false);
    expect(before.projectManifests).not.toEqual(after.projectManifests);
    expect(before.externalPluginLockfiles).not.toEqual(after.externalPluginLockfiles);
  });

  it('ignores workspace-project yarn.lock files (they are symlinks to root)', () => {
    const pkgA = projects.get('@osd/pkg-a')!;
    Fs.writeFileSync(Path.join(pkgA.path, 'yarn.lock'), '# workspace pkg lock\n');
    const before = computeFingerprint(osd, projects as any);
    Fs.writeFileSync(Path.join(pkgA.path, 'yarn.lock'), '# workspace pkg lock v2\n');
    const after = computeFingerprint(osd, projects as any);
    expect(before.externalPluginLockfiles).toEqual(after.externalPluginLockfiles);
  });

  it('detects an osd-pm/dist/index.js change', () => {
    const before = computeFingerprint(osd, projects as any);
    Fs.writeFileSync(Path.join(rootPath, 'packages/osd-pm/dist/index.js'), '// fake dist v2\n');
    const after = computeFingerprint(osd, projects as any);
    expect(before.osdPmDist).not.toEqual(after.osdPmDist);
  });

  it('captures the yarn version from npm_config_user_agent when available', () => {
    const prev = process.env.npm_config_user_agent;
    try {
      process.env.npm_config_user_agent = 'yarn/1.22.19 npm/? node/v22.22.0 darwin arm64';
      const a = computeFingerprint(osd, projects as any);
      process.env.npm_config_user_agent = 'yarn/1.22.22 npm/? node/v22.22.0 darwin arm64';
      const b = computeFingerprint(osd, projects as any);
      expect(a.yarnVersion).toEqual('1.22.19');
      expect(b.yarnVersion).toEqual('1.22.22');
      expect(fingerprintsEqual(a, b)).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.npm_config_user_agent;
      else process.env.npm_config_user_agent = prev;
    }
  });

  it('falls back to an empty yarn version when npm_config_user_agent is unset', () => {
    const prev = process.env.npm_config_user_agent;
    try {
      delete process.env.npm_config_user_agent;
      const fp = computeFingerprint(osd, projects as any);
      expect(fp.yarnVersion).toEqual('');
    } finally {
      if (prev !== undefined) process.env.npm_config_user_agent = prev;
    }
  });

  it('is stable regardless of ProjectMap insertion order', () => {
    const a = computeFingerprint(osd, projects as any);

    const reordered = new Map<string, FakeProject>();
    reordered.set('plugin-one', projects.get('plugin-one')!);
    reordered.set('opensearch-dashboards', projects.get('opensearch-dashboards')!);
    reordered.set('@osd/pkg-a', projects.get('@osd/pkg-a')!);

    const b = computeFingerprint(osd, reordered as any);
    expect(fingerprintsEqual(a, b)).toBe(true);
  });

  it('round-trips through write/read', () => {
    const written = computeFingerprint(osd, projects as any);
    writeFingerprint(osd, written);
    const restored = readFingerprint(osd);
    expect(restored).not.toBeNull();
    expect(fingerprintsEqual(written, restored!)).toBe(true);
  });

  it('readFingerprint returns null when file is missing', () => {
    expect(readFingerprint(osd)).toBeNull();
  });

  it('readFingerprint returns null for version mismatch', () => {
    const fp = computeFingerprint(osd, projects as any);
    const mutated = { ...fp, version: 999 };
    Fs.writeFileSync(Path.join(rootPath, '.osd-bootstrap-fingerprint'), JSON.stringify(mutated));
    expect(readFingerprint(osd)).toBeNull();
  });

  it('readFingerprint returns null for corrupt JSON', () => {
    Fs.writeFileSync(Path.join(rootPath, '.osd-bootstrap-fingerprint'), '{not json');
    expect(readFingerprint(osd)).toBeNull();
  });

  it('deleteFingerprint removes the file and tolerates a missing file', () => {
    const fp = computeFingerprint(osd, projects as any);
    writeFingerprint(osd, fp);
    expect(readFingerprint(osd)).not.toBeNull();
    deleteFingerprint(osd);
    expect(readFingerprint(osd)).toBeNull();
    // Calling again with the file already gone must not throw.
    expect(() => deleteFingerprint(osd)).not.toThrow();
  });

  it('treats a missing root yarn.lock as stable empty (does not throw)', () => {
    Fs.unlinkSync(Path.join(rootPath, 'yarn.lock'));
    const a = computeFingerprint(osd, projects as any);
    const b = computeFingerprint(osd, projects as any);
    expect(fingerprintsEqual(a, b)).toBe(true);
  });

  it('treats a missing osd-pm/dist/index.js as stable empty (does not throw)', () => {
    Fs.unlinkSync(Path.join(rootPath, 'packages/osd-pm/dist/index.js'));
    const a = computeFingerprint(osd, projects as any);
    const b = computeFingerprint(osd, projects as any);
    expect(fingerprintsEqual(a, b)).toBe(true);
  });

  it('treats a missing project package.json as stable empty (does not throw)', () => {
    Fs.unlinkSync(projects.get('@osd/pkg-a')!.packageJsonLocation);
    const a = computeFingerprint(osd, projects as any);
    const b = computeFingerprint(osd, projects as any);
    expect(fingerprintsEqual(a, b)).toBe(true);
  });

  it('readFingerprint returns null when required string fields are missing', () => {
    const partial = { version: 1, rootLockfile: 'abc' }; // missing other fields
    Fs.writeFileSync(Path.join(rootPath, '.osd-bootstrap-fingerprint'), JSON.stringify(partial));
    expect(readFingerprint(osd)).toBeNull();
  });

  it('normalizes path separators so fingerprints are platform-stable', () => {
    // Simulate a Windows-style getRelative() return value; the module should
    // produce the same hash as it would for POSIX separators.
    const a = computeFingerprint(osd, projects as any);

    const winOsd = {
      getAbsolute: (...sub: string[]) => Path.resolve(rootPath, ...sub),
      getRelative: (abs: string) => Path.relative(rootPath, abs).split(Path.sep).join('\\'),
    } as any;
    const b = computeFingerprint(winOsd, projects as any);

    expect(a.projectManifests).toEqual(b.projectManifests);
    expect(a.externalPluginLockfiles).toEqual(b.externalPluginLockfiles);
  });
});
