/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildVariableOptionDisplayTextMap,
  getVariableOptionDisplayText,
} from './variable_option_display_utils';

describe('variable option display utils', () => {
  it('should display unique labels as labels', () => {
    const options = [
      { value: 'dev', label: 'Development' },
      { value: 'prod', label: 'Production' },
    ];
    const displayTextMap = buildVariableOptionDisplayTextMap(options);

    expect(getVariableOptionDisplayText(options[0], displayTextMap)).toBe('Development');
    expect(getVariableOptionDisplayText(options[1], displayTextMap)).toBe('Production');
  });

  it('should append values when display labels are duplicated', () => {
    const options = [
      { value: 'dev-us', label: 'Development' },
      { value: 'dev-eu', label: 'Development' },
      { value: 'prod', label: 'Production' },
    ];
    const displayTextMap = buildVariableOptionDisplayTextMap(options);

    expect(getVariableOptionDisplayText(options[0], displayTextMap)).toBe('Development (dev-us)');
    expect(getVariableOptionDisplayText(options[1], displayTextMap)).toBe('Development (dev-eu)');
    expect(getVariableOptionDisplayText(options[2], displayTextMap)).toBe('Production');
  });

  it('should fall back to values when labels are empty', () => {
    const options = [
      { value: 'dev', label: '' },
      { value: 'prod', label: '   ' },
    ];
    const displayTextMap = buildVariableOptionDisplayTextMap(options);

    expect(getVariableOptionDisplayText(options[0], displayTextMap)).toBe('dev');
    expect(getVariableOptionDisplayText(options[1], displayTextMap)).toBe('prod');
  });

  it('should disambiguate duplicate visible text after label fallback', () => {
    const options = [{ value: 'dev' }, { value: 'prod', label: 'dev' }];
    const displayTextMap = buildVariableOptionDisplayTextMap(options);

    expect(getVariableOptionDisplayText(options[0], displayTextMap)).toBe('dev');
    expect(getVariableOptionDisplayText(options[1], displayTextMap)).toBe('dev (prod)');
  });
});
