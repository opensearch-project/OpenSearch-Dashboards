/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { UiSettingsParams } from 'opensearch-dashboards/server';
import { getPplLintRuleSettings } from './ui_settings';
import { UI_SETTINGS } from '../../data/common';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { getValType } from '../../advanced_settings/public/management_app/lib/get_val_type';

interface BundledRule {
  id: string;
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
}
const bundledCatalog: BundledRule[] = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../../../packages/osd-monaco/src/ppl/lint/rules_catalog.json'),
    'utf8'
  )
);

const KEY = UI_SETTINGS.QUERY_ENHANCEMENTS_PPL_LINT_RULES;

describe('query_enhancements PPL lint rules uiSetting', () => {
  describe('registration', () => {
    it('registers a single key for all lint rules', () => {
      const settings = getPplLintRuleSettings(false);
      expect(settings[KEY]).toBeDefined();
      expect(Object.keys(settings)).toHaveLength(1);
    });

    it('defaults to a JSON array matching the bundled catalog', () => {
      const settings = getPplLintRuleSettings(false);
      const value = JSON.parse(settings[KEY].value as string);
      expect(value).toEqual(
        bundledCatalog.map((r) => ({ id: r.id, enabled: r.enabled, severity: r.severity }))
      );
    });

    it('uses type=json', () => {
      const settings = getPplLintRuleSettings(false);
      expect((settings[KEY] as any).type).toBe('json');
    });

    it('does not set requiresPageReload', () => {
      const settings = getPplLintRuleSettings(false);
      expect(settings[KEY].requiresPageReload).toBeFalsy();
    });

    it('groups under the search category', () => {
      const settings = getPplLintRuleSettings(false);
      expect(settings[KEY].category).toEqual(['search']);
    });
  });

  describe('Advanced Settings page compatibility', () => {
    it('does not throw in getValType (the function that crashed the settings page)', () => {
      const settings = getPplLintRuleSettings(false);
      const def = settings[KEY];
      expect(() => getValType(def as any)).not.toThrow();
    });

    it('resolves to "json" type for the settings page renderer', () => {
      const settings = getPplLintRuleSettings(false);
      const def = settings[KEY];
      expect(getValType(def as any)).toBe('json');
    });
  });

  describe('scope', () => {
    it('registers USER + GLOBAL when the workspace feature is off', () => {
      const settings = getPplLintRuleSettings(false);
      expect(settings[KEY].scope).toEqual(['user', 'global']);
    });

    it('adds WORKSPACE between USER and GLOBAL when the workspace feature is on', () => {
      const settings = getPplLintRuleSettings(true);
      expect(settings[KEY].scope).toEqual(['user', 'workspace', 'global']);
    });
  });

  describe('value schema', () => {
    const validate = (value: unknown) => getPplLintRuleSettings(false)[KEY].schema.validate(value);

    it('accepts a well-formed array of rules', () => {
      expect(() =>
        validate([
          { id: 'head-without-sort', enabled: true, severity: 'info' },
          { id: 'division-by-zero', enabled: false, severity: 'error' },
        ])
      ).not.toThrow();
    });

    it('accepts an empty array', () => {
      expect(() => validate([])).not.toThrow();
    });

    it('rejects an unknown severity', () => {
      expect(() =>
        validate([{ id: 'head-without-sort', enabled: true, severity: 'critical' }])
      ).toThrow();
    });

    it('rejects a non-boolean enabled', () => {
      expect(() =>
        validate([{ id: 'head-without-sort', enabled: 'yes', severity: 'info' }])
      ).toThrow();
    });

    it('rejects a missing field', () => {
      expect(() => validate([{ id: 'head-without-sort', enabled: true }])).toThrow();
      expect(() => validate([{ id: 'head-without-sort', severity: 'info' }])).toThrow();
      expect(() => validate([{ enabled: true, severity: 'info' }])).toThrow();
    });

    it('rejects a non-array value', () => {
      expect(() => validate('warning')).toThrow();
      expect(() => validate({ id: 'x', enabled: true, severity: 'info' })).toThrow();
    });
  });
});
