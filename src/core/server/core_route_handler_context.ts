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

// eslint-disable-next-line max-classes-per-file
import { InternalCoreStart } from './internal_types';
import { OpenSearchDashboardsRequest } from './http/router';
import { SavedObjectsClientContract } from './saved_objects/types';
import { InternalSavedObjectsServiceStart, ISavedObjectTypeRegistry } from './saved_objects';
import {
  InternalOpenSearchServiceStart,
  IScopedClusterClient,
  LegacyScopedClusterClient,
} from './opensearch';
import { Auditor } from './audit_trail';
import { InternalUiSettingsServiceStart, IUiSettingsClient } from './ui_settings';

class CoreOpenSearchRouteHandlerContext {
  #client?: IScopedClusterClient;
  #legacy?: {
    client: Pick<LegacyScopedClusterClient, 'callAsInternalUser' | 'callAsCurrentUser'>;
  };

  constructor(
    private readonly opensearchStart: InternalOpenSearchServiceStart,
    private readonly request: OpenSearchDashboardsRequest
  ) {}

  public get client() {
    if (this.#client == null) {
      this.#client = this.opensearchStart.client.asScoped(this.request);
    }
    return this.#client;
  }

  public get legacy() {
    if (this.#legacy == null) {
      this.#legacy = {
        client: this.opensearchStart.legacy.client.asScoped(this.request),
      };
    }
    return this.#legacy;
  }
}

class CoreSavedObjectsRouteHandlerContext {
  constructor(
    private readonly savedObjectsStart: InternalSavedObjectsServiceStart,
    private readonly request: OpenSearchDashboardsRequest
  ) {}
  #scopedSavedObjectsClient?: SavedObjectsClientContract;
  #typeRegistry?: ISavedObjectTypeRegistry;

  public get client() {
    if (this.#scopedSavedObjectsClient == null) {
      this.#scopedSavedObjectsClient = this.savedObjectsStart.getScopedClient(this.request);
    }
    return this.#scopedSavedObjectsClient;
  }

  public get typeRegistry() {
    if (this.#typeRegistry == null) {
      this.#typeRegistry = this.savedObjectsStart.getTypeRegistry();
    }
    return this.#typeRegistry;
  }
}

class CoreUiSettingsRouteHandlerContext {
  #client?: IUiSettingsClient;
  constructor(
    private readonly uiSettingsStart: InternalUiSettingsServiceStart,
    private readonly savedObjectsRouterHandlerContext: CoreSavedObjectsRouteHandlerContext
  ) {}

  public get client() {
    if (this.#client == null) {
      this.#client = this.uiSettingsStart.asScopedToClient(
        this.savedObjectsRouterHandlerContext.client
      );
    }
    return this.#client;
  }
}

export class CoreRouteHandlerContext {
  #auditor?: Auditor;

  readonly opensearch: CoreOpenSearchRouteHandlerContext;
  readonly savedObjects: CoreSavedObjectsRouteHandlerContext;
  readonly uiSettings: CoreUiSettingsRouteHandlerContext;

  constructor(
    private readonly coreStart: InternalCoreStart,
    private readonly request: OpenSearchDashboardsRequest
  ) {
    this.opensearch = new CoreOpenSearchRouteHandlerContext(
      this.coreStart.opensearch,
      this.request
    );
    this.savedObjects = new CoreSavedObjectsRouteHandlerContext(
      this.coreStart.savedObjects,
      this.request
    );
    this.uiSettings = new CoreUiSettingsRouteHandlerContext(
      this.coreStart.uiSettings,
      this.savedObjects
    );
  }

  public get auditor() {
    if (this.#auditor == null) {
      this.#auditor = this.coreStart.auditTrail.asScoped(this.request);
    }
    return this.#auditor;
  }
}
