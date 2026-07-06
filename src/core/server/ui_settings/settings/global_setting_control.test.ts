/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UiSettingsParams } from '../types';
import { UiSettingScope } from '../types';
import { getGlobalSettingControlSetting } from './global_setting_control';

describe('Global setting control setting', () => {
  const settings = getGlobalSettingControlSetting();

  const getValidationFn = (setting: UiSettingsParams) => (value: any) =>
    setting.schema.validate(value);

  describe('enableGlobalSettingControl', () => {
    const setting = settings.enableGlobalSettingControl;
    const validate = getValidationFn(setting);

    it('should only accept boolean values', () => {
      expect(() => validate(true)).not.toThrow();
      expect(() => validate(false)).not.toThrow();

      expect(() => validate(42)).toThrowErrorMatchingInlineSnapshot(
        `"expected value of type [boolean] but got [number]"`
      );
      expect(() => validate('foo')).toThrowErrorMatchingInlineSnapshot(
        `"expected value of type [boolean] but got [string]"`
      );
    });

    it('should default to disabled', () => {
      expect(setting.value).toBe(false);
    });

    it('should be scoped to dashboard admin', () => {
      expect(setting.scope).toBe(UiSettingScope.DASHBOARD_ADMIN);
    });

    it('should require page reload', () => {
      expect(setting.requiresPageReload).toBe(true);
    });
  });
});
