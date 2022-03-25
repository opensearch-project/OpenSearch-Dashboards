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

import { Observable } from 'rxjs';
import {
  IOpenSearchSearchRequest,
  IOpenSearchSearchResponse,
  ISearchOptions,
} from '../../common/search';

export type ISearch = (
  request: IOpenSearchDashboardsSearchRequest,
  options?: ISearchOptions
) => Observable<IOpenSearchDashboardsSearchResponse>;

export type ISearchGeneric = <
  SearchStrategyRequest extends IOpenSearchDashboardsSearchRequest = IOpenSearchSearchRequest,
  SearchStrategyResponse extends IOpenSearchDashboardsSearchResponse = IOpenSearchSearchResponse
>(
  request: SearchStrategyRequest,
  options?: ISearchOptions
) => Observable<SearchStrategyResponse>;

export interface IOpenSearchDashboardsSearchResponse<RawResponse = any> {
  /**
   * Some responses may contain a unique id to identify the request this response came from.
   */
  id?: string;

  /**
   * If relevant to the search strategy, return a total number
   * that represents how progress is indicated.
   */
  total?: number;

  /**
   * If relevant to the search strategy, return a loaded number
   * that represents how progress is indicated.
   */
  loaded?: number;

  /**
   * Indicates whether search is still in flight
   */
  isRunning?: boolean;

  /**
   * Indicates whether the results returned are complete or partial
   */
  isPartial?: boolean;

  rawResponse: RawResponse;
}

export interface IOpenSearchDashboardsSearchRequest<Params = any> {
  /**
   * An id can be used to uniquely identify this request.
   */
  id?: string;

  params?: Params;
}
