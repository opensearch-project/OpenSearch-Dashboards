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

import { getUiSettings } from './ui_settings';
import { UI_SETTINGS } from '../common';

describe('getUiSettings', () => {
  describe('with workspace disabled', () => {
    const settings = getUiSettings(false);

    it('should return an object with UI settings', () => {
      expect(settings).toBeDefined();
      expect(typeof settings).toBe('object');
    });

    it('should include all expected UI_SETTINGS keys', () => {
      expect(settings[UI_SETTINGS.META_FIELDS]).toBeDefined();
      expect(settings[UI_SETTINGS.DOC_HIGHLIGHT]).toBeDefined();
      expect(settings[UI_SETTINGS.QUERY_STRING_OPTIONS]).toBeDefined();
      expect(settings[UI_SETTINGS.QUERY_ALLOW_LEADING_WILDCARDS]).toBeDefined();
      expect(settings[UI_SETTINGS.SEARCH_QUERY_LANGUAGE]).toBeDefined();
      expect(settings[UI_SETTINGS.SORT_OPTIONS]).toBeDefined();
      expect(settings.defaultIndex).toBeDefined();
      expect(settings[UI_SETTINGS.COURIER_IGNORE_FILTER_IF_FIELD_NOT_IN_INDEX]).toBeDefined();
      expect(settings[UI_SETTINGS.COURIER_SET_REQUEST_PREFERENCE]).toBeDefined();
      expect(settings[UI_SETTINGS.COURIER_CUSTOM_REQUEST_PREFERENCE]).toBeDefined();
      expect(settings[UI_SETTINGS.COURIER_MAX_CONCURRENT_SHARD_REQUESTS]).toBeDefined();
      expect(settings[UI_SETTINGS.COURIER_BATCH_SEARCHES]).toBeDefined();
      expect(settings[UI_SETTINGS.SEARCH_INCLUDE_FROZEN]).toBeDefined();
      expect(settings[UI_SETTINGS.HISTOGRAM_BAR_TARGET]).toBeDefined();
      expect(settings[UI_SETTINGS.HISTOGRAM_MAX_BARS]).toBeDefined();
      expect(settings[UI_SETTINGS.HISTORY_LIMIT]).toBeDefined();
      expect(settings[UI_SETTINGS.SHORT_DOTS_ENABLE]).toBeDefined();
      expect(settings[UI_SETTINGS.FORMAT_DEFAULT_TYPE_MAP]).toBeDefined();
      expect(settings[UI_SETTINGS.FORMAT_NUMBER_DEFAULT_PATTERN]).toBeDefined();
      expect(settings[UI_SETTINGS.FORMAT_PERCENT_DEFAULT_PATTERN]).toBeDefined();
      expect(settings[UI_SETTINGS.FORMAT_BYTES_DEFAULT_PATTERN]).toBeDefined();
      expect(settings[UI_SETTINGS.FORMAT_CURRENCY_DEFAULT_PATTERN]).toBeDefined();
      expect(settings[UI_SETTINGS.FORMAT_NUMBER_DEFAULT_LOCALE]).toBeDefined();
      expect(settings[UI_SETTINGS.DATA_WITH_LONG_NUMERALS]).toBeDefined();
      expect(settings[UI_SETTINGS.TIMEPICKER_REFRESH_INTERVAL_DEFAULTS]).toBeDefined();
      expect(settings[UI_SETTINGS.TIMEPICKER_TIME_DEFAULTS]).toBeDefined();
      expect(settings[UI_SETTINGS.TIMEPICKER_QUICK_RANGES]).toBeDefined();
      expect(settings[UI_SETTINGS.INDEXPATTERN_PLACEHOLDER]).toBeDefined();
      expect(settings[UI_SETTINGS.FILTERS_PINNED_BY_DEFAULT]).toBeDefined();
      expect(settings[UI_SETTINGS.FILTERS_EDITOR_SUGGEST_VALUES]).toBeDefined();
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED]).toBeDefined();
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_RUNTIME_PPL_GRAMMAR]).toBeDefined();
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES]).toBeDefined();
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES_LIMIT]).toBeDefined();
      expect(settings[UI_SETTINGS.QUERY_DATAFRAME_HYDRATION_STRATEGY]).toBeDefined();
      expect(settings[UI_SETTINGS.SEARCH_QUERY_LANGUAGE_BLOCKLIST]).toBeDefined();
      expect(settings[UI_SETTINGS.SEARCH_INCLUDE_ALL_FIELDS]).toBeDefined();
      expect(settings[UI_SETTINGS.SEARCH_MAX_RECENT_DATASETS]).toBeDefined();
    });

    it('should have correct structure for each setting', () => {
      Object.values(settings).forEach((setting: any) => {
        expect(setting).toHaveProperty('value');
        expect(setting).toHaveProperty('schema');
      });
    });

    it('should have HTML tag functions in values for COURIER_SET_REQUEST_PREFERENCE', () => {
      const setting = settings[UI_SETTINGS.COURIER_SET_REQUEST_PREFERENCE];
      expect(setting.description).toBeDefined();

      // Check if description contains the values object with tag functions
      const descriptionCall = setting.description;
      expect(descriptionCall).toBeDefined();
    });

    it('should set defaultIndex scope to GLOBAL when workspace is disabled', () => {
      const defaultIndexSetting = settings.defaultIndex;
      expect(defaultIndexSetting.scope).toBe('global');
    });
  });

  describe('with workspace enabled', () => {
    const settings = getUiSettings(true);

    it('should set defaultIndex scope to WORKSPACE when workspace is enabled', () => {
      const defaultIndexSetting = settings.defaultIndex;
      expect(defaultIndexSetting.scope).toBe('workspace');
    });

    it('should return the same settings structure as workspace disabled', () => {
      const disabledSettings = getUiSettings(false);
      expect(Object.keys(settings).sort()).toEqual(Object.keys(disabledSettings).sort());
    });
  });

  describe('setting values', () => {
    const settings = getUiSettings(false);

    it('should have correct default values', () => {
      expect(settings[UI_SETTINGS.META_FIELDS].value).toEqual([
        '_source',
        '_id',
        '_type',
        '_index',
        '_score',
      ]);
      expect(settings[UI_SETTINGS.DOC_HIGHLIGHT].value).toBe(true);
      expect(settings[UI_SETTINGS.QUERY_STRING_OPTIONS].value).toBe('{ "analyze_wildcard": true }');
      expect(settings[UI_SETTINGS.QUERY_ALLOW_LEADING_WILDCARDS].value).toBe(true);
      expect(settings[UI_SETTINGS.COURIER_SET_REQUEST_PREFERENCE].value).toBe('sessionId');
      expect(settings[UI_SETTINGS.COURIER_CUSTOM_REQUEST_PREFERENCE].value).toBe('_local');
      expect(settings[UI_SETTINGS.COURIER_MAX_CONCURRENT_SHARD_REQUESTS].value).toBe(0);
      expect(settings[UI_SETTINGS.COURIER_BATCH_SEARCHES].value).toBe(false);
      expect(settings[UI_SETTINGS.SEARCH_INCLUDE_FROZEN].value).toBe(false);
      expect(settings[UI_SETTINGS.HISTOGRAM_BAR_TARGET].value).toBe(50);
      expect(settings[UI_SETTINGS.HISTOGRAM_MAX_BARS].value).toBe(100);
      expect(settings[UI_SETTINGS.HISTORY_LIMIT].value).toBe(10);
      expect(settings[UI_SETTINGS.SHORT_DOTS_ENABLE].value).toBe(false);
      expect(settings[UI_SETTINGS.FORMAT_NUMBER_DEFAULT_PATTERN].value).toBe('0,0.[000]');
      expect(settings[UI_SETTINGS.FORMAT_PERCENT_DEFAULT_PATTERN].value).toBe('0,0.[000]%');
      expect(settings[UI_SETTINGS.FORMAT_BYTES_DEFAULT_PATTERN].value).toBe('0,0.[0]b');
      expect(settings[UI_SETTINGS.FORMAT_CURRENCY_DEFAULT_PATTERN].value).toBe('($0,0.[00])');
      expect(settings[UI_SETTINGS.FORMAT_NUMBER_DEFAULT_LOCALE].value).toBe('en');
      expect(settings[UI_SETTINGS.DATA_WITH_LONG_NUMERALS].value).toBe(true);
      expect(settings[UI_SETTINGS.INDEXPATTERN_PLACEHOLDER].value).toBe('');
      expect(settings[UI_SETTINGS.FILTERS_PINNED_BY_DEFAULT].value).toBe(false);
      expect(settings[UI_SETTINGS.FILTERS_EDITOR_SUGGEST_VALUES].value).toBe(true);
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED].value).toBe(false);
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_RUNTIME_PPL_GRAMMAR].value).toBe(true);
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES].value).toBe(true);
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES_LIMIT].value).toBe(200);
      expect(settings[UI_SETTINGS.QUERY_DATAFRAME_HYDRATION_STRATEGY].value).toBe('perSource');
      expect(settings[UI_SETTINGS.SEARCH_QUERY_LANGUAGE_BLOCKLIST].value).toEqual(['none']);
      expect(settings[UI_SETTINGS.SEARCH_INCLUDE_ALL_FIELDS].value).toBe(false);
      expect(settings[UI_SETTINGS.SEARCH_MAX_RECENT_DATASETS].value).toBe(4);
      expect(settings.defaultIndex.value).toBeNull();
    });

    it('should have correct types for settings', () => {
      expect(settings[UI_SETTINGS.QUERY_STRING_OPTIONS].type).toBe('json');
      expect(settings[UI_SETTINGS.COURIER_SET_REQUEST_PREFERENCE].type).toBe('select');
      expect(settings[UI_SETTINGS.COURIER_CUSTOM_REQUEST_PREFERENCE].type).toBe('string');
      expect(settings[UI_SETTINGS.COURIER_MAX_CONCURRENT_SHARD_REQUESTS].type).toBe('number');
      expect(settings[UI_SETTINGS.COURIER_BATCH_SEARCHES].type).toBe('boolean');
      expect(settings[UI_SETTINGS.FORMAT_NUMBER_DEFAULT_PATTERN].type).toBe('string');
      expect(settings[UI_SETTINGS.FORMAT_NUMBER_DEFAULT_LOCALE].type).toBe('select');
      expect(settings[UI_SETTINGS.TIMEPICKER_REFRESH_INTERVAL_DEFAULTS].type).toBe('json');
      expect(settings[UI_SETTINGS.TIMEPICKER_TIME_DEFAULTS].type).toBe('json');
      expect(settings[UI_SETTINGS.TIMEPICKER_QUICK_RANGES].type).toBe('json');
      expect(settings.defaultIndex.type).toBe('string');
    });

    it('should have correct options for select type settings', () => {
      expect(settings[UI_SETTINGS.COURIER_SET_REQUEST_PREFERENCE].options).toEqual([
        'sessionId',
        'custom',
        'none',
      ]);
      expect(settings[UI_SETTINGS.SEARCH_QUERY_LANGUAGE].options).toEqual(['lucene', 'kuery']);
      expect(settings[UI_SETTINGS.QUERY_DATAFRAME_HYDRATION_STRATEGY].options).toEqual([
        'perSource',
        'perQuery',
      ]);
    });

    it('should have categories for relevant settings', () => {
      expect(settings[UI_SETTINGS.DOC_HIGHLIGHT].category).toEqual(['discover']);
      expect(settings[UI_SETTINGS.COURIER_IGNORE_FILTER_IF_FIELD_NOT_IN_INDEX].category).toEqual([
        'search',
      ]);
      expect(settings[UI_SETTINGS.COURIER_SET_REQUEST_PREFERENCE].category).toEqual(['search']);
      expect(settings[UI_SETTINGS.COURIER_CUSTOM_REQUEST_PREFERENCE].category).toEqual(['search']);
      expect(settings[UI_SETTINGS.COURIER_MAX_CONCURRENT_SHARD_REQUESTS].category).toEqual([
        'search',
      ]);
      expect(settings[UI_SETTINGS.COURIER_BATCH_SEARCHES].category).toEqual(['search']);
      expect(settings[UI_SETTINGS.SEARCH_INCLUDE_FROZEN].category).toEqual(['search']);
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED].category).toEqual(['search']);
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_RUNTIME_PPL_GRAMMAR].category).toEqual([
        'search',
      ]);
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES].category).toEqual(['search']);
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES_LIMIT].category).toEqual([
        'search',
      ]);
      expect(settings[UI_SETTINGS.QUERY_DATAFRAME_HYDRATION_STRATEGY].category).toEqual(['search']);
      expect(settings[UI_SETTINGS.SEARCH_INCLUDE_ALL_FIELDS].category).toEqual(['search']);
      expect(settings[UI_SETTINGS.SEARCH_MAX_RECENT_DATASETS].category).toEqual(['search']);
    });

    it('should have requiresPageReload flag for relevant settings', () => {
      expect(settings[UI_SETTINGS.TIMEPICKER_REFRESH_INTERVAL_DEFAULTS].requiresPageReload).toBe(
        true
      );
      expect(settings[UI_SETTINGS.TIMEPICKER_TIME_DEFAULTS].requiresPageReload).toBe(true);
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED].requiresPageReload).toBe(true);
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_RUNTIME_PPL_GRAMMAR].requiresPageReload).toBe(
        true
      );
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES].requiresPageReload).toBe(true);
      expect(settings[UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES_LIMIT].requiresPageReload).toBe(
        true
      );
    });
  });

  describe('schema validation', () => {
    const settings = getUiSettings(false);

    it('should have valid schemas for all settings', () => {
      Object.values(settings).forEach((setting: any) => {
        expect(setting.schema).toBeDefined();
        expect(typeof setting.schema.validate).toBe('function');
      });
    });

    it('should validate META_FIELDS as array of strings', () => {
      const schema = settings[UI_SETTINGS.META_FIELDS].schema;
      expect(() => schema.validate(['_source', '_id'])).not.toThrow();
      expect(() => schema.validate([123])).toThrow();
    });

    it('should validate boolean settings', () => {
      const booleanSettings = [
        UI_SETTINGS.DOC_HIGHLIGHT,
        UI_SETTINGS.QUERY_ALLOW_LEADING_WILDCARDS,
        UI_SETTINGS.COURIER_IGNORE_FILTER_IF_FIELD_NOT_IN_INDEX,
        UI_SETTINGS.COURIER_BATCH_SEARCHES,
        UI_SETTINGS.SEARCH_INCLUDE_FROZEN,
        UI_SETTINGS.SHORT_DOTS_ENABLE,
        UI_SETTINGS.DATA_WITH_LONG_NUMERALS,
        UI_SETTINGS.FILTERS_PINNED_BY_DEFAULT,
        UI_SETTINGS.FILTERS_EDITOR_SUGGEST_VALUES,
        UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED,
        UI_SETTINGS.QUERY_ENHANCEMENTS_RUNTIME_PPL_GRAMMAR,
        UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES,
        UI_SETTINGS.SEARCH_INCLUDE_ALL_FIELDS,
      ];

      booleanSettings.forEach((key) => {
        const schema = settings[key].schema;
        expect(() => schema.validate(true)).not.toThrow();
        expect(() => schema.validate(false)).not.toThrow();
        expect(() => schema.validate('treu')).toThrow();
      });
    });

    it('should validate number settings', () => {
      const numberSettings = [
        UI_SETTINGS.COURIER_MAX_CONCURRENT_SHARD_REQUESTS,
        UI_SETTINGS.HISTOGRAM_BAR_TARGET,
        UI_SETTINGS.HISTOGRAM_MAX_BARS,
        UI_SETTINGS.HISTORY_LIMIT,
        UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES_LIMIT,
        UI_SETTINGS.SEARCH_MAX_RECENT_DATASETS,
      ];

      numberSettings.forEach((key) => {
        const schema = settings[key].schema;
        expect(() => schema.validate(42)).not.toThrow();
        expect(() => schema.validate('fourty two')).toThrow();
      });
    });

    it('should validate string settings', () => {
      const stringSettings = [
        UI_SETTINGS.SEARCH_QUERY_LANGUAGE,
        UI_SETTINGS.COURIER_SET_REQUEST_PREFERENCE,
        UI_SETTINGS.COURIER_CUSTOM_REQUEST_PREFERENCE,
        UI_SETTINGS.FORMAT_NUMBER_DEFAULT_PATTERN,
        UI_SETTINGS.FORMAT_PERCENT_DEFAULT_PATTERN,
        UI_SETTINGS.FORMAT_BYTES_DEFAULT_PATTERN,
        UI_SETTINGS.FORMAT_CURRENCY_DEFAULT_PATTERN,
        UI_SETTINGS.FORMAT_NUMBER_DEFAULT_LOCALE,
        UI_SETTINGS.QUERY_DATAFRAME_HYDRATION_STRATEGY,
        UI_SETTINGS.INDEXPATTERN_PLACEHOLDER,
      ];

      stringSettings.forEach((key) => {
        const schema = settings[key].schema;
        expect(() => schema.validate('test')).not.toThrow();
        expect(() => schema.validate(123)).toThrow();
      });
    });

    it('should validate defaultIndex as nullable string', () => {
      const schema = settings.defaultIndex.schema;
      expect(() => schema.validate(null)).not.toThrow();
      expect(() => schema.validate('my-index')).not.toThrow();
      expect(() => schema.validate(123)).toThrow();
    });

    it('should validate array settings', () => {
      const arraySchema = settings[UI_SETTINGS.SEARCH_QUERY_LANGUAGE_BLOCKLIST].schema;
      expect(() => arraySchema.validate(['none'])).not.toThrow();
      expect(() => arraySchema.validate(['lucene', 'kuery'])).not.toThrow();
      expect(() => arraySchema.validate('none')).toThrow();
    });
  });
});
