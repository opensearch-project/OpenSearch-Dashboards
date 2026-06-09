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

import { SCHEMA_VERSION, Registry, MfeEntry, validate } from './schema';
import { FileRegistryProvider } from './provider';
import { resolve } from './resolve';
import {
  runUpdateCli,
  resolveRegistryPath,
  buildRegistryFromManifest,
  UpdateCliConsole,
} from './update_cli';

/** Build a minimal, valid registry with `inspector` pinned to `version`. */
function registryWith(version: string, integrity?: string): Registry {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: '2026-06-08T00:00:00.000Z',
    sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '3.5.0' },
    mfes: {
      inspector: {
        version,
        remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
        scope: 'inspector',
        module: './public',
        ...(integrity !== undefined ? { integrity } : {}),
      },
    },
  };
}

/** A console that captures log/error lines for assertions. */
function captureConsole(): UpdateCliConsole & { logs: string[]; errors: string[] } {
  const logs: string[] = [];
  const errors: string[] = [];
  return {
    logs,
    errors,
    log: (message: string) => logs.push(message),
    error: (message: string) => errors.push(message),
  };
}

/** Create a unique temp dir for a test and return its absolute path. */
function makeTempDir(): string {
  return Fs.mkdtempSync(Path.join(Os.tmpdir(), 'mfe-update-cli-'));
}

describe('resolveRegistryPath', () => {
  it('uses --registry-path over the env var', () => {
    const path = resolveRegistryPath(['--registry-path', '/explicit/arg.json'], {
      MFE_REGISTRY_PATH: '/from/env.json',
    });
    expect(path).toBe('/explicit/arg.json');
  });

  it('falls back to MFE_REGISTRY_PATH when no arg is given', () => {
    const path = resolveRegistryPath([], { MFE_REGISTRY_PATH: '/from/env.json' });
    expect(path).toBe('/from/env.json');
  });

  it('throws when neither arg nor env provides a path', () => {
    expect(() => resolveRegistryPath([], {})).toThrow(/No registry path/);
  });
});

describe('runUpdateCli — --help', () => {
  it('prints usage and exits 0', () => {
    const out = captureConsole();
    const code = runUpdateCli(['--help'], '/repo', {}, out);
    expect(code).toBe(0);
    expect(out.logs.join('\n')).toContain('Usage: node scripts/update_registry');
  });
});

describe('runUpdateCli — single-plugin patch', () => {
  let dir: string;
  let registryPath: string;

  beforeEach(() => {
    dir = makeTempDir();
    registryPath = Path.join(dir, 'registry.json');
    // Seed an entry that HAS an integrity hash so we can prove it is dropped.
    Fs.writeFileSync(
      registryPath,
      `${JSON.stringify(registryWith('3.5.0+old', 'sha384-OLDHASH'), null, 2)}\n`,
      'utf8'
    );
  });

  afterEach(() => {
    Fs.rmSync(dir, { recursive: true, force: true });
  });

  it('patches version + url, drops integrity, and still validates', () => {
    const out = captureConsole();
    const code = runUpdateCli(
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
      out,
      new Date('2026-07-01T12:00:00.000Z')
    );

    expect(code).toBe(0);

    const written = JSON.parse(Fs.readFileSync(registryPath, 'utf8')) as Registry;
    expect(validate(written).valid).toBe(true);
    expect(written.mfes.inspector.version).toBe('3.5.0+new');
    expect(written.mfes.inspector.remoteEntry).toBe(
      'http://cdn.example/mfe/inspector/remoteEntry.js'
    );
    // integrity no longer matches manual data -> dropped.
    expect(written.mfes.inspector.integrity).toBeUndefined();
    // unchanged fields preserved.
    expect(written.mfes.inspector.scope).toBe('inspector');
    expect(written.mfes.inspector.module).toBe('./public');
    // generatedAt bumped to the injected timestamp.
    expect(written.generatedAt).toBe('2026-07-01T12:00:00.000Z');
  });

  it('patches version only, leaving the existing url intact', () => {
    const out = captureConsole();
    const code = runUpdateCli(
      ['--registry-path', registryPath, '--plugin', 'inspector', '--version', '3.5.0+v2'],
      '/repo',
      {},
      out
    );

    expect(code).toBe(0);
    const written = JSON.parse(Fs.readFileSync(registryPath, 'utf8')) as Registry;
    expect(written.mfes.inspector.version).toBe('3.5.0+v2');
    expect(written.mfes.inspector.remoteEntry).toBe(
      'http://localhost:8080/mfe/inspector/remoteEntry.js'
    );
  });

  it('fails when --plugin is given without --version or --url', () => {
    const out = captureConsole();
    const code = runUpdateCli(
      ['--registry-path', registryPath, '--plugin', 'inspector'],
      '/repo',
      {},
      out
    );
    expect(code).toBe(1);
    expect(out.errors.join('\n')).toMatch(/requires at least one of --version/);
  });

  it('fails for an unknown plugin id', () => {
    const out = captureConsole();
    const code = runUpdateCli(
      ['--registry-path', registryPath, '--plugin', 'does-not-exist', '--version', 'x'],
      '/repo',
      {},
      out
    );
    expect(code).toBe(1);
    expect(out.errors.join('\n')).toMatch(/No registry entry for plugin "does-not-exist"/);
  });
});

