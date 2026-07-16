/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { exploreUiSettings } from './explore_ui_settings';
import {
  DEFAULT_TRACE_COLUMNS_SETTING,
  DEFAULT_LOGS_COLUMNS_SETTING,
  ENABLE_EXPERIMENTAL_SETTING,
} from '../common';

describe('exploreUiSettings', () => {
  it('registers exactly the three explore settings', () => {
    expect(Object.keys(exploreUiSettings).sort()).toEqual(
      [
        DEFAULT_TRACE_COLUMNS_SETTING,
        DEFAULT_LOGS_COLUMNS_SETTING,
        ENABLE_EXPERIMENTAL_SETTING,
      ].sort()
    );
  });

  it('places every setting under the explore category with a name and description', () => {
    Object.values(exploreUiSettings).forEach((setting) => {
      expect(setting.category).toEqual(['explore']);
      expect(typeof setting.name).toBe('string');
      expect((setting.name as string).length).toBeGreaterThan(0);
      expect(typeof setting.description).toBe('string');
      expect((setting.description as string).length).toBeGreaterThan(0);
    });
  });

  describe('default trace columns', () => {
    const setting = exploreUiSettings[DEFAULT_TRACE_COLUMNS_SETTING];

    it('defaults to the expected column list', () => {
      expect(setting.value).toEqual([
        'spanId',
        'status.code',
        'attributes.http.status_code',
        'resource.attributes.service.name',
        'kind',
        'name',
        'durationNano',
        'durationInNanos',
      ]);
    });

    it('validates a string array via its schema', () => {
      expect(() => setting.schema.validate(setting.value)).not.toThrow();
      expect(() => setting.schema.validate('not-an-array')).toThrow();
      expect(() => setting.schema.validate([1, 2, 3])).toThrow();
    });
  });

  describe('default logs columns', () => {
    const setting = exploreUiSettings[DEFAULT_LOGS_COLUMNS_SETTING];

    it('defaults to body/severityText/service.name', () => {
      expect(setting.value).toEqual(['body', 'severityText', 'resource.attributes.service.name']);
    });

    it('validates a string array via its schema', () => {
      expect(() => setting.schema.validate(['a', 'b'])).not.toThrow();
      expect(() => setting.schema.validate([true])).toThrow();
    });
  });

  describe('experimental toggle', () => {
    const setting = exploreUiSettings[ENABLE_EXPERIMENTAL_SETTING];

    it('defaults to false and validates a boolean', () => {
      expect(setting.value).toBe(false);
      expect(() => setting.schema.validate(true)).not.toThrow();
      expect(() => setting.schema.validate('yes')).toThrow();
    });
  });
});
