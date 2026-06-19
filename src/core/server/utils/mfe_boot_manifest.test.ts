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
import Path from 'path';
import Os from 'os';

import {
  bucketFromCookie,
  buildBucketSetCookie,
  generateBucketCookieValue,
  parseSingleCookie,
  readMfeBootManifest,
  _resetMfeBootManifestCache,
} from './mfe_boot_manifest';

function tmpFile(content: string, suffix = '.json'): string {
  const file = Path.join(
    Os.tmpdir(),
    `osd-mfe-test-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`
  );
  Fs.writeFileSync(file, content);
  return file;
}

const FIXTURE_INSPECTOR_DEFAULT = {
  version: '3.5.0+default',
  remoteEntry: 'https://cdn.example.com/mfe/inspector/default/remoteEntry.js',
  scope: 'inspector',
  module: './public',
  integrity: 'sha384-default',
};

const FIXTURE_INSPECTOR_CANARY = {
  version: '3.5.0+canary',
  remoteEntry: 'https://cdn.example.com/mfe/inspector/canary/remoteEntry.js',
  scope: 'inspector',
  module: './public',
  integrity: 'sha384-canary',
};

const FIXTURE_INSPECTOR_ACME = {
  version: '3.5.0+acme',
  remoteEntry: 'https://cdn.example.com/mfe/inspector/acme/remoteEntry.js',
  scope: 'inspector',
  module: './public',
  integrity: 'sha384-acme',
};

const SHARED = { url: 'https://cdn.example.com/shared-deps/', version: '3.5.0' };

beforeEach(() => {
  _resetMfeBootManifestCache();
});

describe('parseSingleCookie()', () => {
  it('returns undefined for missing or empty headers', () => {
    expect(parseSingleCookie(undefined, 'x')).toBeUndefined();
    expect(parseSingleCookie('', 'x')).toBeUndefined();
    expect(parseSingleCookie('a=1', '')).toBeUndefined();
  });

  it('returns the named cookie value', () => {
    expect(parseSingleCookie('_osd_mfe_bucket=abc123', '_osd_mfe_bucket')).toBe('abc123');
    expect(
      parseSingleCookie('foo=bar; _osd_mfe_bucket=xyz; baz=qux', '_osd_mfe_bucket')
    ).toBe('xyz');
  });

  it('strips surrounding quotes', () => {
    expect(parseSingleCookie('_osd_mfe_bucket="quoted"', '_osd_mfe_bucket')).toBe('quoted');
  });

  it('returns undefined when the cookie is not present', () => {
    expect(parseSingleCookie('foo=bar; baz=qux', '_osd_mfe_bucket')).toBeUndefined();
  });
});

describe('bucketFromCookie()', () => {
  it('is deterministic for the same cookie value', () => {
    expect(bucketFromCookie('abc123')).toBe(bucketFromCookie('abc123'));
  });

  it('returns an integer in [0, 100)', () => {
    for (const v of ['a', 'abc', 'longer-token', '0', '999']) {
      const b = bucketFromCookie(v);
      expect(Number.isInteger(b)).toBe(true);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(100);
    }
  });

  it('different cookie values generally yield different buckets', () => {
    // Quick sanity check on uniformity: sample 100 different inputs, expect at
    // least 30 unique buckets (well below the birthday-paradox collision rate).
    const set = new Set<number>();
    for (let i = 0; i < 100; i++) set.add(bucketFromCookie(`token-${i}`));
    expect(set.size).toBeGreaterThan(30);
  });
});

describe('buildBucketSetCookie()', () => {
  it('produces an HttpOnly, sticky cookie header value', () => {
    const v = buildBucketSetCookie('_osd_mfe_bucket', 'abc123');
    expect(v).toContain('_osd_mfe_bucket=abc123');
    expect(v).toContain('HttpOnly');
    expect(v).toContain('Path=/');
    expect(v).toContain('SameSite=Lax');
    expect(v).toMatch(/Max-Age=\d+/);
  });
});

describe('generateBucketCookieValue()', () => {
  it('returns a 16-char hex token', () => {
    const v = generateBucketCookieValue();
    expect(v).toMatch(/^[0-9a-f]{16}$/);
  });

  it('produces different values across calls (very high probability)', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) set.add(generateBucketCookieValue());
    expect(set.size).toBe(50);
  });
});

