/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UiSettingsParams } from '../types';
import { getDashboardAssistantSettings } from './dashboard_assistant';

describe('dashboard assistant settings', () => {
  const dashboardAssistantSettings = getDashboardAssistantSettings();

  const getValidationFn = (setting: UiSettingsParams) => (value: any) =>
    setting.schema.validate(value);

  describe('enableDashboardAssistantFeature', () => {
    const validate = getValidationFn(dashboardAssistantSettings.enableDashboardAssistantFeature);

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

    it('should have the correct default value', () => {
      expect(dashboardAssistantSettings.enableDashboardAssistantFeature.value).toBe(true);
    });

    it('should require page reload', () => {
      expect(dashboardAssistantSettings.enableDashboardAssistantFeature.requiresPageReload).toBe(
        true
      );
    });
  });
});
