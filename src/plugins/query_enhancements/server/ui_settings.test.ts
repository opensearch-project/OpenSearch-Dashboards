/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { UiSettingsParams } from 'opensearch-dashboards/server';
import { getPplLintRuleSettings } from './ui_settings';
import { UI_SETTINGS } from '../../data/common';

// Read catalog directly (can't import @osd/monaco server-side or cross-package into src/).
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

const PREFIX = UI_SETTINGS.QUERY_ENHANCEMENTS_PPL_LINT_RULE_PREFIX;

const ruleKeys = (settings: Record<string, UiSettingsParams>) =>
  Object.keys(settings).filter((k) => k.startsWith(PREFIX));

describe('query_enhancements per-rule PPL lint uiSettings', () => {
  describe('registration', () => {
    it('registers one key per bundled catalog rule, with the rule prefix', () => {
      const settings = getPplLintRuleSettings(false);
      const keys = ruleKeys(settings);

      expect(keys).toHaveLength(bundledCatalog.length);
      for (const rule of bundledCatalog) {
        expect(settings[`${PREFIX}${rule.id}`]).toBeDefined();
      }
    });

    it('mirrors the bundled catalog enabled/severity as the registered default (§5.1)', () => {
      const settings = getPplLintRuleSettings(false);

      for (const rule of bundledCatalog) {
        expect(settings[`${PREFIX}${rule.id}`].value).toEqual({
          enabled: rule.enabled,
          severity: rule.severity,
        });
      }
    });

    it('does not set requiresPageReload (the editor live-revalidates, §6)', () => {
      const settings = getPplLintRuleSettings(true);
      for (const key of ruleKeys(settings)) {
        expect(settings[key].requiresPageReload).toBeFalsy();
      }
    });

    it('groups the rule keys under the search category', () => {
      const settings = getPplLintRuleSettings(false);
      for (const key of ruleKeys(settings)) {
        expect(settings[key].category).toEqual(['search']);
      }
    });
  });

  describe('scope', () => {
    it('registers USER + GLOBAL when the workspace feature is off', () => {
      const settings = getPplLintRuleSettings(false);
      for (const key of ruleKeys(settings)) {
        expect(settings[key].scope).toEqual(['user', 'global']);
      }
    });

    it('adds WORKSPACE between USER and GLOBAL when the workspace feature is on', () => {
      const settings = getPplLintRuleSettings(true);
      for (const key of ruleKeys(settings)) {
        expect(settings[key].scope).toEqual(['user', 'workspace', 'global']);
      }
    });
  });

  describe('value schema', () => {
    const validate = (settings: Record<string, UiSettingsParams>, ruleId: string) => (
      value: unknown
    ) => settings[`${PREFIX}${ruleId}`].schema.validate(value);

    it('accepts a well-formed { enabled, severity } object for every severity', () => {
      const v = validate(getPplLintRuleSettings(false), 'division-by-zero');
      expect(() => v({ enabled: true, severity: 'error' })).not.toThrow();
      expect(() => v({ enabled: true, severity: 'warning' })).not.toThrow();
      expect(() => v({ enabled: false, severity: 'info' })).not.toThrow();
    });

    it('rejects an unknown severity', () => {
      const v = validate(getPplLintRuleSettings(false), 'division-by-zero');
      expect(() => v({ enabled: true, severity: 'critical' })).toThrow();
    });

    it('rejects a non-boolean enabled', () => {
      const v = validate(getPplLintRuleSettings(false), 'division-by-zero');
      expect(() => v({ enabled: 'yes', severity: 'warning' })).toThrow();
    });

    it('rejects a missing field', () => {
      const v = validate(getPplLintRuleSettings(false), 'division-by-zero');
      expect(() => v({ enabled: true })).toThrow();
      expect(() => v({ severity: 'warning' })).toThrow();
    });

    it('rejects an extra/unknown field', () => {
      const v = validate(getPplLintRuleSettings(false), 'division-by-zero');
      expect(() => v({ enabled: true, severity: 'warning', foo: 1 })).toThrow();
    });

    it('rejects a non-object value', () => {
      const v = validate(getPplLintRuleSettings(false), 'division-by-zero');
      expect(() => v('warning')).toThrow();
      expect(() => v(true)).toThrow();
    });
  });
});
