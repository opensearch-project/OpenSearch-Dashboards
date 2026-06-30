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

import { SCHEMA_VERSION, MfeEntry, Registry } from './schema';
import { RegistryProvider } from './provider';
import { resolve } from './dev_override';

/** A built `inspector` entry (with integrity) plus a second plugin. */
const INSPECTOR: MfeEntry = {
  version: '3.5.0+80e281a550b5',
  remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
  scope: 'inspector',
  module: './public',
  integrity: 'sha384-abc123',
};

const DASHBOARD: MfeEntry = {
  version: '3.5.0+deadbeef0001',
  remoteEntry: 'http://localhost:8080/mfe/dashboard/remoteEntry.js',
  scope: 'dashboard',
  module: './public',
  // no integrity on this one
};

/** Build a minimal, valid registry containing the given entries. */
function registryWith(mfes: Record<string, MfeEntry>): Registry {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: '2026-06-08T00:00:00.000Z',
    sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '3.5.0' },
    mfes,
  };
}

/**
 * A trivial in-memory {@link RegistryProvider}. resolve() only depends on the
 * interface, so this exercises the contract without touching the filesystem.
 */
function fakeProvider(registry: Registry): RegistryProvider {
  return {
    read: () => registry,
    getMfe: (id: string) => registry.mfes[id],
    list: () => Object.keys(registry.mfes),
  };
}

describe('resolve(provider, id, overrides) — registry source', () => {
  const provider = fakeProvider(registryWith({ inspector: INSPECTOR, dashboard: DASHBOARD }));

  it('returns the registry descriptor for a known id', () => {
    const resolved = resolve(provider, 'inspector');
    expect(resolved).toEqual({
      id: 'inspector',
      remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
      scope: 'inspector',
      module: './public',
      version: '3.5.0+80e281a550b5',
      integrity: 'sha384-abc123',
      source: 'registry',
    });
  });

  it('omits integrity when the registry entry has none', () => {
    const resolved = resolve(provider, 'dashboard');
    expect(resolved).not.toBeNull();
    expect(resolved).not.toHaveProperty('integrity');
    expect(resolved?.source).toBe('registry');
    expect(resolved?.version).toBe('3.5.0+deadbeef0001');
  });

  it('reflects current registry data on each call (no caching in resolve)', () => {
    // Mutate the backing data the provider returns; resolve must see the new URL.
    const mutable = registryWith({ inspector: { ...INSPECTOR } });
    const p = fakeProvider(mutable);
    expect(resolve(p, 'inspector')?.remoteEntry).toBe(INSPECTOR.remoteEntry);

    mutable.mfes.inspector.remoteEntry = 'http://cdn.example.com/mfe/inspector/remoteEntry.js';
    mutable.mfes.inspector.version = '3.5.0+ffffffffffff';
    const after = resolve(p, 'inspector');
    expect(after?.remoteEntry).toBe('http://cdn.example.com/mfe/inspector/remoteEntry.js');
    expect(after?.version).toBe('3.5.0+ffffffffffff');
  });
});

describe('resolve(provider, id, overrides) — dev-override hook', () => {
  const provider = fakeProvider(registryWith({ inspector: INSPECTOR }));
  const OVERRIDE_URL = 'http://localhost:5601/mfe/inspector/remoteEntry.js';

  it('uses the override URL, not the registry URL, when one is given for the id', () => {
    const resolved = resolve(provider, 'inspector', { inspector: OVERRIDE_URL });
    expect(resolved?.remoteEntry).toBe(OVERRIDE_URL);
    expect(resolved?.source).toBe('override');
  });

  it('keeps scope/module/version from the registry when overriding', () => {
    const resolved = resolve(provider, 'inspector', { inspector: OVERRIDE_URL });
    expect(resolved?.scope).toBe('inspector');
    expect(resolved?.module).toBe('./public');
    expect(resolved?.version).toBe('3.5.0+80e281a550b5');
  });

  it('drops registry integrity when the URL is overridden (bytes differ)', () => {
    const resolved = resolve(provider, 'inspector', { inspector: OVERRIDE_URL });
    expect(resolved).not.toHaveProperty('integrity');
  });

  it('ignores an override that targets a different id', () => {
    const resolved = resolve(provider, 'inspector', { dashboard: OVERRIDE_URL });
    expect(resolved?.remoteEntry).toBe(INSPECTOR.remoteEntry);
    expect(resolved?.source).toBe('registry');
  });

  it('treats an empty-string override as no override', () => {
    const resolved = resolve(provider, 'inspector', { inspector: '' });
    expect(resolved?.remoteEntry).toBe(INSPECTOR.remoteEntry);
    expect(resolved?.source).toBe('registry');
  });
});

describe('resolve(provider, id, overrides) — unknown id', () => {
  const provider = fakeProvider(registryWith({ inspector: INSPECTOR }));

  it('returns null for an id not in the registry', () => {
    expect(resolve(provider, 'does-not-exist')).toBeNull();
  });

  it('returns null for an unknown id even when an override is supplied', () => {
    // An override cannot synthesize scope/module/version, so it is ignored.
    expect(
      resolve(provider, 'does-not-exist', {
        'does-not-exist': 'http://localhost:5601/x/remoteEntry.js',
      })
    ).toBeNull();
  });
});
