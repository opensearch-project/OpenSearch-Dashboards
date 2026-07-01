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
import { SCHEMA_VERSION, RegistryDocument } from './schema';
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
 * reader tests build a few bespoke shapes (with-global-assets, mtime-stable
 * variants) inline here so each test reads as a self-contained unit.
 * ------------------------------------------------------------------------- */

function fixtureRegistryDefaultOnly(): RegistryDocument {
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

function fixtureRegistryWithCanary(): RegistryDocument {
  return {
    ...fixtureRegistryDefaultOnly(),
    rollouts: [
      {
        id: 'inspector-canary-5pct',
        match: { userBucketLt: 5 },
        override: { mfes: { inspector: { ...FIXTURE_INSPECTOR_CANARY } } },
      },
    ],
  };
}

function fixtureRegistryWithCanaryAndTenant(): RegistryDocument {
  return {
    ...fixtureRegistryWithCanary(),
    tenantOverrides: {
      acme: {
        mfes: { inspector: { ...FIXTURE_INSPECTOR_ACME } },
      },
    },
  };
}

function fixtureRegistryWithGlobalAssets(): RegistryDocument {
  return {
    ...fixtureRegistryDefaultOnly(),
    core: {
      url: 'https://cdn.example.com/mfe/core/abc123/core.entry.js',
      integrity: 'sha384-coreabc123def456',
      version: '3.5.0+core00000000',
    },
    orchestrator: {
      url: 'https://cdn.example.com/mfe/orchestrator/def456/osd_bootstrap_mfe.js',
      integrity: 'sha384-orcdef456ghi789',
      version: '3.5.0+orc00000000',
    },
    sharedDepsCss: {
      url: 'https://cdn.example.com/mfe/shared-deps/css/ghi789/osd-ui-shared-deps.css',
      integrity: 'sha384-sdcghi789jkl012',
      version: '3.5.0+sdc00000000',
    },
    themes: {
      light: {
        url: 'https://cdn.example.com/mfe/themes/light/jkl012/legacy_light_theme.css',
        integrity: 'sha384-thljkl012mno345',
        version: '3.5.0+thl00000000',
      },
    },
  };
}

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

describe('FileRegistryReader — schemaVersion: 1 resolution', () => {
  it('reads a default-only doc and resolves to the default manifest', async () => {
    const m = memFs(JSON.stringify(fixtureRegistryDefaultOnly()));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    const manifest = await reader.resolve({ customerId: 'default', userBucket: 0 });
    const inspector = manifest.mfes.find((x) => x.id === 'inspector');
    expect(inspector?.remoteEntry).toBe(FIXTURE_INSPECTOR_DEFAULT.remoteEntry);
    expect(manifest.sharedDeps.url).toBe('https://cdn.example.com/shared-deps/');
  });

  it('resolves the canary entry when bucket matches', async () => {
    const m = memFs(JSON.stringify(fixtureRegistryWithCanary()));
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
    const m = memFs(JSON.stringify(fixtureRegistryWithCanaryAndTenant()));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    const acme = await reader.resolve({ customerId: 'acme', userBucket: 2 });
    expect(acme.mfes.find((x) => x.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_ACME.remoteEntry
    );
  });

  it('surfaces global asset roots from the doc onto the resolved manifest', async () => {
    // schemaVersion: 1 carries optional global asset roots (core, orchestrator,
    // sharedDepsCss, themes) at the document top level; the pure resolver
    // shallow-clones them onto the manifest top level. Absent fields stay
    // absent so consumers can fall back to the server-bundled `/bundles/...`
    // path per asset.
    const m = memFs(JSON.stringify(fixtureRegistryWithGlobalAssets()));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    const manifest = await reader.resolve({ customerId: 'default', userBucket: 0 });
    expect(manifest.mfes.find((x) => x.id === 'inspector')?.remoteEntry).toBe(
      FIXTURE_INSPECTOR_DEFAULT.remoteEntry
    );
    expect(manifest.core?.url).toBe('https://cdn.example.com/mfe/core/abc123/core.entry.js');
    expect(manifest.orchestrator?.integrity).toBe('sha384-orcdef456ghi789');
    expect(manifest.sharedDepsCss?.version).toBe('3.5.0+sdc00000000');
    expect(manifest.themes?.light?.url).toBe(
      'https://cdn.example.com/mfe/themes/light/jkl012/legacy_light_theme.css'
    );
  });
});

describe('FileRegistryReader — caching + hot-reload', () => {
  it('reads + parses ONCE when the mtime is unchanged across resolves', async () => {
    const m = memFs(JSON.stringify(fixtureRegistryDefaultOnly()), 1000);
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    await reader.resolve({ customerId: 'default', userBucket: 0 });
    await reader.resolve({ customerId: 'default', userBucket: 50 });
    await reader.resolve({ customerId: 'acme', userBucket: 99 });

    expect(m.reads()).toBe(1); // parsed once
    expect(m.stats()).toBe(3); // statted on every call (freshness probe)
  });

  it('re-reads + re-parses when the mtime changes (hot-reload)', async () => {
    const v1 = fixtureRegistryDefaultOnly();
    const m = memFs(JSON.stringify(v1), 1000);
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });

    const first = await reader.resolve({ customerId: 'default', userBucket: 0 });
    expect(first.mfes.find((x) => x.id === 'inspector')?.version).toBe(
      FIXTURE_INSPECTOR_DEFAULT.version
    );

    // Edit the doc on disk: replace inspector with a new build.
    const updated = fixtureRegistryDefaultOnly();
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

  it('throws on a structurally malformed doc (path-prefixed errors)', async () => {
    const malformed = {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: '2026-06-19T00:00:00.000Z',
      // missing default / rollouts / tenantOverrides
    };
    const m = memFs(JSON.stringify(malformed));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });
    await expect(
      reader.resolve({ customerId: 'default', userBucket: 0 })
    ).rejects.toThrow(/Invalid MFE registry/);
  });

  it('throws on an unknown schemaVersion (no legacy migration)', async () => {
    const m = memFs(JSON.stringify({ schemaVersion: 99 }));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });
    await expect(
      reader.resolve({ customerId: 'default', userBucket: 0 })
    ).rejects.toThrow(/schemaVersion must equal 1/);
  });

  it('throws on a legacy v1-shaped doc (no auto-migration)', async () => {
    // The previous reader auto-migrated v1 to v2; the new reader is strict on
    // schemaVersion: 1 and rejects the v1 top-level `mfes` shape. The canonical
    // CDN registry is `schemaVersion: 1` natively.
    const legacyV1 = {
      schemaVersion: 1, // shaped like v1, NOT the new layered schemaVersion: 1
      generatedAt: '2026-06-19T00:00:00.000Z',
      sharedDeps: { url: 'https://cdn.example.com/shared-deps/', version: '3.5.0' },
      mfes: { inspector: { ...FIXTURE_INSPECTOR_DEFAULT } },
    };
    const m = memFs(JSON.stringify(legacyV1));
    const reader = new FileRegistryReader({ path: '/tmp/r.json', fs: m.fs });
    await expect(
      reader.resolve({ customerId: 'default', userBucket: 0 })
    ).rejects.toThrow(/Invalid MFE registry/);
  });
});
