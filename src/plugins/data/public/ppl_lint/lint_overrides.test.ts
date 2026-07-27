/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import {
  buildOverridesFromSettings,
  isCommandSuggestionEnabled,
  readExplainMode,
  readRulesSetting,
} from './lint_overrides';

jest.mock('@osd/monaco', () => ({
  getBundledCatalog: () => [
    { id: 'head-without-sort', enabled: true, severity: 'info' },
    { id: 'division-by-zero', enabled: true, severity: 'warning' },
    { id: 'field-validation', enabled: true, severity: 'error' },
  ],
}));

const RULES_KEY = 'query:enhancements:pplLint:rules';

function makeUiSettings(rules: unknown): IUiSettingsClient {
  return {
    isDeclared: (key: string) => key === RULES_KEY,
    get: (key: string, defaultOverride?: unknown) => (key === RULES_KEY ? rules : defaultOverride),
  } as unknown as IUiSettingsClient;
}

/**
 * Stands in for core's UiSettingsClient on a deployment where queryEnhancements
 * is disabled: the key is undeclared, so `get()` throws rather than returning a
 * default. A permissive fake cannot reproduce this, which is why the throw went
 * unnoticed.
 */
function makeUndeclaredUiSettings(): IUiSettingsClient {
  return {
    isDeclared: () => false,
    get: (key: string, defaultOverride?: unknown) => {
      if (defaultOverride !== undefined) {
        return defaultOverride;
      }
      throw new Error(
        `Unexpected \`IUiSettingsClient.get("${key}")\` call on unrecognized configuration setting`
      );
    },
  } as unknown as IUiSettingsClient;
}

describe('buildOverridesFromSettings', () => {
  it('returns an empty map when nothing is stored (sparse)', () => {
    const overrides = buildOverridesFromSettings(makeUiSettings(undefined));
    expect(overrides).toEqual({});
  });

  it('omits a stored value that equals the bundled default', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'head-without-sort', enabled: true, severity: 'info' }])
    );
    expect(overrides).toEqual({});
  });

  it('emits only the field that differs from the default', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'head-without-sort', enabled: false, severity: 'info' }])
    );
    expect(overrides).toEqual({ 'head-without-sort': { enabled: false } });
  });

  it('passes through an allowed severity change', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'head-without-sort', enabled: true, severity: 'error' }])
    );
    expect(overrides).toEqual({ 'head-without-sort': { severity: 'error' } });
  });

  it('clamps a silent-failure rule up to its severity floor', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'division-by-zero', enabled: true, severity: 'info' }])
    );
    expect(overrides).toEqual({});
  });

  it('still allows disabling a silent-failure rule (floor only clamps severity)', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'division-by-zero', enabled: false, severity: 'info' }])
    );
    expect(overrides).toEqual({ 'division-by-zero': { enabled: false } });
  });

  it('clamps a downgrade but keeps a value at-or-above the floor', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'division-by-zero', enabled: true, severity: 'error' }])
    );
    expect(overrides).toEqual({ 'division-by-zero': { severity: 'error' } });
  });

  it('combines enabled + severity changes for a non-floored rule', () => {
    // field-validation's catalog default is `error`, so a downgrade to `warning`
    // is the severity change here (there is no MIN_SEVERITY floor on this rule).
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'field-validation', enabled: false, severity: 'warning' }])
    );
    expect(overrides).toEqual({
      'field-validation': { enabled: false, severity: 'warning' },
    });
  });

  it('handles multiple rules in one array', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([
        { id: 'head-without-sort', enabled: false, severity: 'info' },
        { id: 'division-by-zero', enabled: true, severity: 'error' },
      ])
    );
    expect(overrides).toEqual({
      'head-without-sort': { enabled: false },
      'division-by-zero': { severity: 'error' },
    });
  });

  it('ignores an unknown severity on a non-floored rule (no patch)', () => {
    // 'critical' is not a real level; with a missing membership check the junk
    // value would leak straight into the override.
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'head-without-sort', enabled: true, severity: 'critical' as never }])
    );
    expect(overrides).toEqual({});
  });

  it('ignores an unknown severity on a floored rule without bypassing the floor', () => {
    // Regression: an unknown severity makes SEV_RANK[...] undefined, so the floor
    // comparison is false — without the membership check 'critical' would slip
    // past the division-by-zero floor instead of being dropped.
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'division-by-zero', enabled: true, severity: 'critical' as never }])
    );
    expect(overrides).toEqual({});
  });

  it('ignores unknown rule ids gracefully', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'nonexistent-rule', enabled: false, severity: 'error' }])
    );
    expect(overrides).toEqual({});
  });

  it('does not treat command-suggestion as a catalog override', () => {
    // command-suggestion is a syntax-channel toggle, not a catalog rule, so it
    // must not leak into the bundle rule overrides.
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'command-suggestion', enabled: false }])
    );
    expect(overrides).toEqual({});
  });
});

