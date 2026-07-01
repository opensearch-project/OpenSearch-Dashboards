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

import { SCHEMA_VERSION, Registry } from './schema';
import { FileRegistryProvider, RegistryFs } from './provider';
import { signRegistry } from './signing';
import { REGISTRY_SIGNATURE_ALGORITHM } from './signing_common';

/** Build a minimal, valid registry with `inspector` pinned to `version`. */
function registryWith(version: string): Registry {
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
      },
    },
  };
}

/**
 * An in-memory {@link RegistryFs} that tracks read/stat counts and lets a test
 * mutate the content + mtime deterministically (no disk timing flakiness).
 */
function fakeFs(initial: Registry, mtimeMs = 1000) {
  const state = { content: JSON.stringify(initial), mtimeMs, reads: 0, stats: 0 };
  const fs: RegistryFs = {
    statSync: () => {
      state.stats += 1;
      return { mtimeMs: state.mtimeMs };
    },
    readFileSync: () => {
      state.reads += 1;
      return state.content;
    },
  };
  return { fs, state };
}

describe('FileRegistryProvider — path configuration', () => {
  const ORIGINAL_ENV = process.env.MFE_REGISTRY_PATH;
  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.MFE_REGISTRY_PATH;
    } else {
      process.env.MFE_REGISTRY_PATH = ORIGINAL_ENV;
    }
  });

  it('uses the constructor path over the env var', () => {
    process.env.MFE_REGISTRY_PATH = '/from/env.json';
    const { fs } = fakeFs(registryWith('3.5.0+aaa'));
    const provider = new FileRegistryProvider({ path: '/explicit/arg.json', fs });
    expect(provider.filePath).toBe('/explicit/arg.json');
  });

  it('falls back to MFE_REGISTRY_PATH when no path arg is given', () => {
    process.env.MFE_REGISTRY_PATH = '/from/env.json';
    const { fs } = fakeFs(registryWith('3.5.0+aaa'));
    const provider = new FileRegistryProvider({ fs });
    expect(provider.filePath).toBe('/from/env.json');
  });

  it('throws when neither a path arg nor MFE_REGISTRY_PATH is set', () => {
    delete process.env.MFE_REGISTRY_PATH;
    expect(() => new FileRegistryProvider()).toThrow(/no registry path/);
  });
});

describe('FileRegistryProvider — mtime hot-reload (in-memory fs)', () => {
  it('caches when mtime is unchanged: read() does NOT re-parse the file', () => {
    const { fs, state } = fakeFs(registryWith('3.5.0+v1'));
    const provider = new FileRegistryProvider({ path: '/r.json', fs });

    expect(provider.read().mfes.inspector.version).toBe('3.5.0+v1');
    expect(state.reads).toBe(1); // first read parses the file

    // Repeated reads with an UNCHANGED mtime must serve the cache, not re-read.
    provider.read();
    provider.read();
    expect(state.reads).toBe(1); // still only the single parse
    expect(state.stats).toBe(3); // but it does stat every time (cheap freshness check)
  });

  it('re-reads and returns NEW data when the file mtime changes', () => {
    const { fs, state } = fakeFs(registryWith('3.5.0+v1'));
    const provider = new FileRegistryProvider({ path: '/r.json', fs });

    expect(provider.read().mfes.inspector.version).toBe('3.5.0+v1');
    expect(state.reads).toBe(1);

    // Operator flips the version (DATA edit) and the mtime advances.
    state.content = JSON.stringify(registryWith('3.5.0+v2'));
    state.mtimeMs = 2000;

    // SAME provider instance — mtime-triggered re-read reflects the new data.
    expect(provider.read().mfes.inspector.version).toBe('3.5.0+v2');
    expect(state.reads).toBe(2);
  });
});

