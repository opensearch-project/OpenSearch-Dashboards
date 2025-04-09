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

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  ILegacyClusterClient,
} from '../../../core/server';

import { dashboardSavedObjectType } from './saved_objects';
import { capabilitiesProvider } from './capabilities_provider';
import { DashboardPluginSetup, DashboardPluginStart } from './types';
import { setupRoutes } from './routes'; // <-- We'll define this next

export class DashboardPlugin implements Plugin<DashboardPluginSetup, DashboardPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('dashboard: Setup');

    core.savedObjects.registerType(dashboardSavedObjectType);
    core.capabilities.registerProvider(capabilitiesProvider);
    core.capabilities.registerSwitcher(async (request, capabilites) => {
      return await core.security.readonlyService().hideForReadonly(request, capabilites, {
        dashboard: {
          createNew: false,
          showWriteControls: false,
          saveQuery: false,
        },
      });
    });

    // Setup router and route handlers
    const router = core.http.createRouter();
    const legacyClient: ILegacyClusterClient = core.opensearch.legacy.createClient('dashboard_dsl');

    setupRoutes({ router, client: legacyClient });

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('dashboard: Started');
    return {};
  }

  public stop() {}
}
