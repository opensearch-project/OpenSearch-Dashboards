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
import { Headers } from '../http/router';
import { LegacyRequest, OpenSearchDashboardsRequest } from '../http';
import { OpenSearchConfig } from './opensearch_config';
import {
  LegacyOpenSearchClientConfig,
  ILegacyClusterClient,
  ILegacyCustomClusterClient,
} from './legacy';
import { IClusterClient, ICustomClusterClient, OpenSearchClientConfig } from './client';
import { NodesVersionCompatibility } from './version_check/ensure_opensearch_version';
import { ServiceStatus } from '../status';

/**
 * @public
 */
export interface OpenSearchServiceSetup {
  /**
   * @deprecated
   * Use {@link OpenSearchServiceStart.legacy} instead.
   */
  legacy: {
    /**
     * Provide direct access to the current opensearch configuration.
     *
     * @deprecated this will be removed in a later version.
     */
    readonly config$: Observable<OpenSearchConfig>;
    /**
     * @deprecated
     * Use {@link OpenSearchServiceStart.legacy | OpenSearchServiceStart.legacy.createClient} instead.
     *
     * Create application specific OpenSearch cluster API client with customized config. See {@link ILegacyClusterClient}.
     *
     * @param type Unique identifier of the client
     * @param clientConfig A config consists of OpenSearch JS client options and
     * valid sub-set of OpenSearch service config.
     * We fill all the missing properties in the `clientConfig` using the default
     * OpenSearch config so that we don't depend on default values set and
     * controlled by underlying OpenSearch JS client.
     * We don't run validation against the passed config and expect it to be valid.
     *
     * @example
     * ```js
     * const client = opensearch.createCluster('my-app-name', config);
     * const data = await client.callAsInternalUser();
     * ```
     */
    readonly createClient: (
      type: string,
      clientConfig?: Partial<LegacyOpenSearchClientConfig>
    ) => ILegacyCustomClusterClient;

    /**
     * @deprecated
     * Use {@link OpenSearchServiceStart.legacy | OpenSearchServiceStart.legacy.client} instead.
     *
     * All OpenSearch config value changes are processed under the hood.
     * See {@link ILegacyClusterClient}.
     *
     * @example
     * ```js
     * const client = core.opensearch.legacy.client;
     * ```
     */
    readonly client: ILegacyClusterClient;
  };
}

/** @internal */
export interface InternalOpenSearchServiceSetup extends OpenSearchServiceSetup {
  opensearchNodesCompatibility$: Observable<NodesVersionCompatibility>;
  status$: Observable<ServiceStatus<OpenSearchStatusMeta>>;
}

/**
 * @public
 */
export interface OpenSearchServiceStart {
  /**
   * A pre-configured {@link IClusterClient | OpenSearch client}
   *
   * @example
   * ```js
   * const client = core.opensearch.client;
   * ```
   */
  readonly client: IClusterClient;
  /**
   * Create application specific OpenSearch cluster API client with customized config. See {@link IClusterClient}.
   *
   * @param type Unique identifier of the client
   * @param clientConfig A config consists of OpenSearch JS client options and
   * valid sub-set of OpenSearch service config.
   * We fill all the missing properties in the `clientConfig` using the default
   * OpenSearch config so that we don't depend on default values set and
   * controlled by underlying OpenSearch JS client.
   * We don't run validation against the passed config and expect it to be valid.
   *
   * @example
   * ```js
   * const client = opensearch.createClient('my-app-name', config);
   * const data = await client.asInternalUser.search();
   * ```
   */
  readonly createClient: (
    type: string,
    clientConfig?: Partial<OpenSearchClientConfig>
  ) => ICustomClusterClient;

  /**
   * @deprecated
   * Provided for the backward compatibility.
   * Switch to the new opensearch client as soon as https://github.com/elastic/kibana/issues/35508 done.
   * */
  legacy: {
    /**
     * Provide direct access to the current opensearch configuration.
     *
     * @deprecated this will be removed in a later version.
     */
    readonly config$: Observable<OpenSearchConfig>;
    /**
     * Create application specific OpenSearch cluster API client with customized config. See {@link ILegacyClusterClient}.
     *
     * @param type Unique identifier of the client
     * @param clientConfig A config consists of OpenSearch JS client options and
     * valid sub-set of OpenSearch service config.
     * We fill all the missing properties in the `clientConfig` using the default
     * OpenSearch config so that we don't depend on default values set and
     * controlled by underlying OpenSearch JS client.
     * We don't run validation against the passed config and expect it to be valid.
     *
     * @example
     * ```js
     * const client = opensearch.legacy.createClient('my-app-name', config);
     * const data = await client.callAsInternalUser();
     * ```
     */
    readonly createClient: (
      type: string,
      clientConfig?: Partial<LegacyOpenSearchClientConfig>
    ) => ILegacyCustomClusterClient;

    /**
     * A pre-configured {@link ILegacyClusterClient | legacy OpenSearch client}.
     *
     * @example
     * ```js
     * const client = core.opensearch.legacy.client;
     * ```
     */
    readonly client: ILegacyClusterClient;
  };
}

/**
 * @internal
 */
export type InternalOpenSearchServiceStart = OpenSearchServiceStart;

/** @public */
export interface OpenSearchStatusMeta {
  warningNodes: NodesVersionCompatibility['warningNodes'];
  incompatibleNodes: NodesVersionCompatibility['incompatibleNodes'];
}

/**
 * Fake request object created manually by OpenSearch Dashboards plugins.
 * @public
 */
export interface FakeRequest {
  /** Headers used for authentication against OpenSearch */
  headers: Headers;
}

/**
 A user credentials container.
 * It accommodates the necessary auth credentials to impersonate the current user.
 *
 * @public
 * See {@link OpenSearchDashboardsRequest}.
 */
export type ScopeableRequest = OpenSearchDashboardsRequest | LegacyRequest | FakeRequest;
