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

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { ConfigSchema, configSchema } from '../config';
import { DataServerPlugin, DataPluginSetup, DataPluginStart } from './plugin';

import {
  buildQueryFilter,
  buildCustomFilter,
  buildEmptyFilter,
  buildExistsFilter,
  buildFilter,
  buildPhraseFilter,
  buildPhrasesFilter,
  buildRangeFilter,
  isFilterDisabled,
} from '../common';

/*
 * Filter helper namespace:
 */

export const opensearchFilters = {
  buildQueryFilter,
  buildCustomFilter,
  buildEmptyFilter,
  buildExistsFilter,
  buildFilter,
  buildPhraseFilter,
  buildPhrasesFilter,
  buildRangeFilter,
  isFilterDisabled,
};

/*
 * opensearchQuery and opensearchKuery:
 */

import {
  nodeTypes,
  fromKueryExpression,
  toOpenSearchQuery,
  buildOpenSearchQuery,
  buildQueryFromFilters,
  getOpenSearchQueryConfig,
} from '../common';

export const opensearchKuery = {
  nodeTypes,
  fromKueryExpression,
  toOpenSearchQuery,
};

export const opensearchQuery = {
  buildQueryFromFilters,
  getOpenSearchQueryConfig,
  buildOpenSearchQuery,
};

export { OpenSearchQueryConfig, KueryNode } from '../common';

/*
 * Field Formats:
 */

import {
  FieldFormatsRegistry,
  FieldFormat,
  BoolFormat,
  BytesFormat,
  ColorFormat,
  DurationFormat,
  IpFormat,
  NumberFormat,
  PercentFormat,
  RelativeDateFormat,
  SourceFormat,
  StaticLookupFormat,
  UrlFormat,
  StringFormat,
  TruncateFormat,
} from '../common/field_formats';

export const fieldFormats = {
  FieldFormatsRegistry,
  FieldFormat,
  BoolFormat,
  BytesFormat,
  ColorFormat,
  DurationFormat,
  IpFormat,
  NumberFormat,
  PercentFormat,
  RelativeDateFormat,
  SourceFormat,
  StaticLookupFormat,
  UrlFormat,
  StringFormat,
  TruncateFormat,
};

export { IFieldFormatsRegistry, FieldFormatsGetConfigFn, FieldFormatConfig } from '../common';

/*
 * Index patterns:
 */

import { isNestedField, isFilterable } from '../common';

export const indexPatterns = {
  isFilterable,
  isNestedField,
};

export {
  IndexPatternsFetcher,
  FieldDescriptor as IndexPatternFieldDescriptor,
  shouldReadFieldFromDocValues, // used only in logstash_fields fixture
  FieldDescriptor,
} from './index_patterns';

export {
  IFieldType,
  IFieldSubType,
  OPENSEARCH_FIELD_TYPES,
  OSD_FIELD_TYPES,
  IndexPatternAttributes,
  UI_SETTINGS,
  IndexPattern,
} from '../common';

/**
 * Search
 */

import {
  // aggs
  CidrMask,
  intervalOptions,
  isNumberType,
  isStringType,
  isType,
  parentPipelineType,
  propFilter,
  siblingPipelineType,
  termsAggFilter,
  dateHistogramInterval,
  InvalidOpenSearchCalendarIntervalError,
  InvalidOpenSearchIntervalFormatError,
  Ipv4Address,
  isValidOpenSearchInterval,
  isValidInterval,
  parseOpenSearchInterval,
  parseInterval,
  toAbsoluteDates,
  // expressions utils
  getRequestInspectorStats,
  getResponseInspectorStats,
  // tabify
  tabifyAggResponse,
  tabifyGetColumns,
} from '../common';

export {
  // aggs
  AggGroupLabels,
  AggGroupName,
  AggGroupNames,
  AggParam,
  AggParamOption,
  AggParamType,
  AggConfigOptions,
  BUCKET_TYPES,
  OpenSearchaggsExpressionFunctionDefinition,
  IAggConfig,
  IAggConfigs,
  IAggType,
  IFieldParamType,
  IMetricAggType,
  METRIC_TYPES,
  OptionedParamType,
  OptionedValueProp,
  ParsedInterval,
  // search
  ISearchOptions,
  IOpenSearchSearchRequest,
  IOpenSearchSearchResponse,
  OPENSEARCH_SEARCH_STRATEGY,
  // tabify
  TabbedAggColumn,
  TabbedAggRow,
  TabbedTable,
} from '../common';

export {
  ISearchStrategy,
  ISearchSetup,
  ISearchStart,
  toSnakeCase,
  getAsyncOptions,
  getDefaultSearchParams,
  getShardTimeout,
  getTotalLoaded,
  shimHitsTotal,
  usageProvider,
  shimAbortSignal,
  SearchUsage,
} from './search';

// Search namespace
export const search = {
  aggs: {
    CidrMask,
    dateHistogramInterval,
    intervalOptions,
    InvalidOpenSearchCalendarIntervalError,
    InvalidOpenSearchIntervalFormatError,
    Ipv4Address,
    isNumberType,
    isStringType,
    isType,
    isValidOpenSearchInterval,
    isValidInterval,
    parentPipelineType,
    parseOpenSearchInterval,
    parseInterval,
    propFilter,
    siblingPipelineType,
    termsAggFilter,
    toAbsoluteDates,
  },
  getRequestInspectorStats,
  getResponseInspectorStats,
  tabifyAggResponse,
  tabifyGetColumns,
};

/**
 * Types to be shared externally
 * @public
 */

export {
  // osd field types
  castOpenSearchToOsdFieldTypeName,
  // query
  Filter,
  getTime,
  Query,
  // timefilter
  RefreshInterval,
  TimeRange,
  // utils
  parseInterval,
} from '../common';

/**
 * Static code to be shared externally
 * @public
 */

export function plugin(initializerContext: PluginInitializerContext<ConfigSchema>) {
  return new DataServerPlugin(initializerContext);
}

export {
  DataServerPlugin as Plugin,
  DataPluginSetup as PluginSetup,
  DataPluginStart as PluginStart,
};

export const config: PluginConfigDescriptor<ConfigSchema> = {
  exposeToBrowser: {
    autocomplete: true,
    search: true,
  },
  schema: configSchema,
};

export type { IndexPatternsService } from './index_patterns';