describe('isCommandSuggestionEnabled', () => {
  it('defaults to enabled when the setting is unset', () => {
    expect(isCommandSuggestionEnabled(makeUiSettings(undefined))).toBe(true);
  });

  it('defaults to enabled when the entry is absent from the array', () => {
    expect(
      isCommandSuggestionEnabled(
        makeUiSettings([{ id: 'field-validation', enabled: true, severity: 'error' }])
      )
    ).toBe(true);
  });

  it('returns false only when the entry is explicitly disabled', () => {
    expect(
      isCommandSuggestionEnabled(makeUiSettings([{ id: 'command-suggestion', enabled: false }]))
    ).toBe(false);
  });

  it('returns true when the entry is explicitly enabled', () => {
    expect(
      isCommandSuggestionEnabled(makeUiSettings([{ id: 'command-suggestion', enabled: true }]))
    ).toBe(true);
  });

  it('reads command-suggestion from the new object shape too', () => {
    expect(
      isCommandSuggestionEnabled(
        makeUiSettings({ mode: 'fast', rules: [{ id: 'command-suggestion', enabled: false }] })
      )
    ).toBe(false);
  });
});

describe('readRulesSetting (shape migration)', () => {
  it('treats a legacy top-level array as the default (fast) mode', () => {
    const rules = [{ id: 'head-without-sort', enabled: false }];
    expect(readRulesSetting(makeUiSettings(rules))).toEqual({ mode: 'fast', rules });
  });

  it('reads the new object shape with an explicit mode', () => {
    const rules = [{ id: 'head-without-sort', enabled: true }];
    expect(readRulesSetting(makeUiSettings({ mode: 'fast', rules }))).toEqual({
      mode: 'fast',
      rules,
    });
  });

  it('defaults an object with an unknown mode to fast', () => {
    expect(readRulesSetting(makeUiSettings({ mode: 'sideways', rules: [] })).mode).toBe('fast');
  });

  it('falls back to an empty rule list at the default mode for unset or garbage', () => {
    expect(readRulesSetting(makeUiSettings(undefined))).toEqual({ mode: 'fast', rules: [] });
    expect(readRulesSetting(makeUiSettings(42))).toEqual({ mode: 'fast', rules: [] });
    expect(readRulesSetting(makeUiSettings({ rules: 'nope' }))).toEqual({
      mode: 'fast',
      rules: [],
    });
  });

  it('builds overrides from the rules inside the object shape', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings({
        mode: 'thorough',
        rules: [{ id: 'head-without-sort', enabled: false, severity: 'info' }],
      })
    );
    expect(overrides).toEqual({ 'head-without-sort': { enabled: false } });
  });
});

describe('readExplainMode', () => {
  it('defaults to fast when unset (and for a legacy array)', () => {
    // Thorough fires up to four extra probe requests per pause, so it must be
    // opted into rather than inherited.
    expect(readExplainMode(makeUiSettings(undefined))).toBe('fast');
    expect(readExplainMode(makeUiSettings([{ id: 'head-without-sort', enabled: true }]))).toBe(
      'fast'
    );
  });

  it('returns thorough only when the object shape explicitly sets it', () => {
    expect(readExplainMode(makeUiSettings({ mode: 'thorough', rules: [] }))).toBe('thorough');
    expect(readExplainMode(makeUiSettings({ mode: 'fast', rules: [] }))).toBe('fast');
    // An unrecognized mode falls back to the default rather than to thorough.
    expect(readExplainMode(makeUiSettings({ mode: 'bogus', rules: [] }))).toBe('fast');
  });
});

describe('an undeclared lint-rules setting (queryEnhancements disabled)', () => {
  // Both readers run while building the lint context, which the query editor does
  // on mount with no capability check — so a throw here breaks the editor even
  // when lint is off.
  it('does not throw and falls back to catalog defaults', () => {
    const uiSettings = makeUndeclaredUiSettings();
    expect(() => buildOverridesFromSettings(uiSettings)).not.toThrow();
    expect(buildOverridesFromSettings(uiSettings)).toEqual({});
    expect(() => isCommandSuggestionEnabled(uiSettings)).not.toThrow();
    expect(isCommandSuggestionEnabled(uiSettings)).toBe(true);
    expect(() => readExplainMode(uiSettings)).not.toThrow();
    expect(readExplainMode(uiSettings)).toBe('fast');
  });
});
