/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ENABLE_QUERY_PROFILING_SETTING } from '../common';
import { exploreUiSettings } from './explore_ui_settings';

describe('exploreUiSettings', () => {
  it('registers the query profiling Advanced Setting, disabled by default', () => {
    const setting = exploreUiSettings[ENABLE_QUERY_PROFILING_SETTING];

    expect(setting).toBeDefined();
    expect(setting.value).toBe(false);
    expect(setting.category).toEqual(['explore']);
  });

  it('validates the query profiling setting as a boolean', () => {
    const settingSchema = exploreUiSettings[ENABLE_QUERY_PROFILING_SETTING].schema;

    expect(settingSchema).toBeDefined();
    expect(() => settingSchema?.validate(true)).not.toThrow();
    expect(() => settingSchema?.validate('not-a-boolean')).toThrow();
  });
});
