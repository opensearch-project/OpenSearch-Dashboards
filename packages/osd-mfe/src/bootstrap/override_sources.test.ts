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

import { MfeEntry } from '../registry/schema';
import {
  buildOverrideMap,
  OVERRIDE_STORAGE_KEY,
  OverrideStorage,
  parseOverrideSources,
  parseQueryOverrides,
  parseStorageOverrides,
  resolveAllowOverride,
} from './override_sources';

/** Registry entries used to exercise base-override origin rewriting. */
const REGISTRY: Record<string, MfeEntry> = {
  inspector: {
    version: '3.5.0+aaa',
    remoteEntry: 'https://cdn.example.net/mfe/inspector/aaa/remoteEntry.js',
    scope: 'inspector',
    module: './public',
    integrity: 'sha384-abc',
  },
  data: {
    version: '3.5.0+bbb',
    remoteEntry: 'https://cdn.example.net/mfe/data/bbb/remoteEntry.js',
    scope: 'data',
    module: './public',
  },
};

/** A trivial in-memory {@link OverrideStorage} for the given raw value. */
function storageReturning(raw: string | null): OverrideStorage {
  return {
    getItem: (key: string) => (key === OVERRIDE_STORAGE_KEY ? raw : null),
  };
}

describe('parseQueryOverrides', () => {
  it('parses a per-plugin override (?mfe.<id>=<url>) into byId', () => {
    const parsed = parseQueryOverrides('?mfe.inspector=http://x/y');
    expect(parsed.byId).toEqual({ inspector: 'http://x/y' });
    expect(parsed.all).toBeUndefined();
  });

  it('parses the base override (?mfe.all=<baseUrl>) into `all`', () => {
    const parsed = parseQueryOverrides('?mfe.all=http://h');
    expect(parsed.all).toBe('http://h');
    expect(parsed.byId).toEqual({});
  });

  it('parses multiple per-plugin overrides plus a base override', () => {
    const parsed = parseQueryOverrides(
      '?mfe.all=http://localhost:8080&mfe.inspector=http://localhost:5601/i/remoteEntry.js&unrelated=1'
    );
    expect(parsed.all).toBe('http://localhost:8080');
    expect(parsed.byId).toEqual({ inspector: 'http://localhost:5601/i/remoteEntry.js' });
  });

  it('ignores non-mfe params', () => {
    const parsed = parseQueryOverrides('?foo=bar&mfeXinspector=http://x/y&q=1');
    expect(parsed.all).toBeUndefined();
    expect(parsed.byId).toEqual({});
  });

  it('ignores malformed override URLs (non-http, relative, empty, unparseable)', () => {
    const parsed = parseQueryOverrides(
      '?mfe.a=not-a-url&mfe.b=/relative/path&mfe.c=&mfe.d=javascript:alert(1)&mfe.e=ftp://h/x'
    );
    expect(parsed.byId).toEqual({});
    expect(parsed.all).toBeUndefined();
  });

  it('accepts both http and https override URLs', () => {
    const parsed = parseQueryOverrides('?mfe.a=http://h/a&mfe.b=https://h/b');
    expect(parsed.byId).toEqual({ a: 'http://h/a', b: 'https://h/b' });
  });

  it('tolerates an empty search string', () => {
    expect(parseQueryOverrides('')).toEqual({ byId: {} });
  });
});

describe('parseStorageOverrides', () => {
  it('returns empty when no storage is provided', () => {
    expect(parseStorageOverrides(undefined)).toEqual({ byId: {} });
  });

  it('parses bare-key JSON (id/all -> url) from the override storage key', () => {
    const parsed = parseStorageOverrides(
      storageReturning(
        JSON.stringify({ inspector: 'http://localhost:8080/i/remoteEntry.js', all: 'http://h' })
      )
    );
    expect(parsed.all).toBe('http://h');
    expect(parsed.byId).toEqual({ inspector: 'http://localhost:8080/i/remoteEntry.js' });
  });

  it('ignores invalid JSON, missing key, and non-string/non-object values', () => {
    expect(parseStorageOverrides(storageReturning('{not json'))).toEqual({ byId: {} });
    expect(parseStorageOverrides(storageReturning(null))).toEqual({ byId: {} });
    expect(parseStorageOverrides(storageReturning('"a string"'))).toEqual({ byId: {} });
    expect(parseStorageOverrides(storageReturning(JSON.stringify({ inspector: 42 })))).toEqual({
      byId: {},
    });
  });

  it('ignores malformed URLs inside the stored object', () => {
    const parsed = parseStorageOverrides(
      storageReturning(JSON.stringify({ inspector: 'nope', data: 'http://h/d' }))
    );
    expect(parsed.byId).toEqual({ data: 'http://h/d' });
  });

  it('tolerates a storage whose getItem throws (blocked/privacy mode)', () => {
    const throwing: OverrideStorage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(parseStorageOverrides(throwing)).toEqual({ byId: {} });
  });
});

