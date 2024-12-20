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

import { DATA_STRUCTURE_META_TYPES, DataStructure } from './types';

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

export const DEFAULT_DATA = {
  STRUCTURES: {
    ROOT: {
      id: 'ROOT',
      title: 'Data',
      type: 'ROOT',
      meta: {
        type: DATA_STRUCTURE_META_TYPES.FEATURE,
        icon: { type: 'folderOpen' },
        tooltip: 'Root Data Structure',
      },
    } as DataStructure,
    LOCAL_DATASOURCE: {
      id: '',
      title: 'Default Cluster',
      type: 'DATA_SOURCE',
    },
  },

  SET_TYPES: {
    INDEX_PATTERN: 'INDEX_PATTERN',
    INDEX: 'INDEXES',
  },

  SOURCE_TYPES: {
    OPENSEARCH: 'OpenSearch',
    LEGACY: 'LEGACY',
  },
};

export const DEFAULT_QUERY_LANGUAGE = 'kuery';

export const DEFAULT_QUERY = {
  LANGUAGE: DEFAULT_QUERY_LANGUAGE,
  DATASET: {
    TYPE: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    DATASOURCE: {
      TYPE: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
    },
  },
};

export const UI_SETTINGS = {
  META_FIELDS: 'metaFields',
  DOC_HIGHLIGHT: 'doc_table:highlight',
  QUERY_STRING_OPTIONS: 'query:queryString:options',
  QUERY_ALLOW_LEADING_WILDCARDS: 'query:allowLeadingWildcards',
  SEARCH_QUERY_LANGUAGE: 'search:queryLanguage',
  SORT_OPTIONS: 'sort:options',
  COURIER_IGNORE_FILTER_IF_FIELD_NOT_IN_INDEX: 'courier:ignoreFilterIfFieldNotInIndex',
  COURIER_SET_REQUEST_PREFERENCE: 'courier:setRequestPreference',
  COURIER_CUSTOM_REQUEST_PREFERENCE: 'courier:customRequestPreference',
  COURIER_MAX_CONCURRENT_SHARD_REQUESTS: 'courier:maxConcurrentShardRequests',
  COURIER_BATCH_SEARCHES: 'courier:batchSearches',
  SEARCH_INCLUDE_FROZEN: 'search:includeFrozen',
  SEARCH_TIMEOUT: 'search:timeout',
  SEARCH_INCLUDE_ALL_FIELDS: 'search:includeAllFields',
  SEARCH_MAX_RECENT_DATASETS: 'search:maxRecentDatasets',
  HISTOGRAM_BAR_TARGET: 'histogram:barTarget',
  HISTOGRAM_MAX_BARS: 'histogram:maxBars',
  HISTORY_LIMIT: 'history:limit',
  SHORT_DOTS_ENABLE: 'shortDots:enable',
  FORMAT_DEFAULT_TYPE_MAP: 'format:defaultTypeMap',
  FORMAT_NUMBER_DEFAULT_PATTERN: 'format:number:defaultPattern',
  FORMAT_PERCENT_DEFAULT_PATTERN: 'format:percent:defaultPattern',
  FORMAT_BYTES_DEFAULT_PATTERN: 'format:bytes:defaultPattern',
  FORMAT_CURRENCY_DEFAULT_PATTERN: 'format:currency:defaultPattern',
  FORMAT_NUMBER_DEFAULT_LOCALE: 'format:number:defaultLocale',
  TIMEPICKER_REFRESH_INTERVAL_DEFAULTS: 'timepicker:refreshIntervalDefaults',
  TIMEPICKER_QUICK_RANGES: 'timepicker:quickRanges',
  TIMEPICKER_TIME_DEFAULTS: 'timepicker:timeDefaults',
  INDEXPATTERN_PLACEHOLDER: 'indexPattern:placeholder',
  FILTERS_PINNED_BY_DEFAULT: 'filters:pinnedByDefault',
  FILTERS_EDITOR_SUGGEST_VALUES: 'filterEditor:suggestValues',
  QUERY_ENHANCEMENTS_ENABLED: 'query:enhancements:enabled',
  QUERY_DATAFRAME_HYDRATION_STRATEGY: 'query:dataframe:hydrationStrategy',
  SEARCH_QUERY_LANGUAGE_BLOCKLIST: 'search:queryLanguageBlocklist',
  NEW_HOME_PAGE: 'home:useNewHomePage',
  DATA_WITH_LONG_NUMERALS: 'data:withLongNumerals',
} as const;
