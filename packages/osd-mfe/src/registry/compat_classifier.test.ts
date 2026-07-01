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

import { classifyCompatibility, HostEnvironment, RemoteCompatMetadata } from './compat_classifier';
import { computeCompatMetadata } from './compat';
import { Registry, MfeEntry } from './schema';

/** The OSD repo root (packages/osd-mfe/src/registry -> up 4). */
const REPO_ROOT = Path.resolve(__dirname, '..', '..', '..', '..');
/** The canonical (CDN) registry the harness serves: workspace-root registry/registry.json. */
const CANONICAL_REGISTRY = Path.resolve(REPO_ROOT, '..', 'registry', 'registry.json');

/**
 * A baseline remote built against OSD 3.5.0 with a representative mix of shared
 * singletons (caret ranges + exact pins, mirroring the real registry).
 */
const REMOTE_3_5: RemoteCompatMetadata = {
  builtAgainst: {
    osdVersion: '3.5.0',
    sharedDeps: {
      react: '^16.14.0',
      'react-dom': '^16.12.0',
      lodash: '^4.17.21',
      '@elastic/charts': '31.1.0',
      '@osd/i18n': '1.0.0',
    },
  },
  compat: { minCoreVersion: '3.5.0', compatibleCoreRange: '3.5.x' },
};

/** A host that exactly matches what REMOTE_3_5 was built against. */
const HOST_3_5: HostEnvironment = {
  osdVersion: '3.5.0',
  sharedDeps: {
    react: '16.14.0',
    'react-dom': '16.13.1',
    lodash: '4.17.21',
    '@elastic/charts': '31.1.0',
    '@osd/i18n': '1.0.0',
  },
};