describe('runUpdateCli — full regen', () => {
  let repoRoot: string;
  let registryPath: string;

  beforeEach(() => {
    const dir = makeTempDir();
    repoRoot = Path.join(dir, 'repo');
    registryPath = Path.join(dir, 'registry.json');

    // Minimal fake repo: package.json (osdVersion) + two built remotes.
    Fs.mkdirSync(repoRoot, { recursive: true });
    Fs.writeFileSync(Path.join(repoRoot, 'package.json'), JSON.stringify({ version: '9.9.9' }));
    for (const id of ['inspector', 'discover']) {
      const remoteDir = Path.join(repoRoot, 'target', 'mfe', id);
      Fs.mkdirSync(remoteDir, { recursive: true });
      Fs.writeFileSync(Path.join(remoteDir, 'remoteEntry.js'), `/* remote ${id} */`);
    }
  });

  afterEach(() => {
    Fs.rmSync(Path.dirname(repoRoot), { recursive: true, force: true });
  });

  it('regenerates a valid registry for all built remotes with the given --base-url', () => {
    const out = captureConsole();
    const code = runUpdateCli(
      ['--registry-path', registryPath, '--base-url', 'http://cdn.example'],
      repoRoot,
      {},
      out
    );

    expect(code).toBe(0);
    const written = JSON.parse(Fs.readFileSync(registryPath, 'utf8')) as Registry;
    expect(validate(written).valid).toBe(true);
    expect(Object.keys(written.mfes).sort()).toEqual(['discover', 'inspector']);
    // base-url honored; version is content-hash-derived (DATA), prefixed by osdVersion.
    expect(written.mfes.inspector.remoteEntry).toBe(
      'http://cdn.example/mfe/inspector/remoteEntry.js'
    );
    expect(written.mfes.inspector.version).toMatch(/^9\.9\.9\+[0-9a-f]{12}$/);
    expect(written.mfes.inspector.integrity).toMatch(/^sha384-/);
  });

  it('honors REGISTRY_BASE_URL from env when --base-url is absent', () => {
    const out = captureConsole();
    const code = runUpdateCli(
      ['--registry-path', registryPath],
      repoRoot,
      { REGISTRY_BASE_URL: 'http://env-origin' },
      out
    );

    expect(code).toBe(0);
    const written = JSON.parse(Fs.readFileSync(registryPath, 'utf8')) as Registry;
    expect(written.mfes.inspector.remoteEntry).toBe(
      'http://env-origin/mfe/inspector/remoteEntry.js'
    );
  });
});

