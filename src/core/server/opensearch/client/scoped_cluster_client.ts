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

import { OpenSearchClient, OpenSearchClientNext } from './types';

/**
 * Serves the same purpose as the normal {@link IClusterClient | cluster client} but exposes
 * an additional `asCurrentUser` method that doesn't use credentials of the OpenSearch Dashboards internal
 * user (as `asInternalUser` does) to request OpenSearch API, but rather passes HTTP headers
 * extracted from the current user request to the API instead.
 *
 * @public
 **/
export interface IScopedClusterClient {
  /**
   * A {@link OpenSearchClient | client} to be used to query the opensearch cluster
   * on behalf of the internal OpenSearch Dashboards user.
   */
  readonly asInternalUser: OpenSearchClient;
  /**
   * A {@link OpenSearchClient | client} to be used to query the opensearch cluster
   * on behalf of the user that initiated the request to the OpenSearch Dashboards server.
   */
  readonly asCurrentUser: OpenSearchClient;
  /**
   * A {@link OpenSearchClient | client}, with support for long numerals, to be used to
   * query the opensearch cluster on behalf of the internal OpenSearch Dashboards user.
   */
  readonly asInternalUserWithLongNumeralsSupport: OpenSearchClientNext;
  /**
   * A {@link OpenSearchClient | client}, with support for long numerals, to be used to
   * query the opensearch cluster on behalf of the user that initiated the request to
   * the OpenSearch Dashboards server.
   */
  readonly asCurrentUserWithLongNumeralsSupport: OpenSearchClientNext;
}

/** @internal **/
export class ScopedClusterClient implements IScopedClusterClient {
  constructor(
    public readonly asInternalUser: OpenSearchClient,
    public readonly asCurrentUser: OpenSearchClient,
    public readonly asInternalUserWithLongNumeralsSupport: OpenSearchClientNext,
    public readonly asCurrentUserWithLongNumeralsSupport: OpenSearchClientNext
  ) {}
}
