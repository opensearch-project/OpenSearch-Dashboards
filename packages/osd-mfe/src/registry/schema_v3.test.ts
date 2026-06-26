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

/**
 * Tests for the v3 registry schema + v2→v3 migration (Phase 16, Story 1).
 *
 * Coverage axes:
 *  - v3 type contract: validate accepts each fixture shape (fully-populated,
 *    migration-only, partial, layered+v3)
 *  - validateV3 rejection: empty fields, wrong shape, bad integrity prefix,
 *    wrong schemaVersion, non-object themes
 *  - migrateV2ToV3 round-trip with and without defaults
 *  - coerceToV3Document on v1 / v2 / v3 / unknown input
 *  - coerceToV2Document downgrade path on v3 input (forward-compat for v2 consumers)
 *  - detectRegistryShape on v3 input
 *  - audit-log AuditEntry with op='migrate-v2-to-v3' round-trips through JSON
 */

import { AuditEntry } from './update_cli_v2';
import {
  V2Document,
  SCHEMA_VERSION_V2,
  detectRegistryShape,
  coerceToV2Document,
} from './schema_v2';
import {
  SCHEMA_VERSION_V3,
  V3MigrationDefaults,
  validateV3,
  assertValidV3Document,
  migrateV2ToV3,
  coerceToV3Document,
} from './schema_v3';
import {
  FIXTURE_CORE_ASSET,
  FIXTURE_ORCHESTRATOR_ASSET,
  FIXTURE_SHARED_DEPS_CSS_ASSET,
  FIXTURE_THEME_LIGHT_ASSET,
  FIXTURE_THEME_DARK_ASSET,
  fixtureV3FullyPopulated,
  fixtureV3MigrationOnly,
  fixtureV3PartiallyPopulated,
  fixtureV3WithBadIntegrity,
  fixtureV3WithCanaryAndTenant,
  fixtureV3MigrationDefaultsAll,
} from './fixtures_v3';
import {
  fixtureV1Doc,
  fixtureV2DefaultOnly,
  fixtureV2WithCanary,
  fixtureV2WithTenantOverride,
} from './fixtures_v2';

describe('v3 registry schema — validateV3() acceptance', () => {
  it('accepts the fully-populated v3 fixture (all four v3 fields set)', () => {
    expect(validateV3(fixtureV3FullyPopulated())).toEqual({ valid: true, errors: [] });
  });

  it('accepts the migration-only v3 fixture (no v3 fields set)', () => {
    expect(validateV3(fixtureV3MigrationOnly())).toEqual({ valid: true, errors: [] });
  });

  it('accepts a partially-populated v3 fixture (only core+orchestrator set)', () => {
    const doc = fixtureV3PartiallyPopulated();
    expect(doc.sharedDepsCss).toBeUndefined();
    expect(doc.themes).toBeUndefined();
    expect(validateV3(doc).valid).toBe(true);
  });

  it('accepts a v3 doc layering v2 canary+tenant on top of v3 fields', () => {
    expect(validateV3(fixtureV3WithCanaryAndTenant()).valid).toBe(true);
  });

  it('accepts a v3 asset descriptor WITHOUT integrity (same-origin fallback URL)', () => {
    const doc = fixtureV3MigrationOnly();
    doc.core = {
      url: '/bundles/core/core.entry.js',
      version: '3.5.0-dev',
      // integrity omitted on purpose
    };
    expect(validateV3(doc).valid).toBe(true);
  });

  it('accepts a v3 doc with empty themes record', () => {
    const doc = fixtureV3FullyPopulated();
    doc.themes = {};
    expect(validateV3(doc).valid).toBe(true);
  });
});

