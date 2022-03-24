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

import { modifyUrl } from '@osd/std';

import { ensureRawRequest, OpenSearchDashboardsRequest, LegacyRequest } from './router';

/**
 * Access or manipulate the OpenSearch Dashboards base path
 *
 * @public
 */
export class BasePath {
  private readonly basePathCache = new WeakMap<LegacyRequest, string>();

  /**
   * returns the server's basePath
   *
   * See {@link BasePath.get} for getting the basePath value for a specific request
   */
  public readonly serverBasePath: string;

  /** @internal */
  constructor(serverBasePath: string = '') {
    this.serverBasePath = serverBasePath;
  }

  /**
   * returns `basePath` value, specific for an incoming request.
   */
  public get = (request: OpenSearchDashboardsRequest | LegacyRequest) => {
    const requestScopePath = this.basePathCache.get(ensureRawRequest(request)) || '';
    return `${this.serverBasePath}${requestScopePath}`;
  };

  /**
   * sets `basePath` value, specific for an incoming request.
   *
   * @privateRemarks should work only for OpenSearchDashboardsRequest as soon as spaces migrate to NP
   */
  public set = (
    request: OpenSearchDashboardsRequest | LegacyRequest,
    requestSpecificBasePath: string
  ) => {
    const rawRequest = ensureRawRequest(request);

    if (this.basePathCache.has(rawRequest)) {
      throw new Error(
        'Request basePath was previously set. Setting multiple times is not supported.'
      );
    }
    this.basePathCache.set(rawRequest, requestSpecificBasePath);
  };

  /**
   * Prepends `path` with the basePath.
   */
  public prepend = (path: string): string => {
    if (this.serverBasePath === '') return path;
    return modifyUrl(path, (parts) => {
      if (!parts.hostname && parts.pathname && parts.pathname.startsWith('/')) {
        parts.pathname = `${this.serverBasePath}${parts.pathname}`;
      }
    });
  };

  /**
   * Removes the prepended basePath from the `path`.
   */
  public remove = (path: string): string => {
    if (this.serverBasePath === '') {
      return path;
    }

    if (path === this.serverBasePath) {
      return '/';
    }

    if (path.startsWith(`${this.serverBasePath}/`)) {
      return path.slice(this.serverBasePath.length);
    }

    return path;
  };
}

/**
 * Access or manipulate the OpenSearch Dashboards base path
 *
 * {@link BasePath}
 * @public
 */
export type IBasePath = Pick<BasePath, keyof BasePath>;
