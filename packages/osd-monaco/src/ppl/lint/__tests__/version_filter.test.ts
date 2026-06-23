/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { appliesTo, OSD_KNOWN_VERSION } from '../version_filter';
import { CatalogEntry } from '../types';

function makeRule(overrides: Partial<CatalogEntry>): CatalogEntry {
  return {
    id: 'r',
    detector: 'r',
    enabled: true,
    severity: 'error',
    message: 'm',
    docUrl: 'd',
    appliesTo: {},
    ...overrides,
  };
}

describe('version_filter appliesTo', () => {
  describe('defined version window', () => {
    it('skips below minVersion', () => {
      const rule = makeRule({ appliesTo: { minVersion: '3.4.0' } });
      expect(appliesTo(rule, '3.3.0', undefined)).toBe(false);
    });

    it('applies at and above minVersion', () => {
      const rule = makeRule({ appliesTo: { minVersion: '3.4.0' } });
      expect(appliesTo(rule, '3.4.0', undefined)).toBe(true);
      expect(appliesTo(rule, OSD_KNOWN_VERSION, undefined)).toBe(true);
    });

    it('minVersion-only rule fires on a cluster newer than OSD_KNOWN_VERSION', () => {
      const rule = makeRule({ appliesTo: { minVersion: '3.4.0' } });
      expect(appliesTo(rule, '99.0.0', undefined)).toBe(true);
    });

    it('version-agnostic rule fires on a cluster newer than OSD_KNOWN_VERSION', () => {
      const rule = makeRule({ appliesTo: {} });
      expect(appliesTo(rule, '3.8.0', undefined)).toBe(true);
    });

    it('respects an explicit maxVersion', () => {
      const rule = makeRule({ appliesTo: { maxVersion: '3.5.0' } });
      expect(appliesTo(rule, '3.5.0', undefined)).toBe(true);
      expect(appliesTo(rule, '3.6.0', undefined)).toBe(false);
    });
  });

  describe('engine predicate', () => {
    it('applies a calcite rule only when source is calcite', () => {
      const rule = makeRule({ severity: 'warning', appliesTo: { engine: 'calcite' } });
      expect(appliesTo(rule, '3.7.0', true)).toBe(true);
      expect(appliesTo(rule, '3.7.0', false)).toBe(false);
    });

    it('ignores engine for rules with no predicate', () => {
      const rule = makeRule({ appliesTo: {} });
      expect(appliesTo(rule, '3.7.0', false)).toBe(true);
    });
  });

  describe('non-coerceable version', () => {
    it('respects maxVersion via unknown-version policy', () => {
      const rule = makeRule({ appliesTo: { maxVersion: '3.5.0' } });
      expect(appliesTo(rule, 'main', undefined, '3.7.0')).toBe(false);
    });

    it('self-suppresses a calcite error rule', () => {
      const rule = makeRule({ severity: 'error', appliesTo: { engine: 'calcite' } });
      expect(appliesTo(rule, 'nightly', undefined)).toBe(false);
    });

    it('runs a plain rule without version constraints', () => {
      const rule = makeRule({ appliesTo: {} });
      expect(appliesTo(rule, 'main', undefined)).toBe(true);
    });
  });

  describe('undefined version policy', () => {
    it('runs a minVersion-only no-engine rule', () => {
      const rule = makeRule({ appliesTo: { minVersion: '3.4.0' } });
      expect(appliesTo(rule, undefined, undefined)).toBe(true);
    });

    it('self-suppresses an open-ended maxVersion rule past the horizon', () => {
      const rule = makeRule({ appliesTo: { maxVersion: '3.0.0' } });
      expect(appliesTo(rule, undefined, undefined)).toBe(false);
    });

    it('self-suppresses a calcite error rule', () => {
      const rule = makeRule({ severity: 'error', appliesTo: { engine: 'calcite' } });
      expect(appliesTo(rule, undefined, undefined)).toBe(false);
    });

    it('runs a calcite warning rule', () => {
      const rule = makeRule({ severity: 'warning', appliesTo: { engine: 'calcite' } });
      expect(appliesTo(rule, undefined, undefined)).toBe(true);
    });
  });
});