describe('v3 registry schema — validateV3() rejection', () => {
  it.each([null, undefined, 42, 'nope', []])('rejects non-object input: %p', (input) => {
    const result = validateV3(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('v3 registry must be an object');
  });

  it('rejects a doc with schemaVersion: 2 (not v3)', () => {
    const v2: V2Document = fixtureV2DefaultOnly();
    const result = validateV3(v2);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('schemaVersion must equal 3'))).toBe(true);
  });

  it('rejects malformed integrity (sha256- not allowed)', () => {
    const result = validateV3(fixtureV3WithBadIntegrity());
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('core.integrity') && e.includes('sha384-'))).toBe(
      true
    );
  });

  it('rejects empty-string integrity on core', () => {
    const doc = fixtureV3FullyPopulated();
    doc.core = { ...FIXTURE_CORE_ASSET, integrity: '' };
    const result = validateV3(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('core.integrity') && e.includes('non-empty'))).toBe(
      true
    );
  });

  it('rejects orchestrator with empty url', () => {
    const doc = fixtureV3FullyPopulated();
    doc.orchestrator = { ...FIXTURE_ORCHESTRATOR_ASSET, url: '' };
    const result = validateV3(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('orchestrator.url'))).toBe(true);
  });

  it('rejects sharedDepsCss missing version', () => {
    const doc = fixtureV3FullyPopulated();
    doc.sharedDepsCss = {
      url: FIXTURE_SHARED_DEPS_CSS_ASSET.url,
      integrity: FIXTURE_SHARED_DEPS_CSS_ASSET.integrity,
    } as never;
    const result = validateV3(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('sharedDepsCss.version'))).toBe(true);
  });

  it('rejects themes that is not an object (array supplied)', () => {
    const doc = fixtureV3FullyPopulated();
    ((doc as unknown) as { themes: unknown }).themes = [];
    const result = validateV3(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('themes'))).toBe(true);
  });

  it('rejects a theme entry with malformed integrity', () => {
    const doc = fixtureV3FullyPopulated();
    doc.themes = {
      light: { ...FIXTURE_THEME_LIGHT_ASSET, integrity: 'NOT-sha384-bogus' },
      dark: { ...FIXTURE_THEME_DARK_ASSET },
    };
    const result = validateV3(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('themes.light.integrity'))).toBe(true);
  });

  it('assertValidV3Document throws on rejection with a path-prefixed message', () => {
    expect(() => assertValidV3Document(fixtureV3WithBadIntegrity())).toThrow(/core\.integrity/);
  });

  it('inherits v2-substructure rejection (default.mfes empty entry)', () => {
    const doc = fixtureV3FullyPopulated();
    (doc.default.mfes as Record<string, unknown>).invalid = {
      // Missing required v2 MfeEntry fields.
      version: '',
    };
    const result = validateV3(doc);
    expect(result.valid).toBe(false);
    // Re-emitted v2 errors retain their v2-relative path prefix.
    expect(result.errors.some((e) => e.includes('default.mfes.invalid'))).toBe(true);
  });
});

describe('v2 → v3 migration: migrateV2ToV3()', () => {
  it('without defaults: returns a v3 doc with no v3-only fields set', () => {
    const v2 = fixtureV2DefaultOnly();
    const v3 = migrateV2ToV3(v2);
    expect(v3.schemaVersion).toBe(SCHEMA_VERSION_V3);
    expect(v3.generatedAt).toBe(v2.generatedAt);
    expect(v3.core).toBeUndefined();
    expect(v3.orchestrator).toBeUndefined();
    expect(v3.sharedDepsCss).toBeUndefined();
    expect(v3.themes).toBeUndefined();
    // v2 substructure preserved verbatim.
    expect(v3.default).toEqual(v2.default);
    expect(v3.rollouts).toEqual(v2.rollouts);
    expect(v3.tenantOverrides).toEqual(v2.tenantOverrides);
    expect(validateV3(v3).valid).toBe(true);
  });

  it('with full defaults: fills all four v3 fields, validates green', () => {
    const v2 = fixtureV2DefaultOnly();
    const defaults: V3MigrationDefaults = fixtureV3MigrationDefaultsAll();
    const v3 = migrateV2ToV3(v2, defaults);
    expect(v3.core).toEqual(FIXTURE_CORE_ASSET);
    expect(v3.orchestrator).toEqual(FIXTURE_ORCHESTRATOR_ASSET);
    expect(v3.sharedDepsCss).toEqual(FIXTURE_SHARED_DEPS_CSS_ASSET);
    expect(v3.themes).toEqual({
      light: FIXTURE_THEME_LIGHT_ASSET,
      dark: FIXTURE_THEME_DARK_ASSET,
    });
    expect(validateV3(v3).valid).toBe(true);
  });

  it('with partial defaults: only the supplied fields are filled', () => {
    const v2 = fixtureV2DefaultOnly();
    const v3 = migrateV2ToV3(v2, { core: { ...FIXTURE_CORE_ASSET } });
    expect(v3.core).toEqual(FIXTURE_CORE_ASSET);
    expect(v3.orchestrator).toBeUndefined();
    expect(v3.sharedDepsCss).toBeUndefined();
    expect(v3.themes).toBeUndefined();
  });

  it('preserves canary rollouts and tenant overrides verbatim', () => {
    const v2 = fixtureV2WithCanary();
    const v3 = migrateV2ToV3(v2);
    expect(v3.rollouts).toEqual(v2.rollouts);
    // Round-trip lossless: re-extracted v2 sub-shape equals original.
    expect(v3.default).toEqual(v2.default);
  });

  it('does not mutate the input v2 doc', () => {
    const v2 = fixtureV2WithTenantOverride();
    const before = JSON.parse(JSON.stringify(v2));
    migrateV2ToV3(v2, fixtureV3MigrationDefaultsAll());
    expect(v2).toEqual(before);
  });
});