describe('parseOverrideSources (query + storage precedence)', () => {
  it('lets a query per-plugin override WIN over a stored one for the same id', () => {
    const parsed = parseOverrideSources({
      search: '?mfe.inspector=http://query/win/remoteEntry.js',
      storage: storageReturning(JSON.stringify({ inspector: 'http://stored/lose/remoteEntry.js' })),
    });
    expect(parsed.byId.inspector).toBe('http://query/win/remoteEntry.js');
  });

  it('lets a query base override WIN over a stored base override', () => {
    const parsed = parseOverrideSources({
      search: '?mfe.all=http://query-base',
      storage: storageReturning(JSON.stringify({ all: 'http://stored-base' })),
    });
    expect(parsed.all).toBe('http://query-base');
  });

  it('merges disjoint overrides from both sources', () => {
    const parsed = parseOverrideSources({
      search: '?mfe.inspector=http://q/i/remoteEntry.js',
      storage: storageReturning(JSON.stringify({ data: 'http://s/d/remoteEntry.js' })),
    });
    expect(parsed.byId).toEqual({
      inspector: 'http://q/i/remoteEntry.js',
      data: 'http://s/d/remoteEntry.js',
    });
  });
});

describe('buildOverrideMap (expand parsed overrides against the registry)', () => {
  it('maps a per-plugin override to its full URL (only for known ids)', () => {
    const map = buildOverrideMap(
      { byId: { inspector: 'http://localhost:5601/i/remoteEntry.js', unknown: 'http://h/x' } },
      REGISTRY
    );
    expect(map).toEqual({ inspector: 'http://localhost:5601/i/remoteEntry.js' });
  });

  it('expands a base override across all plugins, swapping origin but keeping the registry path', () => {
    const map = buildOverrideMap({ all: 'http://localhost:8080', byId: {} }, REGISTRY);
    expect(map).toEqual({
      inspector: 'http://localhost:8080/mfe/inspector/aaa/remoteEntry.js',
      data: 'http://localhost:8080/mfe/data/bbb/remoteEntry.js',
    });
  });

  it('prepends a base path prefix when the base URL has one', () => {
    const map = buildOverrideMap({ all: 'http://localhost:8080/cdn/', byId: {} }, REGISTRY);
    expect(map.inspector).toBe('http://localhost:8080/cdn/mfe/inspector/aaa/remoteEntry.js');
  });

  it('lets a per-plugin override WIN over the base override for the same id', () => {
    const map = buildOverrideMap(
      { all: 'http://localhost:8080', byId: { inspector: 'http://pin/i/remoteEntry.js' } },
      REGISTRY
    );
    expect(map.inspector).toBe('http://pin/i/remoteEntry.js');
    // data still follows the base override.
    expect(map.data).toBe('http://localhost:8080/mfe/data/bbb/remoteEntry.js');
  });

  it('returns an empty map when there are no overrides', () => {
    expect(buildOverrideMap({ byId: {} }, REGISTRY)).toEqual({});
  });
});

describe('resolveAllowOverride (the non-prod security gate default)', () => {
  it('defaults the gate OFF in production (unset config, dev=false)', () => {
    // SECURITY: the crux of Phase 5 — with no explicit config, production must
    // resolve to false so every override source is ignored.
    expect(resolveAllowOverride(undefined, false)).toBe(false);
  });

  it('defaults the gate ON in development (unset config, dev=true)', () => {
    expect(resolveAllowOverride(undefined, true)).toBe(true);
  });

  it('honors an explicit `true` even in production (dev=false)', () => {
    expect(resolveAllowOverride(true, false)).toBe(true);
  });

  it('honors an explicit `false` even in development (dev=true)', () => {
    // An operator can force the gate off in dev; explicit config always wins.
    expect(resolveAllowOverride(false, true)).toBe(false);
  });
});
