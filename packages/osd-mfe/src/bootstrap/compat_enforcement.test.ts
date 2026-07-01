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

import { decideCompat, decideRemoteCompat } from './compat_enforcement';
import { CompatPolicy } from './compat_policy';
import { HostEnvironment, RemoteCompatMetadata } from '../registry/compat_classifier';

const HOST: HostEnvironment = {
  osdVersion: '3.5.0',
  sharedDeps: {
    react: '^16.14.0',
    'react-dom': '^16.14.0',
    lodash: '^4.17.21',
  },
};

/** A remote that matches the host on both axes (compatible). */
const COMPATIBLE: RemoteCompatMetadata = {
  builtAgainst: {
    osdVersion: '3.5.0',
    sharedDeps: { react: '^16.14.0', 'react-dom': '^16.14.0', lodash: '^4.17.21' },
  },
  compat: { minCoreVersion: '3.5.0', compatibleCoreRange: '3.5.x' },
};

/** A remote whose CORE axis is incompatible (minor mismatch + floor above host). */
const CORE_INCOMPATIBLE: RemoteCompatMetadata = {
  builtAgainst: {
    osdVersion: '3.7.0',
    sharedDeps: { react: '^16.14.0' },
  },
  compat: { minCoreVersion: '3.7.0', compatibleCoreRange: '3.7.x' },
};

/** A remote whose ONLY incompatibility is a shared-singleton mismatch. */
const SHARED_INCOMPATIBLE: RemoteCompatMetadata = {
  builtAgainst: {
    osdVersion: '3.5.0',
    sharedDeps: { react: '>=999.0.0' },
  },
  compat: { minCoreVersion: '3.5.0', compatibleCoreRange: '3.5.x' },
};

/** A remote missing all compatibility metadata (unknown). */
const UNKNOWN: RemoteCompatMetadata = {};

const NON_PROD: CompatPolicy = {
  onIncompatible: 'block',
  onMissing: 'warn-load',
  strictShared: true,
};
const PROD: CompatPolicy = {
  onIncompatible: 'skip',
  onMissing: 'skip',
  strictShared: true,
};

describe('decideRemoteCompat', () => {
  it('loads a compatible remote (any policy)', () => {
    expect(decideRemoteCompat(HOST, COMPATIBLE, NON_PROD).action).toBe('load');
    expect(decideRemoteCompat(HOST, COMPATIBLE, PROD).action).toBe('load');
  });

  it('non-prod (block): an incompatible remote becomes a page offender (block)', () => {
    const decision = decideRemoteCompat(HOST, CORE_INCOMPATIBLE, NON_PROD);
    expect(decision.action).toBe('block');
    expect(decision.compatibility).toBe('incompatible');
    expect(decision.reasons.length).toBeGreaterThan(0);
  });

  it('prod (skip): an incompatible remote is skipped (not blocking)', () => {
    const decision = decideRemoteCompat(HOST, CORE_INCOMPATIBLE, PROD);
    expect(decision.action).toBe('skip');
    expect(decision.compatibility).toBe('incompatible');
  });

  it('unknown metadata: warn-load => load, skip => skip, block => block', () => {
    expect(decideRemoteCompat(HOST, UNKNOWN, NON_PROD).action).toBe('load');
    expect(decideRemoteCompat(HOST, UNKNOWN, PROD).action).toBe('skip');
    expect(decideRemoteCompat(HOST, UNKNOWN, { ...NON_PROD, onMissing: 'block' }).action).toBe(
      'block'
    );
  });

  it('strictShared=true: a shared-only mismatch is enforced as incompatible', () => {
    expect(decideRemoteCompat(HOST, SHARED_INCOMPATIBLE, NON_PROD).action).toBe('block');
    expect(decideRemoteCompat(HOST, SHARED_INCOMPATIBLE, PROD).action).toBe('skip');
  });

  it('strictShared=false: a shared-ONLY mismatch is tolerated (loaded)', () => {
    const decision = decideRemoteCompat(HOST, SHARED_INCOMPATIBLE, {
      ...NON_PROD,
      strictShared: false,
    });
    expect(decision.action).toBe('load');
    expect(decision.compatibility).toBe('compatible');
    expect(decision.reasons).toEqual([]);
  });

  it('strictShared=false: a CORE mismatch is still enforced even with shared opt-out', () => {
    // Core-axis mismatch must NOT be downgraded by strictShared:false.
    const decision = decideRemoteCompat(HOST, CORE_INCOMPATIBLE, {
      ...NON_PROD,
      strictShared: false,
    });
    expect(decision.action).toBe('block');
    expect(decision.compatibility).toBe('incompatible');
  });
});

describe('decideCompat (partitioning)', () => {
  const registry: Record<string, RemoteCompatMetadata> = {
    good: COMPATIBLE,
    badCore: CORE_INCOMPATIBLE,
    badShared: SHARED_INCOMPATIBLE,
    mystery: UNKNOWN,
  };
  const ids = Object.keys(registry);
  const getMeta = (id: string) => registry[id];

  it('non-prod: incompatible remotes are offenders => block; unknown warn-loads', () => {
    const decision = decideCompat(ids, getMeta, HOST, NON_PROD);
    expect(decision.block).toBe(true);
    // good + mystery (warn-load) load; badCore + badShared are offenders.
    expect(decision.load.sort()).toEqual(['good', 'mystery']);
    expect(decision.offenders.map((o) => o.id).sort()).toEqual(['badCore', 'badShared']);
    expect(decision.skip).toEqual([]);
  });

  it('prod: incompatible + unknown are skipped, page does NOT block', () => {
    const decision = decideCompat(ids, getMeta, HOST, PROD);
    expect(decision.block).toBe(false);
    expect(decision.load).toEqual(['good']);
    expect(decision.skip.map((s) => s.id).sort()).toEqual(['badCore', 'badShared', 'mystery']);
    expect(decision.offenders).toEqual([]);
  });

  it('happy path: an all-compatible registry loads everything (no skip/offenders) in BOTH modes', () => {
    const allGood: Record<string, RemoteCompatMetadata> = {
      a: COMPATIBLE,
      b: COMPATIBLE,
      c: COMPATIBLE,
    };
    const allIds = Object.keys(allGood);
    for (const policy of [NON_PROD, PROD]) {
      const decision = decideCompat(allIds, (id) => allGood[id], HOST, policy);
      expect(decision.load).toEqual(allIds);
      expect(decision.skip).toEqual([]);
      expect(decision.offenders).toEqual([]);
      expect(decision.block).toBe(false);
    }
  });

  it('is deterministic and does not mutate its inputs', () => {
    const snapshot = JSON.stringify(registry);
    const a = decideCompat(ids, getMeta, HOST, PROD);
    const b = decideCompat(ids, getMeta, HOST, PROD);
    expect(a).toEqual(b);
    expect(JSON.stringify(registry)).toBe(snapshot);
  });
});
