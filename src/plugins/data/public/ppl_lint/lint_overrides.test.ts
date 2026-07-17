/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { buildOverridesFromSettings, isCommandSuggestionEnabled } from './lint_overrides';

jest.mock('@osd/monaco', () => ({
  getBundledCatalog: () => [
    { id: 'head-without-sort', enabled: true, severity: 'info' },
    { id: 'division-by-zero', enabled: true, severity: 'warning' },
    { id: 'field-validation', enabled: true, severity: 'error' },
    { id: 'agg-on-text', enabled: true, severity: 'warning' },
    { id: 'type-mismatch-numeric', enabled: true, severity: 'warning' },
  ],
}));

function makeUiSettings(rules: unknown): IUiSettingsClient {
  return {
    get: (key: string, defaultOverride?: unknown) =>
      key === 'query:enhancements:pplLint:rules' ? rules : defaultOverride,
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

  it('clamps agg-on-text up to its warning floor (info downgrade blocked)', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'agg-on-text', enabled: true, severity: 'info' }])
    );
    expect(overrides).toEqual({});
  });

  it('clamps type-mismatch-numeric up to its warning floor (info downgrade blocked)', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'type-mismatch-numeric', enabled: true, severity: 'info' }])
    );
    expect(overrides).toEqual({});
  });

  it('still allows disabling a floored PR A rule', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'agg-on-text', enabled: false, severity: 'info' }])
    );
    expect(overrides).toEqual({ 'agg-on-text': { enabled: false } });
  });

  it('rejects an inherited Object property name as a severity (own-property check)', () => {
    // 'toString' is `in SEV_RANK` via the prototype chain, but is not an own
    // property, so the own-property guard must drop it rather than clamp/pass it.
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'agg-on-text', enabled: true, severity: 'toString' as never }])
    );
    expect(overrides).toEqual({});
  });


  it('ignores unknown rule ids gracefully', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'nonexistent-rule', enabled: false, severity: 'error' }])
    );
    expect(overrides).toEqual({});
  });

  it('ignores a prototype-chain name as severity (hasOwnProperty, not `in`)', () => {
    // 'toString' resolves on SEV_RANK's prototype, so a plain `severity in SEV_RANK`
    // check would treat it as a valid level; the own-property guard rejects it.
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'head-without-sort', enabled: true, severity: 'toString' as never }])
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
});
