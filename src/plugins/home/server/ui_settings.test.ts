/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { UiSettingsParams } from 'opensearch-dashboards/public';
import { uiSettings } from './ui_settings';

describe('home settings', () => {
  const getValidationFn = (setting: UiSettingsParams) => (value: any) =>
    setting.schema.validate(value);

  describe('home:useNewHomePage', () => {
    const validate = getValidationFn(uiSettings['home:useNewHomePage']);

    it('should only accept boolean values', () => {
      expect(() => validate(true)).not.toThrow();
      expect(() => validate(false)).not.toThrow();
      expect(() => validate('foo')).toThrowErrorMatchingInlineSnapshot(
        `"expected value of type [boolean] but got [string]"`
      );
      expect(() => validate(12)).toThrowErrorMatchingInlineSnapshot(
        `"expected value of type [boolean] but got [number]"`
      );
    });
  });
});
