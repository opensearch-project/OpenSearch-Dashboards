/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import semver from 'semver';
import { getBundledCatalog, loadCatalog, validateCatalogEntry } from '../catalog';
import { OSD_KNOWN_VERSION } from '../version_filter';

describe('catalog loading', () => {
  it('loads the bundled catalog with the expected rule ids', () => {
    const ids = getBundledCatalog().map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'head-without-sort',
        'division-by-zero',
        'field-validation',
        'invalid-capture-group-name',
        'agg-on-text',
        'expand-on-non-array',
        'flat-object-subfield',
        'type-mismatch-numeric',
      ])
    );
  });

  it('ships expand-on-non-array disabled by default (opt-in only)', () => {
    const expand = getBundledCatalog().find((c) => c.id === 'expand-on-non-array');
    expect(expand?.enabled).toBe(false);
  });

  it('marks the type-aware rules as needing context', () => {
    const byId = new Map(getBundledCatalog().map((c) => [c.id, c]));
    for (const id of [
      'agg-on-text',
      'expand-on-non-array',
      'flat-object-subfield',
      'type-mismatch-numeric',
    ]) {
      expect(byId.get(id)?.needsContext).toBe(true);
    }
  });

  it('keeps exactly the valid entries and drops malformed ones', () => {
    const entries = [
      {
        id: 'a',
        detector: 'a',
        enabled: true,
        severity: 'error',
        message: 'm',
        docUrl: 'd',
        appliesTo: {},
      },
      { id: 'b' }, // malformed
      {
        id: 'c',
        detector: 'c',
        enabled: true,
        severity: 'bogus',
        message: 'm',
        docUrl: 'd',
        appliesTo: {},
      },
      null,
      'not an object',
    ];
    const result = loadCatalog(entries);
    expect(result.map((e) => e.id)).toEqual(['a']);
  });

  it('returns an empty catalog for a non-array', () => {
    expect(loadCatalog({} as unknown)).toEqual([]);
  });

  it('validates a single entry', () => {
    expect(validateCatalogEntry({ id: 'x' })).toBeNull();
    expect(
      validateCatalogEntry({
        id: 'x',
        detector: 'x',
        enabled: true,
        severity: 'warning',
        message: 'm',
        docUrl: 'd',
        appliesTo: { minVersion: '3.4.0', engine: 'calcite' },
      })
    ).not.toBeNull();
  });

  it('rejects an invalid engine predicate', () => {
    expect(
      validateCatalogEntry({
        id: 'x',
        detector: 'x',
        enabled: true,
        severity: 'warning',
        message: 'm',
        docUrl: 'd',
        appliesTo: { engine: 'spark' },
      })
    ).toBeNull();
  });

  // OSD_KNOWN_VERSION is the *undefined-version* self-suppress horizon: when a
  // cluster's version is unknown, rules with minVersion above this threshold are
  // suppressed (conservative). It is NOT a ceiling for known-version clusters.
  // This test guards against forgetting to bump OSD_KNOWN_VERSION when adding a
  // new rule — without a bump, the rule would be suppressed on unknown-version
  // clusters even if the rule's minVersion is reachable.
  it('keeps OSD_KNOWN_VERSION at or above every rule minVersion', () => {
    const knownVersion = semver.coerce(OSD_KNOWN_VERSION)?.version;
    expect(knownVersion).toBeTruthy();

    for (const entry of getBundledCatalog()) {
      const minVersion = entry.appliesTo.minVersion;
      if (!minVersion) {
        continue;
      }
      const coercedMin = semver.coerce(minVersion)?.version;
      expect(coercedMin).toBeTruthy();
      expect(semver.gte(knownVersion!, coercedMin!)).toBe(true);
    }
  });
});