describe('classifyCompatibility — OSD core axis', () => {
  it('exact match (same major.minor, satisfied singletons) => compatible', () => {
    const result = classifyCompatibility(HOST_3_5, REMOTE_3_5);
    expect(result.compatibility).toBe('compatible');
    expect(result.reasons).toEqual([]);
    expect(result.coreMismatch).toBe(false);
    expect(result.sharedMismatch).toBe(false);
  });

  it('a newer host patch within the same minor => compatible', () => {
    expect(
      classifyCompatibility({ ...HOST_3_5, osdVersion: '3.5.9' }, REMOTE_3_5).compatibility
    ).toBe('compatible');
  });

  it('minCoreVersion above the host => incompatible', () => {
    const remote: RemoteCompatMetadata = {
      ...REMOTE_3_5,
      compat: { minCoreVersion: '3.5.5', compatibleCoreRange: '3.5.x' },
    };
    const result = classifyCompatibility({ ...HOST_3_5, osdVersion: '3.5.2' }, remote);
    expect(result.compatibility).toBe('incompatible');
    expect(result.coreMismatch).toBe(true);
    expect(result.reasons.join(' ')).toMatch(/below the remote's minimum core version 3\.5\.5/);
  });

  it('a higher minor mismatch => incompatible', () => {
    const result = classifyCompatibility({ ...HOST_3_5, osdVersion: '3.6.0' }, REMOTE_3_5);
    expect(result.compatibility).toBe('incompatible');
    expect(result.coreMismatch).toBe(true);
    expect(result.reasons.join(' ')).toMatch(/not within the remote's compatible core range/);
  });

  it('a lower minor mismatch => incompatible', () => {
    const result = classifyCompatibility({ ...HOST_3_5, osdVersion: '3.4.0' }, REMOTE_3_5);
    expect(result.compatibility).toBe('incompatible');
    expect(result.coreMismatch).toBe(true);
  });

  it('a major mismatch => incompatible', () => {
    const result = classifyCompatibility({ ...HOST_3_5, osdVersion: '4.5.0' }, REMOTE_3_5);
    expect(result.compatibility).toBe('incompatible');
    expect(result.coreMismatch).toBe(true);
  });

  it('an unparseable host OSD version fails closed => incompatible', () => {
    const result = classifyCompatibility({ ...HOST_3_5, osdVersion: 'not-a-version' }, REMOTE_3_5);
    expect(result.compatibility).toBe('incompatible');
    expect(result.coreMismatch).toBe(true);
    expect(result.reasons.join(' ')).toMatch(/not valid semver/);
  });
});

describe('classifyCompatibility — shared-singleton axis', () => {
  it('host version satisfies every required range => compatible', () => {
    expect(classifyCompatibility(HOST_3_5, REMOTE_3_5).compatibility).toBe('compatible');
  });

  it('a shared-dep range the host cannot satisfy => incompatible', () => {
    // Host runs react 17, remote requires ^16.14.0.
    const host: HostEnvironment = {
      ...HOST_3_5,
      sharedDeps: { ...HOST_3_5.sharedDeps, react: '17.0.2' },
    };
    const result = classifyCompatibility(host, REMOTE_3_5);
    expect(result.compatibility).toBe('incompatible');
    expect(result.sharedMismatch).toBe(true);
    expect(result.coreMismatch).toBe(false);
    expect(result.reasons.join(' ')).toMatch(
      /shared singleton "react": host 17\.0\.2 does not satisfy/
    );
  });

  it('an exact-pin shared dep mismatch => incompatible', () => {
    // Remote requires @elastic/charts 31.1.0 exactly; host has 32.0.0.
    const host: HostEnvironment = {
      ...HOST_3_5,
      sharedDeps: { ...HOST_3_5.sharedDeps, '@elastic/charts': '32.0.0' },
    };
    const result = classifyCompatibility(host, REMOTE_3_5);
    expect(result.compatibility).toBe('incompatible');
    expect(result.sharedMismatch).toBe(true);
  });

  it('a required singleton the host does not provide => incompatible (strict)', () => {
    const host: HostEnvironment = {
      osdVersion: '3.5.0',
      sharedDeps: { react: '16.14.0' }, // missing react-dom, lodash, ...
    };
    const result = classifyCompatibility(host, REMOTE_3_5);
    expect(result.compatibility).toBe('incompatible');
    expect(result.sharedMismatch).toBe(true);
    expect(result.reasons.join(' ')).toMatch(/host does not provide shared singleton "lodash"/);
  });

  it('a host singleton version that is not valid semver => incompatible', () => {
    const host: HostEnvironment = {
      ...HOST_3_5,
      sharedDeps: { ...HOST_3_5.sharedDeps, react: 'garbage' },
    };
    const result = classifyCompatibility(host, REMOTE_3_5);
    expect(result.compatibility).toBe('incompatible');
    expect(result.sharedMismatch).toBe(true);
    expect(result.reasons.join(' ')).toMatch(/not valid semver/);
  });

  it('accepts a host singleton expressed as a range (uses its minimum version)', () => {
    const host: HostEnvironment = {
      ...HOST_3_5,
      sharedDeps: { ...HOST_3_5.sharedDeps, react: '^16.14.0' },
    };
    expect(classifyCompatibility(host, REMOTE_3_5).compatibility).toBe('compatible');
  });

  it('reports BOTH core and shared mismatches together', () => {
    const host: HostEnvironment = {
      osdVersion: '4.0.0',
      sharedDeps: { ...HOST_3_5.sharedDeps, react: '17.0.2' },
    };
    const result = classifyCompatibility(host, REMOTE_3_5);
    expect(result.compatibility).toBe('incompatible');
    expect(result.coreMismatch).toBe(true);
    expect(result.sharedMismatch).toBe(true);
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
  });
});

describe('classifyCompatibility — unknown (missing metadata)', () => {
  it('missing builtAgainst => unknown', () => {
    const result = classifyCompatibility(HOST_3_5, { compat: REMOTE_3_5.compat });
    expect(result.compatibility).toBe('unknown');
    expect(result.reasons.join(' ')).toMatch(/missing compatibility metadata: builtAgainst/);
  });

  it('missing compat => unknown', () => {
    const result = classifyCompatibility(HOST_3_5, { builtAgainst: REMOTE_3_5.builtAgainst });
    expect(result.compatibility).toBe('unknown');
    expect(result.reasons.join(' ')).toMatch(/compat/);
  });

  it('both missing (legacy entry) => unknown', () => {
    const result = classifyCompatibility(HOST_3_5, {});
    expect(result.compatibility).toBe('unknown');
    expect(result.coreMismatch).toBe(false);
    expect(result.sharedMismatch).toBe(false);
  });
});

describe('classifyCompatibility — determinism', () => {
  it('returns the same result for the same inputs', () => {
    expect(classifyCompatibility(HOST_3_5, REMOTE_3_5)).toEqual(
      classifyCompatibility(HOST_3_5, REMOTE_3_5)
    );
  });

  it('does not mutate its inputs', () => {
    const host = JSON.parse(JSON.stringify(HOST_3_5));
    const remote = JSON.parse(JSON.stringify(REMOTE_3_5));
    classifyCompatibility(host, remote);
    expect(host).toEqual(HOST_3_5);
    expect(remote).toEqual(REMOTE_3_5);
  });
});

describe('happy path — every current remote classifies COMPATIBLE against the host', () => {
  // The running host is exactly what the one-tree build produced
  // (computeCompatMetadata): same OSD version + a provided singleton version
  // that satisfies each required range (its minimum). This mirrors the real
  // bootstrap host that the bootstrap policy layer will inject.
  const meta = computeCompatMetadata(REPO_ROOT);
  const host: HostEnvironment = {
    osdVersion: meta.builtAgainst.osdVersion,
    sharedDeps: meta.builtAgainst.sharedDeps, // ranges; classifier coerces to min
  };

  it('the live computed metadata is self-compatible', () => {
    const result = classifyCompatibility(host, {
      builtAgainst: meta.builtAgainst,
      compat: meta.compat,
    });
    expect(result.compatibility).toBe('compatible');
    expect(result.reasons).toEqual([]);
  });

  it('all 58 canonical registry entries classify compatible', () => {
    const raw = JSON.parse(Fs.readFileSync(CANONICAL_REGISTRY, 'utf8')) as
      | Registry
      | { default?: { mfes?: Record<string, MfeEntry> }; mfes?: Record<string, MfeEntry> };
    // v3 registries store mfes under `.default.mfes` (layered shape); v1/v2
    // had them at top-level `.mfes`. Read from either shape so this test
    // stays meaningful as the canonical-registry schemaVersion evolves.
    const mfes =
      (raw as { default?: { mfes?: Record<string, MfeEntry> } }).default?.mfes ??
      (raw as { mfes?: Record<string, MfeEntry> }).mfes ??
      {};
    const ids = Object.keys(mfes);
    expect(ids.length).toBeGreaterThan(0);

    const incompatible: Array<{ id: string; reasons: string[] }> = [];
    for (const id of ids) {
      const entry: MfeEntry = mfes[id];
      const result = classifyCompatibility(host, {
        builtAgainst: entry.builtAgainst,
        compat: entry.compat,
      });
      if (result.compatibility !== 'compatible') {
        incompatible.push({ id, reasons: result.reasons });
      }
    }

    expect(incompatible).toEqual([]);
  });
});