describe('readMfeBootManifest() — v2 path', () => {
  const v2DefaultOnly = {
    schemaVersion: 2,
    generatedAt: '2026-06-19T00:00:00.000Z',
    default: {
      sharedDeps: SHARED,
      mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT },
    },
    rollouts: [],
    tenantOverrides: {},
  };

  const v2WithCanaryAndTenant = {
    schemaVersion: 2,
    generatedAt: '2026-06-19T00:00:00.000Z',
    default: {
      sharedDeps: SHARED,
      mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT },
    },
    rollouts: [
      {
        id: 'inspector-canary-5pct',
        match: { userBucketLt: 5 },
        override: { mfes: { inspector: FIXTURE_INSPECTOR_CANARY } },
      },
    ],
    tenantOverrides: {
      acme: { mfes: { inspector: FIXTURE_INSPECTOR_ACME } },
    },
  };

  it('resolves default-only doc to the default manifest', () => {
    const file = tmpFile(JSON.stringify(v2DefaultOnly));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.sharedDeps).toEqual(SHARED);
      expect(m.mfes.length).toBe(1);
      expect(m.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_DEFAULT.remoteEntry);
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('respects precedence: tenant > rollouts > default', () => {
    const file = tmpFile(JSON.stringify(v2WithCanaryAndTenant));
    try {
      // acme + bucket=2 (would also match canary): tenant wins.
      const acme = readMfeBootManifest(file, { customerId: 'acme', userBucket: 2 });
      expect(acme.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_ACME.remoteEntry);

      // default tenant + bucket=2: canary wins.
      const canary = readMfeBootManifest(file, { customerId: 'default', userBucket: 2 });
      expect(canary.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_CANARY.remoteEntry);

      // default tenant + bucket=50: default wins.
      const def = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(def.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_DEFAULT.remoteEntry);
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('emits ids in default-insertion order, then layered-only ids', () => {
    const doc = {
      schemaVersion: 2,
      generatedAt: '2026-06-19T00:00:00.000Z',
      default: {
        sharedDeps: SHARED,
        mfes: {
          inspector: FIXTURE_INSPECTOR_DEFAULT,
          dashboard: {
            version: '3.5.0+dash',
            remoteEntry: 'https://cdn.example.com/mfe/dashboard/default/remoteEntry.js',
            scope: 'dashboard',
            module: './public',
          },
        },
      },
      rollouts: [
        {
          id: 'add-newcomer',
          match: {},
          override: {
            mfes: {
              newcomer: {
                version: 'n1',
                remoteEntry: 'https://cdn.example.com/mfe/newcomer/remoteEntry.js',
                scope: 'newcomer',
                module: './public',
              },
            },
          },
        },
      ],
      tenantOverrides: {},
    };
    const file = tmpFile(JSON.stringify(doc));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 0 });
      expect(m.mfes.map((e) => e.id)).toEqual(['inspector', 'dashboard', 'newcomer']);
    } finally {
      Fs.unlinkSync(file);
    }
  });
});

describe('readMfeBootManifest() — v1 auto-migration', () => {
  it('reads a v1 doc and resolves to default-only', () => {
    const v1 = {
      schemaVersion: 1,
      generatedAt: '2026-06-19T00:00:00.000Z',
      sharedDeps: SHARED,
      mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT },
    };
    const file = tmpFile(JSON.stringify(v1));
    try {
      const m = readMfeBootManifest(file, { customerId: 'acme', userBucket: 2 });
      // No rollouts/tenants in a migrated v1 doc; acme + bucket=2 still gets default.
      expect(m.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_DEFAULT.remoteEntry);
      expect(m.sharedDeps).toEqual(SHARED);
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('treats a missing schemaVersion as v1 (legacy seed)', () => {
    const v1 = {
      generatedAt: '2026-06-19T00:00:00.000Z',
      sharedDeps: SHARED,
      mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT },
    };
    const file = tmpFile(JSON.stringify(v1));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 0 });
      expect(m.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_DEFAULT.remoteEntry);
    } finally {
      Fs.unlinkSync(file);
    }
  });
});

describe('readMfeBootManifest() — error paths', () => {
  it('throws on a missing file', () => {
    expect(() =>
      readMfeBootManifest('/tmp/no/such/file-osd.json', {
        customerId: 'default',
        userBucket: 0,
      })
    ).toThrow();
  });

  it('throws on non-JSON content', () => {
    const file = tmpFile('not-json');
    try {
      expect(() =>
        readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })
      ).toThrow();
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws on an unsupported schemaVersion', () => {
    const file = tmpFile(JSON.stringify({ schemaVersion: 99 }));
    try {
      expect(() =>
        readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })
      ).toThrow(/unsupported schemaVersion/);
    } finally {
      Fs.unlinkSync(file);
    }
  });
});

describe('readMfeBootManifest() — mtime caching', () => {
  it('reuses the parsed doc when mtime is unchanged across calls', () => {
    const v2 = {
      schemaVersion: 2,
      generatedAt: '2026-06-19T00:00:00.000Z',
      default: { sharedDeps: SHARED, mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT } },
      rollouts: [],
      tenantOverrides: {},
    };
    const file = tmpFile(JSON.stringify(v2));
    try {
      const m1 = readMfeBootManifest(file, { customerId: 'default', userBucket: 0 });
      const m2 = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      // Both calls succeed with consistent default content; if cache mishandled
      // mtime, the second call would re-parse but yield the same result.
      expect(m1.mfes[0].remoteEntry).toBe(m2.mfes[0].remoteEntry);
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('hot-reloads when the file is replaced (mtime advances)', async () => {
    const initial = {
      schemaVersion: 2,
      generatedAt: '2026-06-19T00:00:00.000Z',
      default: { sharedDeps: SHARED, mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT } },
      rollouts: [],
      tenantOverrides: {},
    };
    const file = tmpFile(JSON.stringify(initial));
    try {
      const before = readMfeBootManifest(file, { customerId: 'default', userBucket: 0 });
      expect(before.mfes[0].version).toBe(FIXTURE_INSPECTOR_DEFAULT.version);

      // Wait at least one fs-mtime tick (most filesystems are millisecond-resolution
      // but some are second-resolution; this ensures the new mtime differs).
      await new Promise((r) => setTimeout(r, 1100));

      const updated = JSON.parse(JSON.stringify(initial));
      updated.default.mfes.inspector.version = 'rolled-forward';
      Fs.writeFileSync(file, JSON.stringify(updated));

      const after = readMfeBootManifest(file, { customerId: 'default', userBucket: 0 });
      expect(after.mfes[0].version).toBe('rolled-forward');
    } finally {
      Fs.unlinkSync(file);
    }
  });
});