describe('detectRegistryShape() — v3 extension', () => {
  it("returns 'v3' for a doc with schemaVersion: 3", () => {
    expect(detectRegistryShape(fixtureV3FullyPopulated())).toBe('v3');
    expect(detectRegistryShape(fixtureV3MigrationOnly())).toBe('v3');
  });

  it("still returns 'v2' for a v2 doc", () => {
    expect(detectRegistryShape(fixtureV2DefaultOnly())).toBe('v2');
  });

  it("still returns 'v1' for a v1 doc", () => {
    expect(detectRegistryShape(fixtureV1Doc())).toBe('v1');
  });

  it("returns 'unknown' for an unrecognised schemaVersion", () => {
    expect(detectRegistryShape({ schemaVersion: 99 })).toBe('unknown');
  });
});

describe('coerceToV3Document()', () => {
  it('returns a v3 doc unchanged when input is v3 and valid', () => {
    const v3 = fixtureV3FullyPopulated();
    const result = coerceToV3Document(v3);
    expect(result).toEqual(v3);
  });

  it('throws when v3 input is invalid (malformed integrity)', () => {
    expect(() => coerceToV3Document(fixtureV3WithBadIntegrity())).toThrow(/core\.integrity/);
  });

  it('migrates v2 input to v3 with no defaults (v3-only fields stay absent)', () => {
    const v2 = fixtureV2DefaultOnly();
    const v3 = coerceToV3Document(v2);
    expect(v3.schemaVersion).toBe(SCHEMA_VERSION_V3);
    expect(v3.core).toBeUndefined();
    expect(v3.default).toEqual(v2.default);
  });

  it('migrates v2 input to v3 with defaults filled', () => {
    const v2 = fixtureV2DefaultOnly();
    const v3 = coerceToV3Document(v2, fixtureV3MigrationDefaultsAll());
    expect(v3.core).toEqual(FIXTURE_CORE_ASSET);
    expect(v3.themes?.light).toEqual(FIXTURE_THEME_LIGHT_ASSET);
  });

  it('migrates v1 input through v1→v2→v3', () => {
    const v1 = fixtureV1Doc();
    const v3 = coerceToV3Document(v1);
    expect(v3.schemaVersion).toBe(SCHEMA_VERSION_V3);
    expect(v3.rollouts).toEqual([]);
    expect(v3.tenantOverrides).toEqual({});
    expect(Object.keys(v3.default.mfes)).toEqual(Object.keys(v1.mfes));
  });

  it('throws on unknown shape (schemaVersion: 99)', () => {
    expect(() => coerceToV3Document({ schemaVersion: 99 })).toThrow(/Unknown MFE registry shape/);
  });

  it('throws on a v1 doc with malformed v1 substructure', () => {
    expect(() =>
      coerceToV3Document({ schemaVersion: 1, generatedAt: 'bad', sharedDeps: {}, mfes: {} })
    ).toThrow(/cannot auto-migrate to v3/);
  });
});

describe('coerceToV2Document() — v3 downgrade path (forward-compat for v2 consumers)', () => {
  it('downgrades a v3 doc to v2 by stripping v3-only fields', () => {
    const v3 = fixtureV3FullyPopulated();
    const v2 = coerceToV2Document(v3);
    expect(v2.schemaVersion).toBe(SCHEMA_VERSION_V2);
    expect(v2.default).toEqual(v3.default);
    expect(v2.rollouts).toEqual(v3.rollouts);
    expect(v2.tenantOverrides).toEqual(v3.tenantOverrides);
    // v3-only fields are stripped (TypeScript prevents access; runtime check
    // that they're not in the v2 shape).
    expect(((v2 as unknown) as Record<string, unknown>).core).toBeUndefined();
    expect(((v2 as unknown) as Record<string, unknown>).orchestrator).toBeUndefined();
  });

  it('downgrades a v3 doc that only has the v2 substructure (migration-only)', () => {
    const v3 = fixtureV3MigrationOnly();
    const v2 = coerceToV2Document(v3);
    expect(v2.schemaVersion).toBe(SCHEMA_VERSION_V2);
    expect(v2.default).toEqual(v3.default);
  });
});

describe('audit-log shape: AuditEntry carries v3 ops cleanly', () => {
  it("serialises an op='migrate-v2-to-v3' entry through JSON.stringify round-trip", () => {
    // The AuditOp union in update_cli_v2.ts is extended in this story to
    // include 'migrate-v2-to-v3' so Story 2's CLI can emit the entry when it
    // first writes a v3 doc derived from a v2 input.
    const entry: AuditEntry = {
      timestamp: '2026-06-26T12:00:00.000Z',
      op: 'migrate-v2-to-v3',
      target: '<registry-path>',
      before: { schemaVersion: 2 },
      after: { schemaVersion: 3 },
      reason: 'auto-migration on first v3 CLI op',
    };
    const round = JSON.parse(JSON.stringify(entry)) as AuditEntry;
    expect(round).toEqual(entry);
    expect(round.op).toBe('migrate-v2-to-v3');
  });
});
