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

import { SCHEMA_VERSION, validate as validateV1, Registry as V1Registry } from './schema';
import {
  SCHEMA_VERSION_V2,
  V2Document,
  validateV2,
  assertValidV2Document,
  migrateV1ToV2,
  detectRegistryShape,
  coerceToV2Document,
} from './schema_v2';
import {
  fixtureV1Doc,
  fixtureV2DefaultOnly,
  fixtureV2WithCanary,
  fixtureV2WithTenantOverride,
  fixtureV2WithCanaryAndTenant,
  FIXTURE_INSPECTOR_DEFAULT,
  FIXTURE_INSPECTOR_CANARY,
  FIXTURE_GENERATED_AT,
} from './fixtures_v2';

describe('v2 registry schema — validateV2() acceptance', () => {
  it('accepts the default-only fixture', () => {
    const result = validateV2(fixtureV2DefaultOnly());
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('accepts the canary fixture (one rollout with userBucketLt)', () => {
    expect(validateV2(fixtureV2WithCanary()).valid).toBe(true);
  });

  it('accepts the tenant-override fixture', () => {
    expect(validateV2(fixtureV2WithTenantOverride()).valid).toBe(true);
  });

  it('accepts the combined canary + tenant fixture', () => {
    expect(validateV2(fixtureV2WithCanaryAndTenant()).valid).toBe(true);
  });

  it('accepts a doc with empty rollouts and empty tenantOverrides', () => {
    const doc = fixtureV2DefaultOnly();
    expect(doc.rollouts).toEqual([]);
    expect(doc.tenantOverrides).toEqual({});
    expect(validateV2(doc).valid).toBe(true);
  });

  it('accepts a rollout match with userBucketGte and userBucketLt forming a tile', () => {
    const doc = fixtureV2DefaultOnly();
    doc.rollouts = [
      {
        id: 'inspector-canary-5-10',
        match: { userBucketGte: 5, userBucketLt: 10 },
        override: { mfes: { inspector: { ...FIXTURE_INSPECTOR_CANARY } } },
      },
    ];
    expect(validateV2(doc).valid).toBe(true);
  });

  it('accepts a rollout match with all three predicates set', () => {
    const doc = fixtureV2DefaultOnly();
    doc.rollouts = [
      {
        id: 'acme-canary',
        match: { userBucketLt: 50, userBucketGte: 0, tenantId: 'acme' },
        override: { mfes: { inspector: { ...FIXTURE_INSPECTOR_CANARY } } },
      },
    ];
    expect(validateV2(doc).valid).toBe(true);
  });
});

describe('v2 registry schema — validateV2() rejection', () => {
  it.each([null, undefined, 42, 'nope', []])('rejects non-object input: %p', (input) => {
    const result = validateV2(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('v2 registry must be an object');
  });

  it('rejects a v1-shaped document (schemaVersion: 1)', () => {
    const v1 = fixtureV1Doc();
    const result = validateV2(v1);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('schemaVersion must equal 2'))).toBe(true);
  });

  it('rejects an unparseable generatedAt', () => {
    const doc = fixtureV2DefaultOnly();
    (doc as unknown as { generatedAt: string }).generatedAt = 'not-a-date';
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('generatedAt'))).toBe(true);
  });

  it('rejects a missing default layer', () => {
    const doc = fixtureV2DefaultOnly();
    delete (doc as { default?: unknown }).default;
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('default must be an object'))).toBe(true);
  });

  it('rejects a default layer with a malformed sharedDeps', () => {
    const doc = fixtureV2DefaultOnly();
    (doc.default.sharedDeps as { url: unknown }).url = '';
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('default.sharedDeps.url must be a non-empty string');
  });

  it('rejects a default mfe entry missing required fields', () => {
    const doc = fixtureV2DefaultOnly();
    doc.default.mfes.inspector = {
      version: '3.5.0+abc',
    } as V2Document['default']['mfes'][string];
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'default.mfes.inspector.remoteEntry must be a non-empty string'
    );
    expect(result.errors).toContain('default.mfes.inspector.scope must be a non-empty string');
    expect(result.errors).toContain('default.mfes.inspector.module must be a non-empty string');
  });

  it('rejects rollouts with a non-array value', () => {
    const doc = fixtureV2DefaultOnly();
    (doc as unknown as { rollouts: unknown }).rollouts = {};
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('rollouts must be an array (use [] for none)');
  });

  it('rejects a rollout missing the id', () => {
    const doc = fixtureV2WithCanary();
    (doc.rollouts[0] as { id: unknown }).id = '';
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('rollouts[0].id must be a non-empty string');
  });

  it('rejects duplicate rollout ids', () => {
    const doc = fixtureV2WithCanary();
    doc.rollouts.push({ ...doc.rollouts[0] });
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('"inspector-canary-5pct" is duplicated; ids must be unique')
      )
    ).toBe(true);
  });

  it.each([
    ['userBucketLt', -1],
    ['userBucketLt', 101],
    ['userBucketLt', 1.5],
    ['userBucketGte', -1],
    ['userBucketGte', 100.5],
    ['userBucketGte', NaN],
  ])('rejects rollout match.%s = %p (out of integer range [0,100])', (key, value) => {
    const doc = fixtureV2WithCanary();
    (doc.rollouts[0].match as Record<string, unknown>)[key] = value;
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes(key))).toBe(true);
  });

  it('rejects rollout match with userBucketGte >= userBucketLt', () => {
    const doc = fixtureV2WithCanary();
    doc.rollouts[0].match = { userBucketGte: 5, userBucketLt: 5 };
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('userBucketGte must be < userBucketLt'))
    ).toBe(true);
  });

  it('rejects a rollout with empty override.mfes (vacuous no-op)', () => {
    const doc = fixtureV2WithCanary();
    doc.rollouts[0].override.mfes = {};
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('override.mfes must contain at least one entry'))
    ).toBe(true);
  });

  it('rejects tenantOverrides that is not an object', () => {
    const doc = fixtureV2WithTenantOverride();
    (doc as unknown as { tenantOverrides: unknown }).tenantOverrides = [];
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('tenantOverrides must be an object (use {} for none)');
  });

  it('rejects a tenantOverrides layer with empty mfes', () => {
    const doc = fixtureV2WithTenantOverride();
    doc.tenantOverrides.acme.mfes = {};
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('tenantOverrides.acme.mfes must contain at least one entry')
      )
    ).toBe(true);
  });

  it('rejects an entry with malformed compat block (Phase 9 carry-forward)', () => {
    const doc = fixtureV2DefaultOnly();
    (doc.default.mfes.inspector as { compat: unknown }).compat = {};
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'default.mfes.inspector.compat.minCoreVersion must be a non-empty string'
    );
    expect(result.errors).toContain(
      'default.mfes.inspector.compat.compatibleCoreRange must be a non-empty string'
    );
  });

  it('rejects an entry with malformed builtAgainst (Phase 9 carry-forward)', () => {
    const doc = fixtureV2DefaultOnly();
    (doc.default.mfes.inspector as { builtAgainst: unknown }).builtAgainst = {
      sharedDeps: {},
    };
    const result = validateV2(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'default.mfes.inspector.builtAgainst.osdVersion must be a non-empty string'
    );
  });
});

