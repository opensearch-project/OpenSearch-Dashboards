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

import { FileRegistryReader, RegistryReaderFs } from './reader';
import { SCHEMA_VERSION_V2 } from './schema_v2';
import {
  fixtureV1Doc,
  fixtureV2DefaultOnly,
  fixtureV2WithCanary,
  fixtureV2WithCanaryAndTenant,
  FIXTURE_INSPECTOR_ACME,
  FIXTURE_INSPECTOR_CANARY,
  FIXTURE_INSPECTOR_DEFAULT,
} from './fixtures_v2';

/**
 * Build a controllable in-memory `fs` shim. Tests can flip the file content
 * (and its mtime) at will to drive the reader's cache + hot-reload paths
 * deterministically without touching disk.
 */
function memFs(initial: string, mtimeMs: number = 1000): {
  fs: RegistryReaderFs;
  set(content: string, mtime?: number): void;
  reads: () => number;
  stats: () => number;
} {
  let content = initial;
  let m = mtimeMs;
  let readCount = 0;
  let statCount = 0;
  return {
    fs: {
      statSync: () => {
        statCount++;
        return { mtimeMs: m };
      },
      readFileSync: () => {
        readCount++;
        return content;
      },
    },
    set(c: string, mt?: number) {
      content = c;
      if (mt !== undefined) m = mt;
    },
    reads: () => readCount,
    stats: () => statCount,
  };
}

describe('FileRegistryReader — construction', () => {
  it('throws when constructed without a path', () => {
    expect(() => new FileRegistryReader({} as { path: string })).toThrow(
      /non-empty `path`/
    );
    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => new FileRegistryReader(undefined as any)
    ).toThrow(/non-empty `path`/);
  });

  it('exposes the configured file path via the filePath getter', () => {
    const reader = new FileRegistryReader({ path: '/tmp/registry.json' });
    expect(reader.filePath).toBe('/tmp/registry.json');
  });
});

