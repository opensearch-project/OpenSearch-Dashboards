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

import { NameList } from 'elasticsearch';
import { Filter, IDataFrame, DataView, IndexPattern, Query } from '../..';
import { SearchSource } from './search_source';

/**
 * search source interface
 * @public
 */
export type ISearchSource = Pick<SearchSource, keyof SearchSource>;

/**
 * high level search service
 * @public
 */
export interface ISearchStartSearchSource {
  /**
   * creates {@link SearchSource} based on provided serialized {@link SearchSourceFields}
   * @param fields
   */
  create: (fields?: SearchSourceFields) => Promise<ISearchSource>;
  /**
   * creates empty {@link SearchSource}
   */
  createEmpty: () => ISearchSource;
}

export type OpenSearchQuerySearchAfter = [string | number, string | number];

export enum SortDirection {
  asc = 'asc',
  desc = 'desc',
}

export interface SortDirectionNumeric {
  order: SortDirection;
  numeric_type?: 'double' | 'long' | 'date' | 'date_nanos';
}

export type OpenSearchQuerySortValue = Record<string, SortDirection | SortDirectionNumeric>;

/**
 * search source fields
 */
export interface SearchSourceFields {
  type?: string;
  /**
   * {@link Query}
   */
  query?: Query;
  /**
   * {@link Filter}
   */
  filter?: Filter[] | Filter | (() => Filter[] | Filter | undefined);
  /**
   * {@link OpenSearchQuerySortValue}
   */
  sort?: OpenSearchQuerySortValue | OpenSearchQuerySortValue[];
  highlight?: any;
  highlightAll?: boolean;
  /**
   * {@link AggConfigs}
   */
  aggs?: any;
  from?: number;
  size?: number;
  source?: NameList;
  version?: boolean;
  fields?: NameList;
  /**
   * {@link IndexPatternService}
   */
  index?: IndexPattern | DataView;
  searchAfter?: OpenSearchQuerySearchAfter;
  timeout?: string;
  terminate_after?: number;
  df?: IDataFrame;
}

export interface SearchSourceOptions {
  callParentStartHandlers?: boolean;
}

export interface SortOptions {
  mode?: 'min' | 'max' | 'sum' | 'avg' | 'median';
  type?: 'double' | 'long' | 'date' | 'date_nanos';
  nested?: object;
  unmapped_type?: string;
  distance_type?: 'arc' | 'plane';
  unit?: string;
  ignore_unmapped?: boolean;
  _script?: object;
}

export interface Request {
  docvalue_fields: string[];
  _source: unknown;
  query: unknown;
  script_fields: unknown;
  sort: unknown;
  stored_fields: string[];
}

export interface ResponseWithShardFailure {
  _shards: {
    failed: number;
    failures: ShardFailure[];
    skipped: number;
    successful: number;
    total: number;
  };
}

export interface ShardFailure {
  index: string;
  node: string;
  reason: {
    caused_by: {
      reason: string;
      type: string;
    };
    reason: string;
    lang?: string;
    script?: string;
    script_stack?: string[];
    type: string;
  };
  shard: number;
}