describe('v2 registry schema — assertValidV2Document()', () => {
  it('returns the doc when valid', () => {
    const doc = fixtureV2DefaultOnly();
    expect(assertValidV2Document(doc)).toBe(doc);
  });

  it('throws listing the problems when invalid', () => {
    expect(() => assertValidV2Document({ schemaVersion: 2 })).toThrow(/Invalid v2 MFE registry/);
  });
});

describe('v1 → v2 auto-migration', () => {
  it('migrates a v1 doc to a v2 doc with only `default` populated', () => {
    const v1 = fixtureV1Doc();
    const v2 = migrateV1ToV2(v1);
    expect(v2.schemaVersion).toBe(SCHEMA_VERSION_V2);
    expect(v2.generatedAt).toBe(v1.generatedAt);
    expect(v2.default.sharedDeps).toEqual(v1.sharedDeps);
    expect(v2.default.mfes).toEqual(v1.mfes);
    expect(v2.rollouts).toEqual([]);
    expect(v2.tenantOverrides).toEqual({});
  });

  it('produces a v2 doc that passes validateV2', () => {
    const v2 = migrateV1ToV2(fixtureV1Doc());
    const result = validateV2(v2);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('does not mutate the input v1 doc', () => {
    const v1 = fixtureV1Doc();
    const before = JSON.stringify(v1);
    migrateV1ToV2(v1);
    expect(JSON.stringify(v1)).toBe(before);
  });

  it('drops the v1 signature envelope (boot-manifest path is unsigned)', () => {
    const v1 = fixtureV1Doc();
    (v1 as { signature?: unknown }).signature = {
      algorithm: 'HMAC-SHA256',
      keyId: 'test',
      value: 'YWJj',
    };
    const v2 = migrateV1ToV2(v1);
    expect((v2 as unknown as Record<string, unknown>).signature).toBeUndefined();
  });

  it('preserves the canonical (CDN-shaped) v1 doc unchanged for v1 readers', () => {
    // Round-trip safety: a v1 doc that we migrated must STILL validate as v1
    // by the original validator (the canonical CDN registry can never break).
    const v1 = fixtureV1Doc();
    expect(validateV1(v1).valid).toBe(true);
  });

  it('keeps generatedAt stable across migration (audit-log diff stability)', () => {
    const v2 = migrateV1ToV2(fixtureV1Doc());
    expect(v2.generatedAt).toBe(FIXTURE_GENERATED_AT);
  });
});

describe('detectRegistryShape()', () => {
  it('detects v2 by schemaVersion', () => {
    expect(detectRegistryShape(fixtureV2DefaultOnly())).toBe('v2');
  });

  it('detects v1 by schemaVersion', () => {
    expect(detectRegistryShape(fixtureV1Doc())).toBe('v1');
  });

  it('treats a missing schemaVersion as v1 (legacy seed)', () => {
    const v1 = fixtureV1Doc() as unknown as { schemaVersion?: unknown };
    delete v1.schemaVersion;
    expect(detectRegistryShape(v1)).toBe('v1');
  });

  it('returns "unknown" for non-object input', () => {
    expect(detectRegistryShape(null)).toBe('unknown');
    expect(detectRegistryShape(42)).toBe('unknown');
    expect(detectRegistryShape([])).toBe('unknown');
  });

  it('returns "unknown" for an unsupported schemaVersion', () => {
    expect(detectRegistryShape({ schemaVersion: 99 })).toBe('unknown');
  });
});

describe('coerceToV2Document()', () => {
  it('returns a valid v2 doc unchanged (referentially)', () => {
    const doc = fixtureV2DefaultOnly();
    expect(coerceToV2Document(doc)).toBe(doc);
  });

  it('migrates a valid v1 doc to v2 (and the result validates as v2)', () => {
    const v2 = coerceToV2Document(fixtureV1Doc());
    expect(v2.schemaVersion).toBe(SCHEMA_VERSION_V2);
    expect(validateV2(v2).valid).toBe(true);
    // default.mfes carries the v1 inspector entry verbatim.
    expect(v2.default.mfes.inspector).toEqual(FIXTURE_INSPECTOR_DEFAULT);
  });

  it('migrates a v1 doc with missing schemaVersion (treated as 1)', () => {
    const v1 = fixtureV1Doc() as unknown as { schemaVersion?: number };
    delete v1.schemaVersion;
    const v2 = coerceToV2Document(v1);
    expect(v2.schemaVersion).toBe(SCHEMA_VERSION_V2);
    expect(v2.default.mfes.inspector).toEqual(FIXTURE_INSPECTOR_DEFAULT);
  });

  it('throws with a path-prefixed message on invalid v2', () => {
    expect(() => coerceToV2Document({ schemaVersion: 2 })).toThrow(/Invalid v2 MFE registry/);
  });

  it('throws with a v1-prefixed message when a v1-shaped doc is malformed', () => {
    expect(() =>
      coerceToV2Document({ schemaVersion: SCHEMA_VERSION, generatedAt: 'bad' })
    ).toThrow(/Invalid v1 MFE registry/);
  });

  it('throws with an "unknown shape" message on an unrecognised schemaVersion', () => {
    expect(() => coerceToV2Document({ schemaVersion: 99 })).toThrow(/Unknown MFE registry shape/);
  });

  it('does not mutate the input v1 doc', () => {
    const v1 = fixtureV1Doc();
    const before = JSON.stringify(v1);
    coerceToV2Document(v1);
    expect(JSON.stringify(v1)).toBe(before);
  });

  it('round-trip: canonical CDN v1 doc => v2 default-only equivalent', () => {
    // Concretely demonstrates "the canonical CDN registry MUST keep working
    // unchanged via auto-migration on read" (PRD design_spec point 4).
    const v1: V1Registry = fixtureV1Doc();
    const v2 = coerceToV2Document(v1);
    expect(v2.default.sharedDeps).toEqual(v1.sharedDeps);
    expect(Object.keys(v2.default.mfes).sort()).toEqual(Object.keys(v1.mfes).sort());
    for (const id of Object.keys(v1.mfes)) {
      expect(v2.default.mfes[id]).toEqual(v1.mfes[id]);
    }
    expect(v2.rollouts).toEqual([]);
    expect(v2.tenantOverrides).toEqual({});
  });
});