describe('FileRegistryReader — v2 resolution', () => {
  it('reads a v2 default-only doc and resolves to the default manifest', async () => {
    const m = memFs(JSON.stringify(fixtureV2DefaultOnly()));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    const manifest = await reader.resolve({ customerId: 'default', userBucket: 0 });
    const inspector = manifest.mfes.find((x) => x.id === 'inspector');
    expect(inspector?.remoteEntry).toBe(FIXTURE_INSPECTOR_DEFAULT.remoteEntry);
    expect(manifest.sharedDeps.url).toBe('https://cdn.example.com/shared-deps/');
  });

  it('resolves the canary entry when bucket matches', async () => {
    const m = memFs(JSON.stringify(fixtureV2WithCanary()));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    const inBucket = await reader.resolve({ customerId: 'default', userBucket: 2 });
    expect(inBucket.mfes.find((x) => x.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_CANARY.remoteEntry
    );

    const outOfBucket = await reader.resolve({ customerId: 'default', userBucket: 50 });
    expect(outOfBucket.mfes.find((x) => x.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_DEFAULT.remoteEntry
    );
  });

  it('tenant override beats the canary even with matching bucket', async () => {
    const m = memFs(JSON.stringify(fixtureV2WithCanaryAndTenant()));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    const acme = await reader.resolve({ customerId: 'acme', userBucket: 2 });
    expect(acme.mfes.find((x) => x.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_ACME.remoteEntry
    );
  });
});

describe('FileRegistryReader — v1 auto-migration', () => {
  it('reads a v1 doc and auto-migrates to a v2 default-only manifest', async () => {
    const m = memFs(JSON.stringify(fixtureV1Doc()));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    const manifest = await reader.resolve({ customerId: 'default', userBucket: 0 });
    expect(manifest.mfes.length).toBe(2);
    const inspector = manifest.mfes.find((x) => x.id === 'inspector');
    expect(inspector?.remoteEntry).toBe(FIXTURE_INSPECTOR_DEFAULT.remoteEntry);
    expect(inspector?.version).toBe(FIXTURE_INSPECTOR_DEFAULT.version);
  });

  it('a v1 doc with missing schemaVersion still auto-migrates (legacy seed)', async () => {
    const v1 = (fixtureV1Doc() as unknown) as Record<string, unknown>;
    delete v1.schemaVersion;
    const m = memFs(JSON.stringify(v1));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    const manifest = await reader.resolve({ customerId: 'default', userBucket: 0 });
    expect(manifest.mfes.find((x) => x.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_DEFAULT.remoteEntry
    );
  });

  it('v1-migrated docs ignore non-default dimensions (no rollouts/tenants)', async () => {
    const m = memFs(JSON.stringify(fixtureV1Doc()));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    const acme = await reader.resolve({ customerId: 'acme', userBucket: 2 });
    expect(acme.mfes.find((x) => x.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_DEFAULT.remoteEntry
    );
  });
});

describe('FileRegistryReader — caching + hot-reload', () => {
  it('reads + parses ONCE when the mtime is unchanged across resolves', async () => {
    const m = memFs(JSON.stringify(fixtureV2DefaultOnly()), 1000);
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    await reader.resolve({ customerId: 'default', userBucket: 0 });
    await reader.resolve({ customerId: 'default', userBucket: 50 });
    await reader.resolve({ customerId: 'acme', userBucket: 99 });

    expect(m.reads()).toBe(1); // parsed once
    expect(m.stats()).toBe(3); // statted on every call (freshness probe)
  });

  it('re-reads + re-parses when the mtime changes (hot-reload)', async () => {
    const v1 = fixtureV2DefaultOnly();
    const m = memFs(JSON.stringify(v1), 1000);
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    const first = await reader.resolve({ customerId: 'default', userBucket: 0 });
    expect(first.mfes.find((x) => x.id === 'inspector')?.version).toBe(
      FIXTURE_INSPECTOR_DEFAULT.version
    );

    // Edit the doc on disk: replace inspector with a new build.
    const updated = fixtureV2DefaultOnly();
    updated.default.mfes.inspector.version = 'rolled-forward';
    updated.default.mfes.inspector.remoteEntry =
      'https://cdn.example.com/mfe/inspector/v_new/remoteEntry.js';
    m.set(JSON.stringify(updated), 2000);

    const second = await reader.resolve({ customerId: 'default', userBucket: 0 });
    expect(second.mfes.find((x) => x.id === 'inspector')?.version).toBe('rolled-forward');
    expect(m.reads()).toBe(2);
  });
});

describe('FileRegistryReader — error paths', () => {
  it('throws a descriptive error when the file does not exist', async () => {
    const fs: RegistryReaderFs = {
      statSync: () => {
        throw new Error('ENOENT: no such file');
      },
      readFileSync: () => {
        throw new Error('ENOENT: no such file');
      },
    };
    const reader = new FileRegistryReader({ path: '/tmp/missing.json', fs });
    await expect(
      reader.resolve({ customerId: 'default', userBucket: 0 })
    ).rejects.toThrow(/cannot stat registry at \/tmp\/missing\.json/);
  });

  it('throws on non-JSON content with the file path in the message', async () => {
    const m = memFs('not-json');
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });
    await expect(
      reader.resolve({ customerId: 'default', userBucket: 0 })
    ).rejects.toThrow(/registry at \/tmp\/r\.json is not valid JSON/);
  });

  it('throws on a malformed v2 doc (path-prefixed errors)', async () => {
    const malformed = {
      schemaVersion: SCHEMA_VERSION_V2,
      generatedAt: '2026-06-19T00:00:00.000Z',
      // missing default / rollouts / tenantOverrides
    };
    const m = memFs(JSON.stringify(malformed));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });
    await expect(
      reader.resolve({ customerId: 'default', userBucket: 0 })
    ).rejects.toThrow(/Invalid v2 MFE registry/);
  });

  it('throws on an unknown schemaVersion', async () => {
    const m = memFs(JSON.stringify({ schemaVersion: 99 }));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });
    await expect(
      reader.resolve({ customerId: 'default', userBucket: 0 })
    ).rejects.toThrow(/Unknown MFE registry shape/);
  });
});
