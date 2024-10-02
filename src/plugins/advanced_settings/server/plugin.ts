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
  SharedGlobalConfig,
} from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { capabilitiesProvider } from './capabilities_provider';
import { UserUISettingsClientWrapper } from './saved_objects/user_ui_settings_client_wrapper';

export class AdvancedSettingsServerPlugin implements Plugin<object, object> {
  private readonly logger: Logger;
  private userUiSettingsClientWrapper?: UserUISettingsClientWrapper;
  private readonly globalConfig$: Observable<SharedGlobalConfig>;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.globalConfig$ = initializerContext.config.legacy.globalConfig$;
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('advancedSettings: Setup');

    core.capabilities.registerProvider(capabilitiesProvider);

    core.capabilities.registerSwitcher(async (request, capabilities) => {
      return await core.security.readonlyService().hideForReadonly(request, capabilities, {
        advancedSettings: {
          save: false,
        },
      });
    });

    const globalConfig = await this.globalConfig$.pipe(first()).toPromise();
    const isPermissionControlEnabled = globalConfig.savedObjects.permission.enabled === true;

    const userUiSettingsClientWrapper = new UserUISettingsClientWrapper(
      this.logger,
      isPermissionControlEnabled
    );
    this.userUiSettingsClientWrapper = userUiSettingsClientWrapper;
    core.savedObjects.addClientWrapper(
      3, // The wrapper should be triggered after workspace_id_consumer wrapper which id is -3 to avoid creating user settings within any workspace.
      'user_ui_settings',
      userUiSettingsClientWrapper.wrapperFactory
    );

    core.capabilities.registerSwitcher(async (request, capabilities) => {
      return {
        ...capabilities,
        userSettings: {
          enabled: false,
        },
      };
    });

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('advancedSettings: Started');
    this.userUiSettingsClientWrapper?.setCore(core);

    return {};
  }

  public stop() {}
}