describe('FileRegistryProvider — real file hot-reload + accessors', () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'mfe-registry-'));
    file = Path.join(dir, 'registry.json');
  });
  afterEach(() => {
    Fs.rmSync(dir, { recursive: true, force: true });
  });

  /** Write the registry and force a known mtime so the test is deterministic. */
  function writeRegistry(reg: Registry, mtimeSeconds: number): void {
    Fs.writeFileSync(file, JSON.stringify(reg, null, 2));
    Fs.utimesSync(file, mtimeSeconds, mtimeSeconds);
  }

  it('reflects an on-disk edit on the next read WITHOUT recreating the provider', () => {
    writeRegistry(registryWith('3.5.0+disk1'), 1_000);
    const provider = new FileRegistryProvider({ path: file });

    expect(provider.read().mfes.inspector.version).toBe('3.5.0+disk1');

    // Edit the DATA file and advance its mtime (simulates `update_registry`).
    writeRegistry(registryWith('3.5.0+disk2'), 2_000);

    expect(provider.read().mfes.inspector.version).toBe('3.5.0+disk2');
  });

  it('getMfe() and list() reflect the current registry; unknown id is undefined', () => {
    writeRegistry(registryWith('3.5.0+disk1'), 1_000);
    const provider = new FileRegistryProvider({ path: file });

    expect(provider.list()).toEqual(['inspector']);
    expect(provider.getMfe('inspector')?.version).toBe('3.5.0+disk1');
    expect(provider.getMfe('does-not-exist')).toBeUndefined();
  });

  it('throws a descriptive error when the file is missing', () => {
    const provider = new FileRegistryProvider({ path: Path.join(dir, 'nope.json') });
    expect(() => provider.read()).toThrow(/cannot stat registry/);
  });

  it('throws a descriptive error when the file is not valid JSON', () => {
    Fs.writeFileSync(file, '{ not json');
    const provider = new FileRegistryProvider({ path: file });
    expect(() => provider.read()).toThrow(/not valid JSON/);
  });

  it('throws a descriptive error when the JSON is not a valid registry', () => {
    Fs.writeFileSync(file, JSON.stringify({ schemaVersion: 1 }));
    const provider = new FileRegistryProvider({ path: file });
    expect(() => provider.read()).toThrow(/Invalid MFE registry/);
  });
});

describe('FileRegistryProvider — registry signature verification', () => {
  const KEY = { keyId: 'mfe-test-hmac-1', secret: 'server-held-secret' };
  const VERIFICATION = {
    algorithm: REGISTRY_SIGNATURE_ALGORITHM,
    keyId: KEY.keyId,
    key: KEY.secret,
  };

  /** A fake fs serving a fixed content string at a stable mtime. */
  function fsServing(content: string): RegistryFs {
    return {
      statSync: () => ({ mtimeMs: 1000 }),
      readFileSync: () => content,
    };
  }

  it('returns a validly-signed registry when a matching verification key is configured', () => {
    const signed = signRegistry(registryWith('3.5.0+signed'), KEY);
    const provider = new FileRegistryProvider({
      path: '/r.json',
      fs: fsServing(JSON.stringify(signed)),
      verification: VERIFICATION,
    });
    expect(provider.read().mfes.inspector.version).toBe('3.5.0+signed');
  });

  it('THROWS fail-closed for a TAMPERED registry (byte change after signing)', () => {
    const signed = signRegistry(registryWith('3.5.0+signed'), KEY);
    // Tamper: repoint the remote AFTER signing — the signature no longer matches.
    signed.mfes.inspector.remoteEntry = 'http://evil.example.com/remoteEntry.js';
    const provider = new FileRegistryProvider({
      path: '/r.json',
      fs: fsServing(JSON.stringify(signed)),
      verification: VERIFICATION,
    });
    expect(() => provider.read()).toThrow(/failed signature verification/i);
  });

  it('THROWS fail-closed for an UNSIGNED registry when a key is configured', () => {
    const unsigned = registryWith('3.5.0+unsigned');
    const provider = new FileRegistryProvider({
      path: '/r.json',
      fs: fsServing(JSON.stringify(unsigned)),
      verification: VERIFICATION,
    });
    expect(() => provider.read()).toThrow(/failed signature verification|no signature/i);
  });

  it('THROWS fail-closed when signed with a DIFFERENT key than configured', () => {
    const signed = signRegistry(registryWith('3.5.0+signed'), {
      keyId: KEY.keyId,
      secret: 'attacker-key',
    });
    const provider = new FileRegistryProvider({
      path: '/r.json',
      fs: fsServing(JSON.stringify(signed)),
      verification: VERIFICATION,
    });
    expect(() => provider.read()).toThrow(/failed signature verification/i);
  });

  it('loads an unsigned registry unchanged when NO verification key is configured (backward compat)', () => {
    const unsigned = registryWith('3.5.0+legacy');
    const provider = new FileRegistryProvider({
      path: '/r.json',
      fs: fsServing(JSON.stringify(unsigned)),
    });
    expect(provider.read().mfes.inspector.version).toBe('3.5.0+legacy');
  });
});
