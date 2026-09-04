/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { UiSettingsParams } from 'opensearch-dashboards/server';
import { getPplLintRuleSettings } from './ui_settings';
import { UI_SETTINGS } from '../../data/common';

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
const DEFAULT_ON_RULES = [
  'agg-on-text',
  'command-suggestion',
  'division-by-zero',
  'enabled-false-object',
  'field-validation',
  'invalid-capture-group-name',
  'multisearch-min-subsearch',
  'replace-wildcard-asymmetry',
  'rex-scan-cost',
  'type-mismatch-numeric',
  'union-min-datasets',
  'unsupported-window-function-in-eventstats',
  'wildcard-source-zero-match',
];
const DEFAULT_OFF_RULES = [
  'dedup-consecutive-unsupported',
  'disabled-join-type',
  'flat-object-subfield',
  'head-without-sort',
  'operation-not-pushed',
  'operation-pushed-as-script',
];

describe('query_enhancements PPL lint rules uiSetting', () => {
  describe('registration', () => {
    it('registers a single key for all lint rules', () => {
      const settings = getPplLintRuleSettings(false);
      expect(settings[KEY]).toBeDefined();
      expect(Object.keys(settings)).toHaveLength(1);
    });

    it('defaults to a { mode, rules } object: fast mode + the bundled catalog plus command-suggestion', () => {
      const settings = getPplLintRuleSettings(false);
      const value = JSON.parse(settings[KEY].value as string);
      expect(value).toEqual({
        // Fast is the default: probe-backed narrowing ("thorough") issues up to
        // four extra requests per pause, so it is opt-in. The toggle rides
        // beside the list.
        mode: 'fast',
        rules: [
          ...bundledCatalog.map((r) => ({ id: r.id, enabled: r.enabled, severity: r.severity })),
          // command-suggestion is a syntax-channel toggle, not a catalog rule, and
          // carries no severity.
          { id: 'command-suggestion', enabled: true },
        ],
      });
    });

    it('ships the exact 13 enabled checks and six default-off rules', () => {
      const settings = getPplLintRuleSettings(false);
      const { rules } = JSON.parse(settings[KEY].value as string);
      expect(
        rules
          .filter((rule: { enabled: boolean }) => rule.enabled)
          .map((rule: { id: string }) => rule.id)
          .sort()
      ).toEqual(DEFAULT_ON_RULES);
      expect(
        rules
          .filter((rule: { enabled: boolean }) => !rule.enabled)
          .map((rule: { id: string }) => rule.id)
          .sort()
      ).toEqual(DEFAULT_OFF_RULES);
      expect(
        rules.find((rule: { id: string }) => rule.id === 'wildcard-source-zero-match')
      ).toEqual({
        id: 'wildcard-source-zero-match',
        enabled: true,
        severity: 'warning',
      });
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
    const withRules = (rules: unknown, mode: unknown = 'thorough') => ({ mode, rules });

    it('accepts a well-formed { mode, rules } object', () => {
      expect(() =>
        validate(
          withRules([
            { id: 'head-without-sort', enabled: true, severity: 'info' },
            { id: 'division-by-zero', enabled: false, severity: 'error' },
          ])
        )
      ).not.toThrow();
    });

    it('accepts an empty rule list', () => {
      expect(() => validate(withRules([]))).not.toThrow();
    });

    it('accepts both modes', () => {
      expect(() => validate(withRules([], 'fast'))).not.toThrow();
      expect(() => validate(withRules([], 'thorough'))).not.toThrow();
    });

    it('rejects an unknown mode', () => {
      expect(() => validate(withRules([], 'sideways'))).toThrow();
    });

    it('rejects an unknown severity', () => {
      expect(() =>
        validate(withRules([{ id: 'head-without-sort', enabled: true, severity: 'critical' }]))
      ).toThrow();
    });

    it('rejects a non-boolean enabled', () => {
      expect(() =>
        validate(withRules([{ id: 'head-without-sort', enabled: 'yes', severity: 'info' }]))
      ).toThrow();
    });

    it('accepts an entry with no severity (the command-suggestion toggle shape)', () => {
      expect(() =>
        validate(withRules([{ id: 'command-suggestion', enabled: true }]))
      ).not.toThrow();
    });

    it('rejects a missing required field (id or enabled)', () => {
      // severity is optional, but id and enabled are still required.
      expect(() => validate(withRules([{ id: 'head-without-sort', severity: 'info' }]))).toThrow();
      expect(() => validate(withRules([{ enabled: true, severity: 'info' }]))).toThrow();
    });

    it('accepts the legacy bare-array value persisted by earlier releases', () => {
      // The stored shape moved to { mode, rules }, but the server validates
      // persisted user values against this schema on every read
      // (UiSettingsClient.onReadHook) and silently drops values that fail.
      // Rejecting the legacy array would wipe an upgrading user's saved rule
      // customizations, so both shapes must validate.
      expect(() => validate([{ id: 'x', enabled: true, severity: 'info' }])).not.toThrow();
      expect(() => validate([])).not.toThrow();
      expect(() => validate('warning')).toThrow();
    });

    it('accepts both shapes as the JSON strings the ui settings client persists', () => {
      // type:'json' settings are stored stringified; onReadHook validates the
      // raw string, relying on the schema's string coercion. Both shapes must
      // survive that path.
      expect(() =>
        validate(JSON.stringify([{ id: 'x', enabled: true, severity: 'info' }]))
      ).not.toThrow();
      expect(() =>
        validate(
          JSON.stringify({ mode: 'fast', rules: [{ id: 'x', enabled: true, severity: 'info' }] })
        )
      ).not.toThrow();
      expect(() => validate('not json')).toThrow();
    });

    it('rejects an object missing the rules list', () => {
      expect(() => validate({ mode: 'fast' })).toThrow();
    });
  });
});