/** A minimal valid deploy-manifest.json object (the subset the writer reads). */
function manifestWith(
  inspectorVersion: string,
  inspectorCdnUrl = 'https://cdn.example/mfe/inspector/abc123def456/remoteEntry.js'
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

describe('buildRegistryFromManifest', () => {
  const now = new Date('2026-07-01T12:00:00.000Z');

  it('repoints remoteEntry/sharedDeps at the CDN URLs and derives scope/module', () => {
    const registry = buildRegistryFromManifest(manifestWith('3.5.0+abc123def456'), now);

    expect(validate(registry).valid).toBe(true);
    // Manifest mfes are sorted by id.
    expect(Object.keys(registry.mfes)).toEqual(['discover', 'inspector']);
    expect(registry.mfes.inspector.remoteEntry).toBe(
      'https://cdn.example/mfe/inspector/abc123def456/remoteEntry.js'
    );
    expect(registry.mfes.inspector.version).toBe('3.5.0+abc123def456');
    // Canonical values derived when there is no prior entry.
    expect(registry.mfes.inspector.scope).toBe('osdMfe_inspector');
    expect(registry.mfes.inspector.module).toBe('./public');
    // No prior registry -> no SRI carried.
    expect(registry.mfes.inspector.integrity).toBeUndefined();
    // sharedDeps repointed at the CDN.
    expect(registry.sharedDeps.url).toBe('https://cdn.example/mfe/shared-deps/3.5.0/');
    expect(registry.sharedDeps.version).toBe('3.5.0');
    expect(registry.generatedAt).toBe('2026-07-01T12:00:00.000Z');
  });

  it('carries SRI + scope/module from the prior entry when the version matches', () => {
    const priorMfes: Record<string, MfeEntry> = {
      inspector: {
        version: '3.5.0+abc123def456',
        remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
        scope: 'osdMfe_inspector',
        module: './public',
        integrity: 'sha384-KEEPME',
      },
    };
    const registry = buildRegistryFromManifest(manifestWith('3.5.0+abc123def456'), now, priorMfes);

    // Same content hash (version) -> SRI still valid against the CDN bytes.
    expect(registry.mfes.inspector.integrity).toBe('sha384-KEEPME');
    expect(registry.mfes.inspector.scope).toBe('osdMfe_inspector');
    expect(registry.mfes.inspector.module).toBe('./public');
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
    const registry = buildRegistryFromManifest(manifestWith('3.5.0+abc123def456'), now, priorMfes);

    expect(registry.mfes.inspector.integrity).toBeUndefined();
  });
});

describe('runUpdateCli — --from-manifest', () => {
  let dir: string;
  let registryPath: string;
  let manifestPath: string;

  beforeEach(() => {
    dir = makeTempDir();
    registryPath = Path.join(dir, 'registry.json');
    manifestPath = Path.join(dir, 'deploy-manifest.json');
    // A current LOCAL registry whose inspector pins the SAME content hash as the
    // manifest, so its SRI must be carried forward to the CDN registry.
    Fs.writeFileSync(
      registryPath,
      `${JSON.stringify(
        {
          schemaVersion: SCHEMA_VERSION,
          generatedAt: '2026-06-08T00:00:00.000Z',
          sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '3.5.0' },
          mfes: {
            inspector: {
              version: '3.5.0+abc123def456',
              remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
              scope: 'osdMfe_inspector',
              module: './public',
              integrity: 'sha384-CARRYME',
            },
          },
        },
        null,
        2
      )}\n`,
      'utf8'
    );
  });

  afterEach(() => {
    Fs.rmSync(dir, { recursive: true, force: true });
  });

  it('registers the CDN revision next to the registry (default manifest path)', () => {
    Fs.writeFileSync(manifestPath, `${JSON.stringify(manifestWith('3.5.0+abc123def456'))}\n`);
    const out = captureConsole();

    const code = runUpdateCli(
      ['--registry-path', registryPath, '--from-manifest'],
      '/repo',
      {},
      out,
      new Date('2026-07-01T12:00:00.000Z')
    );

    expect(code).toBe(0);
    const written = JSON.parse(Fs.readFileSync(registryPath, 'utf8')) as Registry;
    expect(validate(written).valid).toBe(true);
    expect(written.mfes.inspector.remoteEntry).toBe(
      'https://cdn.example/mfe/inspector/abc123def456/remoteEntry.js'
    );
    expect(written.sharedDeps.url).toBe('https://cdn.example/mfe/shared-deps/3.5.0/');
    // SRI carried over (same content hash).
    expect(written.mfes.inspector.integrity).toBe('sha384-CARRYME');
    expect(out.logs.join('\n')).toMatch(/Registered CDN revision/);

    // resolve(inspector) returns the CloudFront URL (completion criterion).
    const provider = new FileRegistryProvider({ path: registryPath });
    const resolved = resolve(provider, 'inspector');
    expect(resolved?.remoteEntry).toBe(
      'https://cdn.example/mfe/inspector/abc123def456/remoteEntry.js'
    );
    expect(resolved?.source).toBe('registry');
  });

  it('reads an explicit --manifest-path', () => {
    const altManifest = Path.join(dir, 'nested', 'manifest.json');
    Fs.mkdirSync(Path.dirname(altManifest), { recursive: true });
    Fs.writeFileSync(altManifest, `${JSON.stringify(manifestWith('3.5.0+abc123def456'))}\n`);
    const out = captureConsole();

    const code = runUpdateCli(
      ['--registry-path', registryPath, '--from-manifest', '--manifest-path', altManifest],
      '/repo',
      {},
      out
    );

    expect(code).toBe(0);
    const written = JSON.parse(Fs.readFileSync(registryPath, 'utf8')) as Registry;
    expect(written.mfes.discover.remoteEntry).toBe(
      'https://cdn.example/mfe/discover/0123456789ab/remoteEntry.js'
    );
  });

  it('fails with exit 1 on an invalid manifest', () => {
    Fs.writeFileSync(manifestPath, JSON.stringify({ schemaVersion: 1, mfes: {} }));
    const out = captureConsole();

    const code = runUpdateCli(
      ['--registry-path', registryPath, '--from-manifest'],
      '/repo',
      {},
      out
    );

    expect(code).toBe(1);
    expect(out.errors.join('\n')).toMatch(/Invalid deploy manifest/);
  });

  it('fails with exit 1 on an unsupported manifest schemaVersion', () => {
    const future = { ...manifestWith('3.5.0+abc123def456'), schemaVersion: 2 };
    Fs.writeFileSync(manifestPath, JSON.stringify(future));
    const out = captureConsole();

    const code = runUpdateCli(
      ['--registry-path', registryPath, '--from-manifest'],
      '/repo',
      {},
      out
    );

    expect(code).toBe(1);
    expect(out.errors.join('\n')).toMatch(/schemaVersion must equal 1/);
  });
});
