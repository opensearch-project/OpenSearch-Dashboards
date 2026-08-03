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
    it('suppresses an error-severity minVersion rule when the version is unknown', () => {
      // The floor cannot be shown to be met, so a red squiggle would be a guess.
      const rule = makeRule({ appliesTo: { minVersion: '3.4.0' } });
      expect(appliesTo(rule, undefined, undefined)).toBe(false);
    });

    it('still runs a warning-severity minVersion rule when the version is unknown', () => {
      const rule = makeRule({ severity: 'warning', appliesTo: { minVersion: '3.4.0' } });
      expect(appliesTo(rule, undefined, undefined)).toBe(true);
    });

    it('runs a version-agnostic rule at every severity', () => {
      expect(appliesTo(makeRule({ appliesTo: {} }), undefined, undefined)).toBe(true);
      expect(appliesTo(makeRule({ severity: 'info', appliesTo: {} }), undefined, undefined)).toBe(
        true
      );
    });

    it('ignores a floor semver cannot read, matching the known-version path', () => {
      const rule = makeRule({ appliesTo: { minVersion: 'main' } });
      expect(appliesTo(rule, undefined, undefined)).toBe(true);
      expect(appliesTo(rule, '3.8.0', undefined)).toBe(true);
    });

    it('self-suppresses an open-ended maxVersion rule past the horizon', () => {
      const rule = makeRule({ appliesTo: { maxVersion: '3.0.0' } });
      expect(appliesTo(rule, undefined, undefined)).toBe(false);
    });

    it('self-suppresses a calcite error rule', () => {
      const rule = makeRule({ severity: 'error', appliesTo: { engine: 'calcite' } });
      expect(appliesTo(rule, undefined, undefined)).toBe(false);
    });

    it('suppresses a calcite rule unless the engine is measured as calcite', () => {
      // Version-string quality says nothing about which engine runs, so an
      // unknown version must not become a licence to assume Calcite.
      const rule = makeRule({ severity: 'warning', appliesTo: { engine: 'calcite' } });
      expect(appliesTo(rule, undefined, undefined)).toBe(false);
      expect(appliesTo(rule, undefined, false)).toBe(false);
      expect(appliesTo(rule, undefined, true)).toBe(true);
    });

    it('treats a blank version the same as an absent one', () => {
      const rule = makeRule({ severity: 'warning', appliesTo: { engine: 'calcite' } });
      expect(appliesTo(rule, '', false)).toBe(false);
      expect(appliesTo(rule, '   ', false)).toBe(false);
      expect(appliesTo(rule, '', true)).toBe(true);
    });

    it('honours a known-false engine on an unparseable version too', () => {
      // Regression: the unparseable path used to recurse into a branch that
      // ignored isCalcite, so 'main' leaked what '2.19.0' suppressed.
      const rule = makeRule({ severity: 'warning', appliesTo: { engine: 'calcite' } });
      expect(appliesTo(rule, '2.19.0', false)).toBe(false);
      expect(appliesTo(rule, 'main', false)).toBe(false);
      expect(appliesTo(rule, 'not-a-version', false)).toBe(false);
    });

    it('decides from the catalog severity, not a user-overridden one', () => {
      // runLint merges per-rule overrides before calling appliesTo, so the
      // rule's own severity can be user-edited. Suppression must not be.
      const downgraded = makeRule({ severity: 'warning', appliesTo: { minVersion: '3.4.0' } });
      expect(appliesTo(downgraded, undefined, undefined, OSD_KNOWN_VERSION, 'error')).toBe(false);

      const raised = makeRule({ severity: 'error', appliesTo: { minVersion: '3.4.0' } });
      expect(appliesTo(raised, undefined, undefined, OSD_KNOWN_VERSION, 'warning')).toBe(true);
    });
  });
});
