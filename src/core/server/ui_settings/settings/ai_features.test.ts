/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UiSettingsParams } from '../types';
import { getAIFeaturesSetting } from './ai_features';

describe('AI features setting', () => {
  const dashboardAssistantSettings = getAIFeaturesSetting();

  const getValidationFn = (setting: UiSettingsParams) => (value: any) =>
    setting.schema.validate(value);

  describe('enableAIFeatures', () => {
    const validate = getValidationFn(dashboardAssistantSettings.enableAIFeatures);

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
      expect(dashboardAssistantSettings.enableAIFeatures.value).toBe(true);
    });

    it('should require page reload', () => {
      expect(dashboardAssistantSettings.enableAIFeatures.requiresPageReload).toBe(true);
    });
  });
});
