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
    expect(parseSingleCookie('foo=bar; _osd_mfe_bucket=xyz; baz=qux', '_osd_mfe_bucket')).toBe(
      'xyz'
    );
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

describe('readMfeBootManifest()', () => {
  const defaultOnly = {
    schemaVersion: 1,
    generatedAt: '2026-06-19T00:00:00.000Z',
    default: {
      sharedDeps: SHARED,
      mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT },
    },
    rollouts: [],
    tenantOverrides: {},
  };

  const withCanaryAndTenant = {
    schemaVersion: 1,
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
    const file = tmpFile(JSON.stringify(defaultOnly));
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
    const file = tmpFile(JSON.stringify(withCanaryAndTenant));
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
      schemaVersion: 1,
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
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow();
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws on an unsupported schemaVersion', () => {
    const file = tmpFile(JSON.stringify({ schemaVersion: 99 }));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /unsupported schemaVersion/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });
});

describe('readMfeBootManifest() — mtime caching', () => {
  it('reuses the parsed doc when mtime is unchanged across calls', () => {
    const doc = {
      schemaVersion: 1,
      generatedAt: '2026-06-19T00:00:00.000Z',
      default: { sharedDeps: SHARED, mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT } },
      rollouts: [],
      tenantOverrides: {},
    };
    const file = tmpFile(JSON.stringify(doc));
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
      schemaVersion: 1,
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

/* ------------------------------------------------------------------------- *
 * schema-collapse loop — optional global asset root: orchestrator descriptor
 * ------------------------------------------------------------------------- */

describe('readMfeBootManifest() — orchestrator descriptor', () => {
  const withOrchestrator = {
    schemaVersion: 1,
    generatedAt: '2026-06-26T00:00:00.000Z',
    default: {
      sharedDeps: SHARED,
      mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT },
    },
    rollouts: [],
    tenantOverrides: {},
    orchestrator: {
      url: 'https://cdn.example.com/mfe/orchestrator/deadbeef0000/osd_bootstrap_mfe.js',
      integrity: 'sha384-orchA',
      version: '3.5.0+orch1',
    },
  };

  it('reads a schemaVersion: 1 doc with orchestrator and surfaces it on the boot manifest', () => {
    const file = tmpFile(JSON.stringify(withOrchestrator));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      // layered substructure still resolves identically.
      expect(m.sharedDeps).toEqual(SHARED);
      expect(m.mfes.length).toBe(1);
      expect(m.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_DEFAULT.remoteEntry);
      // global orchestrator descriptor is projected onto the manifest.
      expect(m.orchestrator).toEqual({
        url: 'https://cdn.example.com/mfe/orchestrator/deadbeef0000/osd_bootstrap_mfe.js',
        integrity: 'sha384-orchA',
      });
      // `version` is registry-side metadata only — must NOT be propagated to
      // the loader (browsers don't need it; the URL is content-addressed).
      expect(((m.orchestrator as unknown) as Record<string, unknown>).version).toBeUndefined();
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('reads a schemaVersion: 1 doc with NO orchestrator field — manifest.orchestrator is absent', () => {
    const noOrch = { ...withOrchestrator };
    delete (noOrch as Record<string, unknown>).orchestrator;
    const file = tmpFile(JSON.stringify(noOrch));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.orchestrator).toBeUndefined();
      expect(m.mfes.length).toBe(1);
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('reads a schemaVersion: 1 doc with orchestrator WITHOUT integrity (dev /bundles/... fallback URL)', () => {
    const devOrch = {
      ...withOrchestrator,
      orchestrator: {
        url: '/bundles/mfe/orchestrator/deadbeef0000/osd_bootstrap_mfe.js',
        // intentionally no integrity — same-origin dev fallback
        version: '3.5.0+orch1',
      },
    };
    const file = tmpFile(JSON.stringify(devOrch));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.orchestrator).toEqual({
        url: '/bundles/mfe/orchestrator/deadbeef0000/osd_bootstrap_mfe.js',
      });
      expect(m.orchestrator!.integrity).toBeUndefined();
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('layered substructure honors rollouts + tenant overrides exactly across rollouts and tenants', () => {
    const withCanaryAndTenant = {
      schemaVersion: 1,
      generatedAt: '2026-06-26T00:00:00.000Z',
      default: { sharedDeps: SHARED, mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT } },
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
      orchestrator: {
        url: 'https://cdn.example.com/mfe/orchestrator/0000aaaa0000/osd_bootstrap_mfe.js',
        integrity: 'sha384-orchA',
        version: '3.5.0+orch1',
      },
    };
    const file = tmpFile(JSON.stringify(withCanaryAndTenant));
    try {
      // Tenant > rollouts > default precedence holds regardless of which optional global asset roots are present.
      const acme = readMfeBootManifest(file, { customerId: 'acme', userBucket: 2 });
      expect(acme.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_ACME.remoteEntry);
      expect(acme.orchestrator!.integrity).toBe('sha384-orchA');

      const canary = readMfeBootManifest(file, { customerId: 'default', userBucket: 2 });
      expect(canary.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_CANARY.remoteEntry);
      // Orchestrator is GLOBAL — it does not vary with rollouts/tenants.
      expect(canary.orchestrator!.url).toBe(acme.orchestrator!.url);
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when orchestrator is not an object', () => {
    const bad = { ...withOrchestrator, orchestrator: 'not-an-object' };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`orchestrator\` must be an object/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when orchestrator.url is missing or empty', () => {
    const bad = {
      ...withOrchestrator,
      orchestrator: { integrity: 'sha384-x', version: '1' },
    };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`orchestrator\.url\` must be a non-empty string/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when orchestrator.integrity is present but not a non-empty string', () => {
    const bad = {
      ...withOrchestrator,
      orchestrator: { url: 'https://example.com/x.js', integrity: '', version: '1' },
    };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`orchestrator\.integrity\`, when present, must be a non-empty string/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });


  it('rejects schemaVersion 99 with the supported-version message', () => {
    const file = tmpFile(JSON.stringify({ schemaVersion: 99 }));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /only schemaVersion: 1 is supported/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });
});

/* ------------------------------------------------------------------------- *
 * schema-collapse loop — `core` descriptor projection
 *
 * Mirrors the Story-3 orchestrator block immediately above. Both global asset fields are
 * top-level + GLOBAL (not per-layer/rollout/tenant), so the projection +
 * resolution behaviour is identical; the cases below confirm that contract
 * for `core` explicitly so a regression in either field is caught here, NOT
 * at the slower runtime tier.
 * ------------------------------------------------------------------------- */

describe('readMfeBootManifest() — core descriptor', () => {
  const withCore = {
    schemaVersion: 1,
    generatedAt: '2026-06-27T00:00:00.000Z',
    default: {
      sharedDeps: SHARED,
      mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT },
    },
    rollouts: [],
    tenantOverrides: {},
    core: {
      url: 'https://cdn.example.com/mfe/core/cafebabe0000/core.entry.js',
      integrity: 'sha384-coreA',
      version: '3.5.0+core1',
    },
  };

  it('reads a schemaVersion: 1 doc with core and surfaces it on the boot manifest', () => {
    const file = tmpFile(JSON.stringify(withCore));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.sharedDeps).toEqual(SHARED);
      expect(m.mfes.length).toBe(1);
      expect(m.core).toEqual({
        url: 'https://cdn.example.com/mfe/core/cafebabe0000/core.entry.js',
        integrity: 'sha384-coreA',
      });
      // `version` is registry-side metadata only — MUST NOT be propagated
      // to the loader (same contract as orchestrator: the URL is content-
      // addressed; the loader never needs a version string).
      expect(((m.core as unknown) as Record<string, unknown>).version).toBeUndefined();
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('reads a schemaVersion: 1 doc with NO core field — manifest.core is absent', () => {
    const noCore = { ...withCore };
    delete (noCore as Record<string, unknown>).core;
    const file = tmpFile(JSON.stringify(noCore));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.core).toBeUndefined();
      // Sibling fields (mfes, sharedDeps) still project correctly.
      expect(m.mfes.length).toBe(1);
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('reads a schemaVersion: 1 doc with core WITHOUT integrity (dev /bundles/... fallback URL)', () => {
    // Same dev-fallback contract as the orchestrator: a same-origin URL
    // legitimately has no SRI; only the cross-origin CDN URL pins one. The
    // reader MUST accept the descriptor in both shapes.
    const devCore = {
      ...withCore,
      core: {
        url: '/bundles/mfe/core/cafebabe0000/core.entry.js',
        version: '3.5.0+core1',
      },
    };
    const file = tmpFile(JSON.stringify(devCore));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.core).toEqual({
        url: '/bundles/mfe/core/cafebabe0000/core.entry.js',
      });
      expect(m.core!.integrity).toBeUndefined();
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('core is GLOBAL — does not vary across rollouts/tenant overrides', () => {
    const canaryAndTenant = {
      schemaVersion: 1,
      generatedAt: '2026-06-27T00:00:00.000Z',
      default: { sharedDeps: SHARED, mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT } },
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
      core: {
        url: 'https://cdn.example.com/mfe/core/cafebabe1111/core.entry.js',
        integrity: 'sha384-coreA',
        version: '3.5.0+core1',
      },
    };
    const file = tmpFile(JSON.stringify(canaryAndTenant));
    try {
      const acme = readMfeBootManifest(file, { customerId: 'acme', userBucket: 2 });
      expect(acme.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_ACME.remoteEntry);
      const canary = readMfeBootManifest(file, { customerId: 'default', userBucket: 2 });
      expect(canary.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_CANARY.remoteEntry);
      // Core is GLOBAL — it does not vary with rollouts/tenants.
      expect(canary.core!.url).toBe(acme.core!.url);
      expect(canary.core!.integrity).toBe('sha384-coreA');
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when core is not an object', () => {
    const bad = { ...withCore, core: 'not-an-object' };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`core\` must be an object/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when core.url is missing or empty', () => {
    const bad = {
      ...withCore,
      core: { integrity: 'sha384-x', version: '1' },
    };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`core\.url\` must be a non-empty string/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when core.integrity is present but not a non-empty string', () => {
    const bad = {
      ...withCore,
      core: { url: 'https://example.com/core.entry.js', integrity: '', version: '1' },
    };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`core\.integrity\`, when present, must be a non-empty string/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('schemaVersion: 1 doc with BOTH orchestrator AND core surfaces BOTH on the manifest', () => {
    const withBothCoreAndOrchestrator = {
      ...withCore,
      orchestrator: {
        url: 'https://cdn.example.com/mfe/orchestrator/0000/osd_bootstrap_mfe.js',
        integrity: 'sha384-orchA',
        version: '3.5.0+orch1',
      },
    };
    const file = tmpFile(JSON.stringify(withBothCoreAndOrchestrator));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.core).toEqual({
        url: 'https://cdn.example.com/mfe/core/cafebabe0000/core.entry.js',
        integrity: 'sha384-coreA',
      });
      expect(m.orchestrator).toEqual({
        url: 'https://cdn.example.com/mfe/orchestrator/0000/osd_bootstrap_mfe.js',
        integrity: 'sha384-orchA',
      });
    } finally {
      Fs.unlinkSync(file);
    }
  });
});

/* ------------------------------------------------------------------------- *
 * schema-collapse loop — `themes` descriptor projection
 *
 * Same shape, same backward-compat posture as `orchestrator` / `core`: the
 * field is GLOBAL (does not vary by rollout / tenant), the URL is required,
 * `integrity` is OPTIONAL (same-origin dev fallback URLs legitimately have
 * no SRI), and the version is registry-side metadata that never reaches the
 * loader. Cases mirror the `core` block immediately above so a regression in
 * either field is caught at the same tier.
 * ------------------------------------------------------------------------- */

describe('readMfeBootManifest() — themes descriptor', () => {
  const withThemes = {
    schemaVersion: 1,
    generatedAt: '2026-06-27T00:00:00.000Z',
    default: {
      sharedDeps: SHARED,
      mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT },
    },
    rollouts: [],
    tenantOverrides: {},
    themes: {
      light: {
        url: 'https://cdn.example.com/mfe/themes/light/lighthash/legacy_light_theme.css',
        integrity: 'sha384-lightA',
        version: '3.5.0+light1',
      },
      dark: {
        url: 'https://cdn.example.com/mfe/themes/dark/darkhash/legacy_dark_theme.css',
        integrity: 'sha384-darkA',
        version: '3.5.0+dark1',
      },
    },
  };

  it('reads a schemaVersion: 1 doc with themes and surfaces them on the boot manifest', () => {
    const file = tmpFile(JSON.stringify(withThemes));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.sharedDeps).toEqual(SHARED);
      expect(m.mfes.length).toBe(1);
      expect(m.themes).toEqual({
        light: {
          url: 'https://cdn.example.com/mfe/themes/light/lighthash/legacy_light_theme.css',
          integrity: 'sha384-lightA',
        },
        dark: {
          url: 'https://cdn.example.com/mfe/themes/dark/darkhash/legacy_dark_theme.css',
          integrity: 'sha384-darkA',
        },
      });
      // `version` is registry-side metadata only — MUST NOT be propagated
      // to the loader (same contract as orchestrator/core).
      const lightOut = (m.themes!.light as unknown) as Record<string, unknown>;
      expect(lightOut.version).toBeUndefined();
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('reads a schemaVersion: 1 doc with NO themes field — manifest.themes is absent', () => {
    const noThemes = { ...withThemes };
    delete (noThemes as Record<string, unknown>).themes;
    const file = tmpFile(JSON.stringify(noThemes));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.themes).toBeUndefined();
      expect(m.mfes.length).toBe(1);
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('accepts an open theme-name set (e.g. `high-contrast`)', () => {
    // The schema does NOT enumerate `light`/`dark` — deployments can
    // advertise additional themes without a server change. This case
    // confirms the projection passes through any string key.
    const openThemes = {
      ...withThemes,
      themes: {
        ...withThemes.themes,
        'high-contrast': {
          url: 'https://cdn.example.com/mfe/themes/high-contrast/hc/legacy_high-contrast_theme.css',
          integrity: 'sha384-hcA',
          version: '3.5.0+hc1',
        },
      },
    };
    const file = tmpFile(JSON.stringify(openThemes));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(Object.keys(m.themes!).sort()).toEqual(['dark', 'high-contrast', 'light']);
      expect(m.themes!['high-contrast'].url).toContain('high-contrast');
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('accepts a theme entry WITHOUT integrity (dev /ui/... fallback URL)', () => {
    // Same dev-fallback contract as the orchestrator/core: a same-origin
    // URL legitimately has no SRI; the reader MUST accept the descriptor
    // in both shapes.
    const devTheme = {
      ...withThemes,
      themes: {
        light: {
          url: '/ui/legacy_light_theme.css',
          version: '3.5.0+light1',
        },
      },
    };
    const file = tmpFile(JSON.stringify(devTheme));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.themes!.light).toEqual({ url: '/ui/legacy_light_theme.css' });
      expect(m.themes!.light.integrity).toBeUndefined();
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('themes are GLOBAL — does not vary across rollouts/tenant overrides', () => {
    const canaryAndTenant = {
      schemaVersion: 1,
      generatedAt: '2026-06-27T00:00:00.000Z',
      default: { sharedDeps: SHARED, mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT } },
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
      themes: {
        light: {
          url: 'https://cdn.example.com/mfe/themes/light/lighthash/legacy_light_theme.css',
          integrity: 'sha384-lightA',
          version: '3.5.0+light1',
        },
      },
    };
    const file = tmpFile(JSON.stringify(canaryAndTenant));
    try {
      const acme = readMfeBootManifest(file, { customerId: 'acme', userBucket: 2 });
      expect(acme.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_ACME.remoteEntry);
      const canary = readMfeBootManifest(file, { customerId: 'default', userBucket: 2 });
      expect(canary.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_CANARY.remoteEntry);
      // Themes are GLOBAL — they do not vary with rollouts/tenants.
      expect(canary.themes!.light.url).toBe(acme.themes!.light.url);
      expect(canary.themes!.light.integrity).toBe('sha384-lightA');
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when themes is not an object', () => {
    const bad = { ...withThemes, themes: 'not-an-object' };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`themes\`, when present, must be an object/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when themes has an empty-string key', () => {
    const bad = {
      ...withThemes,
      themes: {
        '': {
          url: 'https://example.com/x.css',
          integrity: 'sha384-x',
          version: '1',
        },
      },
    };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`themes\` has an empty-string key/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when a theme entry is not an object', () => {
    const bad = { ...withThemes, themes: { light: 'not-an-object' } };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`themes\.light\` must be an object/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when a theme entry url is missing or empty', () => {
    const bad = {
      ...withThemes,
      themes: { light: { integrity: 'sha384-x', version: '1' } },
    };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`themes\.light\.url\` must be a non-empty string/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when a theme entry integrity is present but not a non-empty string', () => {
    const bad = {
      ...withThemes,
      themes: {
        light: { url: 'https://example.com/x.css', integrity: '', version: '1' },
      },
    };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`themes\.light\.integrity\`, when present, must be a non-empty string/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('schemaVersion: 1 doc with orchestrator + core + themes surfaces ALL THREE on the manifest', () => {
    const withAllGlobalAssets = {
      ...withThemes,
      orchestrator: {
        url: 'https://cdn.example.com/mfe/orchestrator/0000/osd_bootstrap_mfe.js',
        integrity: 'sha384-orchA',
        version: '3.5.0+orch1',
      },
      core: {
        url: 'https://cdn.example.com/mfe/core/0000/core.entry.js',
        integrity: 'sha384-coreA',
        version: '3.5.0+core1',
      },
    };
    const file = tmpFile(JSON.stringify(withAllGlobalAssets));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.orchestrator).toBeDefined();
      expect(m.core).toBeDefined();
      expect(m.themes).toBeDefined();
      expect(Object.keys(m.themes!).sort()).toEqual(['dark', 'light']);
    } finally {
      Fs.unlinkSync(file);
    }
  });
});

/* themes / SHARED-DEPS-CSS / TAIL: themes describe closed above. */

/* ------------------------------------------------------------------------- *
 * schema-collapse loop — `sharedDepsCss` descriptor projection
 *
 * Same shape, same backward-compat posture as `orchestrator` / `core`: GLOBAL
 * (does not vary by rollout / tenant), URL is required, `integrity` is
 * OPTIONAL (same-origin dev fallback URLs legitimately have no SRI), and the
 * registry-side `version` is metadata that never reaches the loader. Cases
 * mirror the `core` / `themes` blocks above so a regression in any of the
 * three GLOBAL static-asset fields is caught at the same tier.
 * ------------------------------------------------------------------------- */

describe('readMfeBootManifest() — sharedDepsCss descriptor', () => {
  const withSharedDepsCss = {
    schemaVersion: 1,
    generatedAt: '2026-06-27T00:00:00.000Z',
    default: {
      sharedDeps: SHARED,
      mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT },
    },
    rollouts: [],
    tenantOverrides: {},
    sharedDepsCss: {
      url: 'https://cdn.example.com/mfe/shared-deps/css/scsshash/osd-ui-shared-deps.css',
      integrity: 'sha384-scssA',
      version: '3.5.0+scss1',
    },
  };

  it('reads a schemaVersion: 1 doc with sharedDepsCss and surfaces it on the boot manifest', () => {
    const file = tmpFile(JSON.stringify(withSharedDepsCss));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.sharedDeps).toEqual(SHARED);
      expect(m.mfes.length).toBe(1);
      expect(m.sharedDepsCss).toEqual({
        url: 'https://cdn.example.com/mfe/shared-deps/css/scsshash/osd-ui-shared-deps.css',
        integrity: 'sha384-scssA',
      });
      // `version` is registry-side metadata only — MUST NOT be propagated
      // to the loader (same contract as orchestrator/core/themes).
      const out = (m.sharedDepsCss as unknown) as Record<string, unknown>;
      expect(out.version).toBeUndefined();
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('reads a schemaVersion: 1 doc with NO sharedDepsCss field — manifest.sharedDepsCss is absent', () => {
    const noScss = { ...withSharedDepsCss };
    delete (noScss as Record<string, unknown>).sharedDepsCss;
    const file = tmpFile(JSON.stringify(noScss));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.sharedDepsCss).toBeUndefined();
      expect(m.mfes.length).toBe(1);
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('accepts a sharedDepsCss entry WITHOUT integrity (dev fallback URL)', () => {
    // Same dev-fallback contract as the orchestrator/core/themes: a same-
    // origin URL legitimately has no SRI; the reader MUST accept the
    // descriptor in both shapes.
    const devScss = {
      ...withSharedDepsCss,
      sharedDepsCss: {
        url: '/bundles/osd-ui-shared-deps/osd-ui-shared-deps.css',
        version: '3.5.0+scss1',
      },
    };
    const file = tmpFile(JSON.stringify(devScss));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.sharedDepsCss).toEqual({
        url: '/bundles/osd-ui-shared-deps/osd-ui-shared-deps.css',
      });
      expect(m.sharedDepsCss!.integrity).toBeUndefined();
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('sharedDepsCss is GLOBAL — does not vary across rollouts/tenant overrides', () => {
    const canaryAndTenant = {
      schemaVersion: 1,
      generatedAt: '2026-06-27T00:00:00.000Z',
      default: { sharedDeps: SHARED, mfes: { inspector: FIXTURE_INSPECTOR_DEFAULT } },
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
      sharedDepsCss: {
        url: 'https://cdn.example.com/mfe/shared-deps/css/scsshash/osd-ui-shared-deps.css',
        integrity: 'sha384-scssA',
        version: '3.5.0+scss1',
      },
    };
    const file = tmpFile(JSON.stringify(canaryAndTenant));
    try {
      const acme = readMfeBootManifest(file, { customerId: 'acme', userBucket: 2 });
      expect(acme.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_ACME.remoteEntry);
      const canary = readMfeBootManifest(file, { customerId: 'default', userBucket: 2 });
      expect(canary.mfes[0].remoteEntry).toBe(FIXTURE_INSPECTOR_CANARY.remoteEntry);
      // sharedDepsCss is GLOBAL — does not vary with rollouts/tenants.
      expect(canary.sharedDepsCss!.url).toBe(acme.sharedDepsCss!.url);
      expect(canary.sharedDepsCss!.integrity).toBe('sha384-scssA');
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when sharedDepsCss is not an object', () => {
    const bad = { ...withSharedDepsCss, sharedDepsCss: 'not-an-object' };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`sharedDepsCss\` must be an object/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when sharedDepsCss.url is missing or empty', () => {
    const bad = {
      ...withSharedDepsCss,
      sharedDepsCss: { integrity: 'sha384-x', version: '1' },
    };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`sharedDepsCss\.url\` must be a non-empty string/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('throws when sharedDepsCss.integrity is present but not a non-empty string', () => {
    const bad = {
      ...withSharedDepsCss,
      sharedDepsCss: {
        url: 'https://example.com/x.css',
        integrity: '',
        version: '1',
      },
    };
    const file = tmpFile(JSON.stringify(bad));
    try {
      expect(() => readMfeBootManifest(file, { customerId: 'default', userBucket: 0 })).toThrow(
        /\`sharedDepsCss\.integrity\`, when present, must be a non-empty string/
      );
    } finally {
      Fs.unlinkSync(file);
    }
  });

  it('schemaVersion: 1 doc with orchestrator + core + themes + sharedDepsCss surfaces ALL FOUR on the manifest', () => {
    const withAllGlobalAssets = {
      ...withSharedDepsCss,
      orchestrator: {
        url: 'https://cdn.example.com/mfe/orchestrator/0000/osd_bootstrap_mfe.js',
        integrity: 'sha384-orchA',
        version: '3.5.0+orch1',
      },
      core: {
        url: 'https://cdn.example.com/mfe/core/0000/core.entry.js',
        integrity: 'sha384-coreA',
        version: '3.5.0+core1',
      },
      themes: {
        light: {
          url: 'https://cdn.example.com/mfe/themes/light/lighthash/legacy_light_theme.css',
          integrity: 'sha384-lightA',
          version: '3.5.0+light1',
        },
      },
    };
    const file = tmpFile(JSON.stringify(withAllGlobalAssets));
    try {
      const m = readMfeBootManifest(file, { customerId: 'default', userBucket: 50 });
      expect(m.orchestrator).toBeDefined();
      expect(m.core).toBeDefined();
      expect(m.themes).toBeDefined();
      expect(m.sharedDepsCss).toBeDefined();
      expect(m.sharedDepsCss!.url).toContain('osd-ui-shared-deps.css');
    } finally {
      Fs.unlinkSync(file);
    }
  });
});
