/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { buildOverridesFromSettings } from './lint_overrides';

jest.mock('@osd/monaco', () => ({
  getBundledCatalog: () => [
    { id: 'head-without-sort', enabled: true, severity: 'info' },
    { id: 'division-by-zero', enabled: true, severity: 'warning' },
    { id: 'field-validation', enabled: true, severity: 'warning' },
  ],
}));

function makeUiSettings(rules: unknown): IUiSettingsClient {
  return ({
    get: (key: string, defaultOverride?: unknown) =>
      key === 'query:enhancements:pplLint:rules' ? rules : defaultOverride,
  } as unknown) as IUiSettingsClient;
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
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'field-validation', enabled: false, severity: 'error' }])
    );
    expect(overrides).toEqual({
      'field-validation': { enabled: false, severity: 'error' },
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

  it('ignores unknown rule ids gracefully', () => {
    const overrides = buildOverridesFromSettings(
      makeUiSettings([{ id: 'nonexistent-rule', enabled: false, severity: 'error' }])
    );
    expect(overrides).toEqual({});
  });
});
